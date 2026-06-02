import { Router } from "express";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { User } from "../models/user.js";
import { FormIntegration } from "../models/formIntegration.js";
import { Request } from "../models/request.js";
import { FormFeedback } from "../models/formFeedback.js";
import { GoogleAccount } from "../models/googleAccount.js";
import { IntegrationEvent } from "../models/integrationEvent.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { revokeGoogleToken } from "../services/googleService.js";
import { env } from "../config/env.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get("/overview", async (_req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const last7DaysStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      recentUsers,
      totalIntegrations,
      readyIntegrations,
      configuredIntegrations,
      connectedIntegrations,
      brokenIntegrations,
      totalRequests,
      todayRequests,
      last7DaysRequests,
      totalFeedback,
      newFeedback,
      recentFeedback
    ] = await Promise.all([
      User.count(),
      User.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: ["id", "fullName", "email", "createdAt"]
      }),
      FormIntegration.count(),
      FormIntegration.count({ where: { status: "ready" } }),
      FormIntegration.count({ where: { scenarioConfiguredAt: { [Op.ne]: null } } }),
      FormIntegration.count({ where: { status: "connected" } }),
      FormIntegration.count({ where: { healthStatus: "broken" } }),
      Request.count(),
      Request.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      Request.count({ where: { createdAt: { [Op.gte]: last7DaysStart } } }),
      FormFeedback.count(),
      FormFeedback.count({ where: { status: "new" } }),
      FormFeedback.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
        attributes: ["id", "userId", "formId", "scenario", "message", "status", "createdAt"]
      })
    ]);

    res.json({
      users: {
        total: totalUsers,
        last24hLogins: null,
        recentUsers
      },
      forms: {
        totalIntegrations,
        ready: readyIntegrations,
        configured: configuredIntegrations,
        connected: connectedIntegrations,
        broken: brokenIntegrations
      },
      requests: {
        total: totalRequests,
        today: todayRequests,
        last7Days: last7DaysRequests
      },
      feedback: {
        total: totalFeedback,
        new: newFeedback,
        recent: recentFeedback
      },
      system: {
        nodeEnv: env.nodeEnv,
        aiConfigured: Boolean(process.env.OPENAI_API_KEY),
        openaiModel: process.env.OPENAI_MODEL || "gpt-5-nano"
      }
    });
  } catch (err) {
    console.error("[admin/overview]", err);
    res.status(500).json({ error: "Failed to load overview" });
  }
});

adminRoutes.get("/feedback", async (_req, res) => {
  try {
    const items = await FormFeedback.findAll({
      order: [["createdAt", "DESC"]],
      limit: 50,
      attributes: ["id", "userId", "formId", "scenario", "message", "status", "createdAt"]
    });

    const userIds = [...new Set(items.map((f) => f.userId))];
    const users = userIds.length > 0
      ? await User.findAll({ where: { id: userIds }, attributes: ["id", "email", "fullName"] })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const result = items.map((f) => ({
      id: f.id,
      userId: f.userId,
      userEmail: userMap[f.userId]?.email || null,
      userName: userMap[f.userId]?.fullName || null,
      formId: f.formId,
      scenario: f.scenario,
      message: f.message,
      status: f.status,
      createdAt: f.createdAt
    }));

    res.json(result);
  } catch (err) {
    console.error("[admin/feedback]", err);
    res.status(500).json({ error: "Failed to load feedback" });
  }
});

