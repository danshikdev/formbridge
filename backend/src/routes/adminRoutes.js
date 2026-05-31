import { Router } from "express";
import { Op } from "sequelize";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { User } from "../models/user.js";
import { FormIntegration } from "../models/formIntegration.js";
import { Request } from "../models/request.js";
import { FormFeedback } from "../models/formFeedback.js";
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
