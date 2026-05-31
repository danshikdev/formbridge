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

export function normalizeWhatsAppPhoneNumber(phoneNumber) {
  const digits = String(phoneNumber).replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 11 && digits.startsWith("8")) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  throw new Error("Enter a valid Kazakhstan WhatsApp number, for example +7 777 123 45 67");
}

function normalizePhoneNumber(phoneNumber) {
  const normalized = normalizeWhatsAppPhoneNumber(phoneNumber);
  if (!normalized) {
    throw new Error("WhatsApp number is required");
  }
  return normalized.replace(/\D/g, "");
}

export async function sendMessage(phoneNumber, text) {
  if (!client || connectionStatus !== "connected") {
    throw new Error("WhatsApp client is not connected");
  }
  const digits = normalizePhoneNumber(phoneNumber);
  try {
    const numberId = await client.getNumberId(digits);
    if (!numberId?._serialized) {
      throw new Error(`WhatsApp account not found for ${digits}`);
    }
    await client.sendMessage(numberId._serialized, text);
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
