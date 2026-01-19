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

  client.on("message", async (msg) => {
    if (msg.fromMe || msg.from.endsWith("@g.us") || !msg.body) return;
    const messageId = `${msg.from}_${msg.timestamp}_${msg.body}`;
    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);

    const text = msg.body.toLowerCase().trim();
    data.stats.received++;
    const replyText = getReply(text);

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
        console.error("Send error:", e.message);
      }
    }
  });

  client.on("disconnected", () => {
    isBotReady = false;
  });
  client.initialize().catch((err) => console.error("Init error:", err.message));
}

app.get("/api/status", (req, res) =>
  res.json({ stats: data.stats, qr: latestQR, active: isBotReady }),
);
app.get("/api/messages", (req, res) =>
  res.json(data.messages.slice(-10).reverse()),
);

app.post("/api/update-sheet", async (req, res) => {
  try {
    let keyData;
    if (process.env.GOOGLE_CREDS_JSON) {
      keyData = JSON.parse(process.env.GOOGLE_CREDS_JSON);
    } else {
      keyData = require("./credsAPI.json");
    }

    const auth = new JWT({
      email: keyData.client_email,
      key: keyData.private_key.replace(/\\n/g, "\n"),
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    });

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

    global.sheetNumbers = numbers;
    res.json({ success: true, count: numbers.length });
  } catch (err) {
    console.error("Sheet Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/send-from-sheet", async (req, res) => {
  const { message } = req.body;
  if (!isBotReady || !message || !global.sheetNumbers)
    return res.status(400).json({ error: "Not ready" });

  for (const number of global.sheetNumbers) {
    try {
      const chat = await client.getChatById(
        `${number.replace(/\D/g, "")}@c.us`,
      );
      await chat.sendMessage(message, { sendSeen: false });
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.error("Bulk error:", e.message);
    }
  }
  global.sheetNumbers = [];
  res.json({ success: true });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server on ${port}`);
  startBot();
});
