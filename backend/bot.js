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
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
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

    const text = msg.body.toLowerCase().trim();
    const from = msg.from;

    console.log("Message received:", text);
    data.stats.received++;

    const replyText = getReply(text);

    if (replyText) {
      try {
        const chat = await msg.getChat();
        await chat.sendMessage(replyText, { sendSeen: false });

        console.log("Reply sent via Chat Object");

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

app.listen(port, () => {
  console.log(`API Bridge running on port ${port}`);
  startBot();
});
