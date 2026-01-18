const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const express = require("express");
const getReply = require("./replies");
const qrcode = require("qrcode-terminal");
const cors = require("cors");

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
    const { exec } = require("child_process");
    const path = require("path");

    const pythonScript = path.join(__dirname, "sheet.py");

    // Try python3 first (Linux/Mac), fall back to python (Windows)
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    exec(`${pythonCmd} "${pythonScript}"`, (error, stdout, stderr) => {
      if (error) {
        console.error("Python script error:", error);
        return res.status(500).json({ error: "Failed to run Python script" });
      }

      console.log("Python output:", stdout);

      // Read the generated file
      const NUMBERS_FILE = "./sheet_numbers.json";
      if (fs.existsSync(NUMBERS_FILE)) {
        const fileContent = fs.readFileSync(NUMBERS_FILE, "utf8");
        const { numbers } = JSON.parse(fileContent);
        res.json({ success: true, count: numbers.length });
      } else {
        res.status(500).json({ error: "Numbers file not created" });
      }
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// SEND: Send message to all numbers from sheet file
app.post("/api/send-from-sheet", async (req, res) => {
  const { message } = req.body;

  if (!isBotReady) {
    return res.status(500).json({ error: "Bot is not connected" });
  }

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const NUMBERS_FILE = "./sheet_numbers.json";

    if (!fs.existsSync(NUMBERS_FILE)) {
      return res.status(404).json({
        error: "Click UPDATE first to fetch numbers from sheet",
      });
    }

    const fileContent = fs.readFileSync(NUMBERS_FILE, "utf8");
    const { numbers } = JSON.parse(fileContent);

    if (!numbers || numbers.length === 0) {
      return res.status(400).json({ error: "No numbers found" });
    }

    console.log(`📤 Sending to ${numbers.length} numbers...`);

    const results = [];

    for (const number of numbers) {
      try {
        let cleanNumber = number.replace(/\D/g, "");
        if (cleanNumber.startsWith("00"))
          cleanNumber = cleanNumber.substring(2);
        if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.substring(1);

        const chatId = cleanNumber.includes("@c.us")
          ? cleanNumber
          : `${cleanNumber}@c.us`;

        const chat = await client.getChatById(chatId);
        await chat.sendMessage(message, { sendSeen: false });

        console.log(`✅ Sent to ${chatId}`);
        results.push({ number, success: true });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`❌ Failed: ${number}`, err.message);
        results.push({ number, success: false, error: err.message });
      }
    }

    res.json({ results, total: numbers.length });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API Bridge running on port ${port}`);
  startBot();
});
