const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const express = require("express");
const getReply = require("./replies");
const qrcode = require("qrcode-terminal");
const cors = require("cors");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

let latestQR = "";
let isBotReady = false;
let client;

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// ==================
// Data storage
// ==================
const DATA_FILE = "./data.json";

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        messages: [],
        blacklist: [],
        stats: { received: 0, replied: 0 },
      },
      null,
      2,
    ),
  );
}

const data = JSON.parse(fs.readFileSync(DATA_FILE));
const saveData = () =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Track processed messages to prevent duplicates
const processedMessages = new Set();
const MESSAGE_CACHE_DURATION = 60000; // 1 minute

// Clean old message IDs periodically
setInterval(() => {
  processedMessages.clear();
}, MESSAGE_CACHE_DURATION);

// ==================
// WhatsApp Client Logic
// ==================
function startBot() {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: "mano-bot" }),
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr) => {
    latestQR = qr;
    console.log("NEW QR RECEIVED");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    latestQR = "";
    isBotReady = true;
    console.log("BOT READY");
  });

  client.on("message", async (msg) => {
    if (msg.fromMe || msg.from.endsWith("@g.us") || !msg.body) return;

    const messageId = `${msg.from}_${msg.timestamp}_${msg.body}`;

    if (processedMessages.has(messageId)) {
      console.log("Duplicate message detected, skipping:", messageId);
      return;
    }

    processedMessages.add(messageId);

    const text = msg.body.toLowerCase().trim();
    const from = msg.from;

    console.log("Message received:", text, "from:", from);
    data.stats.received++;

    const replyText = getReply(text);

    if (replyText) {
      try {
        const chat = await msg.getChat();
        await chat.sendMessage(replyText, { sendSeen: false });

        console.log("Reply sent to:", from);

        data.stats.replied++;
        data.messages.push({
          from,
          text,
          reply: replyText,
          time: new Date().toISOString(),
        });
        saveData();
      } catch (sendError) {
        console.error("Failed to send reply:", sendError.message);
      }
    }
  });

  client.on("disconnected", (reason) => {
    console.log("Client was logged out", reason);
    isBotReady = false;
  });

  client
    .initialize()
    .catch((err) => console.error("Initialization error:", err.message));
}

// ==================
// API Endpoints
// ==================
app.get("/api/status", (req, res) => {
  res.json({
    stats: data.stats,
    qr: latestQR,
    active: isBotReady,
  });
});

app.get("/api/messages", (req, res) => {
  res.json(data.messages.slice(-10).reverse());
});

app.post("/api/logout", async (req, res) => {
  try {
    console.log("Logout request received");
    isBotReady = false;
    latestQR = "";
    data.messages = [];
    data.stats = { received: 0, replied: 0 };
    saveData();

    if (client) {
      await client.logout().catch(() => console.log("Session already cleared"));
      await client.destroy();
    }

    res.json({ success: true, message: "Restarting clean session" });

    setTimeout(() => {
      console.log("Restarting client");
      startBot();
    }, 5000);
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ error: "Reset failed" });
  }
});

app.post("/api/send", async (req, res) => {
  let { number, message } = req.body;

  if (!isBotReady) {
    return res.status(500).json({ error: "Bot is not connected" });
  }

  try {
    let cleanNumber = number.replace(/\D/g, "");
    if (cleanNumber.startsWith("00")) cleanNumber = cleanNumber.substring(2);
    if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.substring(1);

    const chatId = cleanNumber.includes("@c.us")
      ? cleanNumber
      : `${cleanNumber}@c.us`;

    const chat = await client.getChatById(chatId);
    await chat.sendMessage(message, { sendSeen: false });

    console.log(`Manual message sent to ${chatId}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Manual send error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Endpoint for sending to multiple numbers (used by Python script and frontend)
app.post("/api/send-bulk", async (req, res) => {
  let { numbers, message } = req.body;

  if (!isBotReady) {
    return res.status(500).json({ error: "Bot is not connected" });
  }

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: "Invalid numbers array" });
  }

  const results = [];

  for (const number of numbers) {
    try {
      let cleanNumber = number.replace(/\D/g, "");
      if (cleanNumber.startsWith("00")) cleanNumber = cleanNumber.substring(2);
      if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.substring(1);

      const chatId = cleanNumber.includes("@c.us")
        ? cleanNumber
        : `${cleanNumber}@c.us`;

      const chat = await client.getChatById(chatId);
      await chat.sendMessage(message, { sendSeen: false });

      console.log(`Bulk message sent to ${chatId}`);
      results.push({ number, success: true });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`Failed to send to ${number}:`, err.message);
      results.push({ number, success: false, error: err.message });
    }
  }

  res.json({ results });
});

// UPDATE: Run Python script to fetch latest numbers from sheet
app.post("/api/update-sheet", async (req, res) => {
  try {
    // Look for the key in Environment Variables
    const keyData = process.env.GOOGLE_CREDS_JSON
      ? JSON.parse(process.env.GOOGLE_CREDS_JSON)
      : require("./credsAPI.json"); // Fallback for local testing

    const SCOPES = [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
    ];

    const auth = new JWT({
      email: keyData.client_email,
      key: keyData.private_key.replace(/\\n/g, '\n'), // Critical fix for Railway
      scopes: SCOPES,
    });

    const doc = new GoogleSpreadsheet("1n_YhhtYk4ZiMHOhOl5m5QSz_XCAq8KD3blRvf_tZ-As", auth);
    // ... (rest of your existing row processing code)

// SEND: Send message to all numbers from sheet file
app.post("/api/send-from-sheet", async (req, res) => {
  const { message } = req.body;

  if (!isBotReady)
    return res.status(500).json({ error: "Bot is not connected" });
  if (!message) return res.status(400).json({ error: "Message is required" });

  // Use the memory variable instead of reading a file
  const numbers = global.sheetNumbers;

  if (!numbers || numbers.length === 0) {
    return res
      .status(404)
      .json({ error: "No numbers in memory. Click UPDATE first." });
  }

  console.log(`📤 Sending to ${numbers.length} numbers from memory...`);
  const results = [];

  for (const number of numbers) {
    try {
      let cleanNumber = number.replace(/\D/g, "");
      if (cleanNumber.startsWith("00")) cleanNumber = cleanNumber.substring(2);
      if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.substring(1);

      const chatId = cleanNumber.includes("@c.us")
        ? cleanNumber
        : `${cleanNumber}@c.us`;

      const chat = await client.getChatById(chatId);
      await chat.sendMessage(message, { sendSeen: false });

      console.log(`✅ Sent to ${chatId}`);
      results.push({ number, success: true });

      // Anti-ban delay (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(`❌ Failed: ${number}`, err.message);
      results.push({ number, success: false, error: err.message });
    }
  }

  // Clear memory after sending to keep things clean
  global.sheetNumbers = [];
  res.json({ results, total: results.length });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API Bridge running on port ${port}`);
  startBot();
});
