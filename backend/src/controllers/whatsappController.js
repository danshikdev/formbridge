import { destroyClient, getStatus, initClient, sendMessage } from "../services/whatsappService.js";

export function whatsappStatus(req, res) {
  res.json(getStatus());
}

export function whatsappConnect(req, res) {
  initClient();
  res.json({ ok: true, ...getStatus() });
}

export async function whatsappDisconnect(req, res) {
  await destroyClient();
  res.json({ ok: true });
}

export async function whatsappTestSend(req, res) {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber required" });

  try {
    const text = message || "FormBridge: тестовое сообщение.";
    await sendMessage(phoneNumber, text);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
