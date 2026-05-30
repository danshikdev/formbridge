import { NotificationSettings } from "../models/notificationSettings.js";

export async function getNotificationSettings(req, res) {
  try {
    const { formId } = req.params;
    const userId = req.user.id;

    const settings = await NotificationSettings.findOne({
      where: { userId, formId, channel: "whatsapp" }
    });

    if (!settings) {
      return res.json({
        enabled: false,
        phoneNumber: "",
        mode: "every_submission",
        thresholdCount: null,
        channel: "whatsapp"
      });
    }

    res.json({
      id: settings.id,
      enabled: settings.enabled,
      phoneNumber: settings.phoneNumber || "",
      mode: settings.mode,
      thresholdCount: settings.thresholdCount,
      channel: settings.channel
    });
  } catch (err) {
    console.error("getNotificationSettings:", err.message);
    res.status(500).json({ error: "Failed to load notification settings" });
  }
}

export async function upsertNotificationSettings(req, res) {
  try {
    const { formId } = req.params;
    const userId = req.user.id;
    const { enabled, phoneNumber, mode, thresholdCount } = req.body;
    const nextEnabled = Boolean(enabled);
    const nextPhoneNumber = phoneNumber ? String(phoneNumber).trim() : "";
    const nextMode = ["every_submission", "threshold", "daily_summary"].includes(mode)
      ? mode
      : "every_submission";
    const nextThresholdCount = Number.parseInt(thresholdCount, 10);

    if (nextEnabled && !nextPhoneNumber) {
      return res.status(400).json({ error: "WhatsApp number is required when notifications are enabled" });
    }

    if (nextMode === "threshold" && (!Number.isFinite(nextThresholdCount) || nextThresholdCount < 1)) {
      return res.status(400).json({ error: "Threshold count must be at least 1" });
    }

    const [settings] = await NotificationSettings.findOrCreate({
      where: { userId, formId, channel: "whatsapp" },
      defaults: {
        enabled: false,
        phoneNumber: null,
        mode: "every_submission",
        thresholdCount: null
      }
    });

    await settings.update({
      enabled: nextEnabled,
      phoneNumber: nextPhoneNumber || null,
      mode: nextMode,
      thresholdCount: nextMode === "threshold" ? nextThresholdCount : null
    });

    res.json({
      id: settings.id,
      enabled: settings.enabled,
      phoneNumber: settings.phoneNumber || "",
      mode: settings.mode,
      thresholdCount: settings.thresholdCount,
      channel: settings.channel
    });
  } catch (err) {
    console.error("upsertNotificationSettings:", err.message);
    res.status(500).json({ error: "Failed to save notification settings" });
  }
}
