const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const express = require("express");
const getReply = require("./replies");
const qrcode = require("qrcode-terminal");
const cors = require("cors");
// using modern, official google sheet apis for better compatibility with web
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

let latestQR = "";
let isBotReady = false;
let client;

const app = express();
// dynamic port switch
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const DATA_FILE = "./data.json";
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      { messages: [], blacklist: [], stats: { received: 0, replied: 0 } },
      null,
      2,
    ),
  );
}

const data = JSON.parse(fs.readFileSync(DATA_FILE));
const saveData = () =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// setting to prevent duplicate message
const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 60000);

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
      protocolTimeout: 0, //<-- important to avoid loops
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
    qrcode.generate(qr, { small: true });
  });
  client.on("ready", () => {
    latestQR = "";
    isBotReady = true;
    console.log("BOT READY");
  });
  client.on("disconnected", () => {
    isBotReady = false;
  });

  // auto replies
  client.on("message", async (msg) => {
    if (msg.fromMe || msg.from.endsWith("@g.us") || !msg.body) return;

    // setting a really unique id to prevent duplicated messages
    const messageId = `${msg.from}_${msg.timestamp}_${msg.body}`;

    // don't send it again if it already was sent
    if (processedMessages.has(messageId)) return;

    // sent it if wasn't sent before
    processedMessages.add(messageId);

    const text = msg.body.toLowerCase().trim();
    data.stats.received++;

    const replyText = getReply(text);

    // normal auto reply logic
    if (replyText) {
      try {
        const chat = await msg.getChat();
        await chat.sendMessage(replyText, { sendSeen: false });
        data.stats.replied++;
        data.messages.push({
          from: msg.from,
          text,
          reply: replyText,
          time: new Date().toISOString(),
        });
        saveData();
      } catch (e) {
        console.error("Reply error:", e.message);
      }
    }
  });

  client.initialize().catch((err) => console.error("Init error:", err.message));
}

// --------------------------------------------
// END POINT FOR FRONT END (DO NOT TOUCH THAT)
// --------------------------------------------

// gettin bot status
app.get("/api/status", (req, res) =>
  res.json({ stats: data.stats, qr: latestQR, active: isBotReady }),
);

// getting messages that was sent this session only last 10
app.get("/api/messages", (req, res) => {
  res.json(data.messages ? data.messages.slice(-10).reverse() : []);
});

// for sending to single number
app.post("/api/send", async (req, res) => {
  const { number, message } = req.body;
  if (!isBotReady) return res.status(500).json({ error: "Bot not connected" });
  try {
    const chatId = `${number.replace(/\D/g, "")}@c.us`;
    await client.sendMessage(chatId, message, { sendSeen: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// for sending to multiple numbers
app.post("/api/send-bulk", async (req, res) => {
  const { numbers, message } = req.body;

  if (!isBotReady) {
    return res.status(500).json({ error: "Bot not connected", results: [] });
  }

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: "No numbers provided", results: [] });
  }

  const results = [];

  for (const number of numbers) {
    try {
      const chatId = `${number.replace(/\D/g, "")}@c.us`;
      await client.sendMessage(chatId, message, { sendSeen: false });

      results.push({ number, success: true });
      // 3 seconds delay
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.error(`Failed to send to ${number}:`, e.message);
      results.push({ number, success: false, error: e.message });
    }
  }

  res.json({
    success: true,
    results,
    total: numbers.length,
  });
});

// getting numbers from
// using directly the googlesheet api official libraries
app.post("/api/update-sheet", async (req, res) => {
  try {
    // google credentials are saved in railway variables or in ./google_creds.json
    // kindly in case of new key assure to update them coeectly
    // be aware of github security do not push it (include in .gitignore) as the key will be disabled if get's exposed الله يرضى عليك
    const keyData = process.env.GOOGLE_CREDS_JSON
      ? JSON.parse(process.env.GOOGLE_CREDS_JSON)
      : require("./google_creds.json");
    const auth = new JWT({
      email: keyData.client_email,
      // assuring line breakers to break the line instead acting as actual \n text
      key: keyData.private_key.replace(/\\n/g, "\n"),
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    });
    // sheet id
    const doc = new GoogleSpreadsheet(
      "1n_YhhtYk4ZiMHOhOl5m5QSz_XCAq8KD3blRvf_tZ-As",
      auth,
    );
    await doc.loadInfo();
    const rows = await doc.sheetsByIndex[0].getRows();
    const numbers = [];
    rows.forEach((row) => {
      const d = row.toObject();
      const phoneKey = Object.keys(d).find(
        (k) => k.trim().toLowerCase() === "phone",
      );
      if (d[phoneKey]) {
        let p = String(d[phoneKey]).replace(/\D/g, "");
        if (p.startsWith("00")) p = p.substring(2);
        if (p.startsWith("1") && p.length === 10) p = "20" + p;
        if (p.length >= 11) numbers.push(p);
      }
    });
    // saving numbers
    global.sheetNumbers = numbers;
    res.json({ success: true, count: numbers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// send a custome message to all the numbers in the sheet
app.post("/api/send-from-sheet", async (req, res) => {
  const { message } = req.body;
  if (!isBotReady || !global.sheetNumbers)
    return res.status(400).json({ error: "Not ready" });
  const results = [];
  for (const number of global.sheetNumbers) {
    try {
      const chatId = `${number.replace(/\D/g, "")}@c.us`;
      await client.sendMessage(chatId, message, { sendSeen: false });
      results.push({ number, success: true });

      // 2 seconds delay to avoid rate limit hit
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      results.push({ number, success: false, error: e.message });
    }
  }
  // clearing numbers to avoid memory leak or space complxity over long term or extreme usage
  global.sheetNumbers = [];
  res.json({ success: true, results, total: results.length });
});

// logging out
app.post("/api/logout", async (req, res) => {
  try {
    if (client) {
      //session termination
      await client.logout();

      // reset bot status
      isBotReady = false;
      latestQR = "";

      // re0generate new qr-code for a new user
      await client.initialize();
    }
    res.json({ success: true, message: "Logged out. New QR generating..." });
  } catch (e) {
    console.error("Logout Error:", e.message);

    // fallback incase browser it self fails inside railwat .. kill it all :) start clean
    res.json({ success: false, error: e.message });
    process.exit(1);
  }
});

// important for the app to get connected to each other
app.listen(port, "0.0.0.0", () => {
  console.log(`Server on ${port}`);
  startBot();
});
