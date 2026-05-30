import qrcodeTerminal from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

let client = null;
let qrDataUrl = null;
// disconnected | connecting | qr_ready | connected | error
let connectionStatus = "disconnected";

export function getStatus() {
  return { status: connectionStatus };
}

export function initClient() {
  if (client || connectionStatus === "connecting" || connectionStatus === "qr_ready") return;

  connectionStatus = "connecting";
  qrDataUrl = null;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./whatsapp-session" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
  });

  client.on("qr", (qr) => {
    connectionStatus = "qr_ready";
    console.log("\n[WhatsApp] Сканируйте QR-код телефоном:");
    qrcodeTerminal.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    connectionStatus = "connecting";
    console.log("[WhatsApp] Authenticated");
  });

  client.on("ready", () => {
    connectionStatus = "connected";
    console.log("[WhatsApp] Client ready — messages can be sent");
  });

  client.on("auth_failure", (msg) => {
    connectionStatus = "error";
    client = null;
    console.error("[WhatsApp] Auth failure:", msg);
  });

  client.on("disconnected", (reason) => {
    connectionStatus = "disconnected";
    client = null;
    console.log("[WhatsApp] Disconnected:", reason);
  });

  // fire-and-forget; status is polled by the frontend
  client.initialize().catch((err) => {
    console.error("[WhatsApp] Initialize error:", err.message);
    connectionStatus = "error";
    client = null;
  });
}

export async function destroyClient() {
  if (!client) return;
  try {
    await client.destroy();
  } catch (_) {
    // ignore destroy errors
  }
  client = null;
  connectionStatus = "disconnected";
}

function isDetachedBrowserError(error) {
  return /detached frame|target closed|session closed|protocol error/i.test(error?.message || "");
}

export async function sendMessage(phoneNumber, text) {
  if (!client || connectionStatus !== "connected") {
    throw new Error("WhatsApp client is not connected");
  }
  const digits = String(phoneNumber).replace(/\D/g, "");
  const chatId = `${digits}@c.us`;
  try {
    await client.sendMessage(chatId, text);
  } catch (error) {
    if (isDetachedBrowserError(error)) {
      connectionStatus = "error";
      const staleClient = client;
      client = null;
      await staleClient.destroy().catch(() => {});
    }
    throw error;
  }
}