adminRoutes.post("/users/clear-data", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const confirmEmail = String(req.body?.confirmEmail || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  if (email !== confirmEmail) {
    return res.status(400).json({ error: "Email confirmation does not match" });
  }

  try {
    const tokensToRevoke = [];
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findOne({
        where: sequelize.where(sequelize.fn("lower", sequelize.col("email")), email),
        transaction
      });

      const googleAccountWhere = user
        ? {
            [Op.or]: [
              { userId: user.id },
              sequelize.where(sequelize.fn("lower", sequelize.col("email")), email)
            ]
          }
        : sequelize.where(sequelize.fn("lower", sequelize.col("email")), email);

      const googleAccountRows = await GoogleAccount.findAll({
        where: googleAccountWhere,
        transaction
      });
      const googleAccountIds = googleAccountRows.map((item) => item.id);
      for (const account of googleAccountRows) {
        if (account.refreshToken) tokensToRevoke.push(account.refreshToken);
        else if (account.accessToken) tokensToRevoke.push(account.accessToken);
      }

      const integrationWhereParts = [];
      if (user) integrationWhereParts.push({ userId: user.id });
      if (googleAccountIds.length) integrationWhereParts.push({ googleAccountId: { [Op.in]: googleAccountIds } });

      const integrations = integrationWhereParts.length
        ? await FormIntegration.findAll({
            where: { [Op.or]: integrationWhereParts },
            attributes: ["id", "formId"],
            transaction
          })
        : [];
      const integrationIds = integrations.map((item) => item.id);
      const formIds = integrations.map((item) => item.formId).filter(Boolean);

      if (!user && !googleAccountRows.length && !integrations.length) {
        return {
          found: false,
          email,
          deleted: {
            users: 0,
            googleAccounts: 0,
            integrations: 0,
            requests: 0,
            integrationEvents: 0,
            notificationSettings: 0,
            feedback: 0
          }
        };
      }

      const requests = formIds.length
        ? await Request.findAll({
            where: { formId: { [Op.in]: formIds } },
            attributes: ["id"],
            transaction
          })
        : [];
      const requestIds = requests.map((item) => item.id);

      let integrationEvents = 0;
      if (integrationIds.length || requestIds.length) {
        integrationEvents = await IntegrationEvent.destroy({
          where: {
            [Op.or]: [
              integrationIds.length ? { integrationId: { [Op.in]: integrationIds } } : null,
              requestIds.length ? { requestId: { [Op.in]: requestIds } } : null
            ].filter(Boolean)
          },
          transaction
        });
      }

      const notificationSettings = await NotificationSettings.destroy({
        where: {
          [Op.or]: [
            user ? { userId: user.id } : null,
            formIds.length ? { formId: { [Op.in]: formIds } } : null
          ].filter(Boolean)
        },
        transaction
      });

      const feedback = await FormFeedback.destroy({
        where: {
          [Op.or]: [
            user ? { userId: user.id } : null,
            formIds.length ? { formId: { [Op.in]: formIds } } : null
          ].filter(Boolean)
        },
        transaction
      });

      const deletedRequests = formIds.length
        ? await Request.destroy({ where: { formId: { [Op.in]: formIds } }, transaction })
        : 0;

      const deletedIntegrations = await FormIntegration.destroy({
        where: { id: { [Op.in]: integrationIds } },
        transaction
      });

      const googleAccounts = googleAccountIds.length
        ? await GoogleAccount.destroy({
            where: { id: { [Op.in]: googleAccountIds } },
            transaction
          })
        : 0;

      const users = user
        ? await User.destroy({
            where: { id: user.id },
            transaction
          })
        : 0;

      return {
        found: true,
        email,
        deleted: {
          users,
          googleAccounts,
          integrations: deletedIntegrations,
          requests: deletedRequests,
          integrationEvents,
          notificationSettings,
          feedback
        }
      };
    });

    const revokedTokens = [];
    for (const token of [...new Set(tokensToRevoke)]) {
      if (await revokeGoogleToken(token)) revokedTokens.push(token);
    }

    res.json({ ok: true, ...result, revokedGoogleTokens: revokedTokens.length });
  } catch (err) {
    console.error("[admin/users/clear-data]", err);
    res.status(500).json({ error: "Failed to clear user data" });
  }
});

adminRoutes.patch("/feedback/:id", async (req, res) => {
  try {
    const allowed = ["new", "reviewed", "done"];
    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const item = await FormFeedback.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });

    await item.update({ status });
    res.json({ ok: true, status: item.status });
  } catch (err) {
    console.error("[admin/feedback patch]", err);
    res.status(500).json({ error: "Failed to update feedback" });
  }
});
