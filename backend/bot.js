const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const express = require("express");
const getReply = require("./replies");
const qrcode = require("qrcode-terminal");
const cors = require("cors");
// using modern, official google sheet apis for better compatibility with web
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const http = require("http");
const { Server } = require("socket.io");

let latestQR = "";
let isBotReady = false;
let client;

const app = express();
const server = http.createServer(app);
// dynamic port switch
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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

// helper function to broadcast status updates
const broadcastStatus = () => {
  io.emit("status_update", {
    stats: data.stats,
    qr: latestQR,
    active: isBotReady,
  });
};

// this is our safety .. in case of safe limit hit .. delay applied
const replyQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || replyQueue.length === 0) return;
  isProcessingQueue = true;

  while (replyQueue.length > 0) {
    const { chat, replyText } = replyQueue.shift();
    try {
      // Crucial: keeping sendSeen: false
      await chat.sendMessage(replyText, { sendSeen: false });
      // 3 seconds safety gap for Railway Free Tier
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.error("Queue send error:", e.message);
    }
  }
  isProcessingQueue = false;
}

// -------------------
// ARAISE :)
// -------------------
function startBot() {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: "mano-bot" }),
    //this might break the whole app if whatsapp forces a higher version
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
    broadcastStatus();
  });
  client.on("ready", () => {
    latestQR = "";
    isBotReady = true;
    console.log("BOT READY");
    broadcastStatus();
  });
  client.on("disconnected", () => {
    isBotReady = false;
  });

  // auto replies
  // client.on("message", async (msg) => {
  //   if (msg.fromMe || msg.from.endsWith("@g.us") || !msg.body) return;

  //   // setting a really unique id to prevent duplicated messages
  //   const messageId = `${msg.from}_${msg.timestamp}_${msg.body}`;

  //   // don't send it again if it already was sent
  //   if (processedMessages.has(messageId)) return;

  //   // sent it if wasn't sent before
  //   processedMessages.add(messageId);

  //   const text = msg.body.toLowerCase().trim();
  //   data.stats.received++;

  //   const replyText = getReply(text);

  //   // normal auto reply logic
  //   if (replyText) {
  //     try {
  //       const chat = await msg.getChat();

  //       // Add to queue instead of sending immediately
  //       replyQueue.push({ chat, replyText });

  //       data.stats.replied++;
  //       data.messages.push({
  //         from: msg.from,
  //         text,
  //         reply: replyText,
  //         time: new Date().toISOString(),
  //       });
  //       saveData();

  //       // immediate ui update
  //       io.emit(
  //         "messages_update",
  //         data.messages ? data.messages.slice(-10).reverse() : [],
  //       );

  //       // Start processing the queue
  //       processQueue();

  //       // Update UI via Socket.io
  //       io.emit(
  //         "messages_update",
  //         data.messages ? data.messages.slice(-10).reverse() : [],
  //       );
  //       broadcastStatus();
  //     } catch (e) {
  //       console.error("Reply error:", e.message);
  //     }
  //   }
  // });

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
  if (!isBotReady) return res.status(500).json({ error: "Bot offline" });

  const results = [];
  let batchCounter = 0;

  console.log(`--- Starting Manual Bulk: ${numbers.length} numbers ---`);

  for (const number of numbers) {
    try {
      const cleanNumber = number.replace(/\D/g, "");
      const chatId = `${cleanNumber}@c.us`;

      // Check if number is registered to avoid crash
      const isRegistered = await client.isRegisteredUser(chatId);
      if (!isRegistered) {
        console.log(`[SKIPPED] ${cleanNumber} - Not on WhatsApp`);
        results.push({ number: cleanNumber, success: false });
        continue;
      }

      await client.sendMessage(chatId, message, { sendSeen: false });
      console.log(
        `[SENT] ${cleanNumber} (${results.length + 1}/${numbers.length})`,
      );
      results.push({ number: cleanNumber, success: true });
      batchCounter++;

      const delay = batchCounter >= 20 ? 15000 : 5000;
      if (batchCounter >= 20) {
        console.log("--- Batch of 20 reached. Waiting 10s ---");
        batchCounter = 0;
      }

      // Only delay if it's not the last number
      if (results.length < numbers.length) {
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (e) {
      console.error(`[ERROR] ${number}: ${e.message}`);
      results.push({ number, success: false });

      if (e.message.includes("comms")) {
        console.error(
          "--- Critical Session Error (sendIq/comms). Stopping loop. ---",
        );
        break;
      }
    }
  }

  console.log(`--- Bulk Finished. Total processed: ${results.length} ---`);
  res.json({ success: true, results, total: numbers.length });
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

// send to number from sheet
app.post("/api/send-from-sheet", async (req, res) => {
  const { message } = req.body;
  if (!isBotReady || !global.sheetNumbers)
    return res.status(400).json({ error: "Not ready" });

  const results = [];
  let batchCounter = 0;

  console.log(
    `--- Starting Sheet Bulk: ${global.sheetNumbers.length} numbers ---`,
  );

  for (const number of global.sheetNumbers) {
    try {
      const cleanNumber = number.replace(/\D/g, "");
      const chatId = `${cleanNumber}@c.us`;

      const isRegistered = await client.isRegisteredUser(chatId);
      if (!isRegistered) {
        console.log(`[SKIPPED] ${cleanNumber} - Not on WhatsApp`);
        results.push({
          number: cleanNumber,
          success: false,
          error: "Not registered",
        });
        continue;
      }

      await client.sendMessage(chatId, message, { sendSeen: false });
      console.log(
        `[SENT] ${cleanNumber} (${results.length + 1}/${global.sheetNumbers.length})`,
      );
      results.push({ number: cleanNumber, success: true });
      batchCounter++;

      if (batchCounter >= 20) {
        console.log("--- Batch of 20 reached. Waiting 10s ---");
        await new Promise((r) => setTimeout(r, 15000));
        batchCounter = 0;
      } else {
        // Only delay if it's not the last number
        if (results.length < global.sheetNumbers.length) {
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    } catch (e) {
      console.error(`[ERROR] ${number}: ${e.message}`);
      results.push({ number, success: false, error: e.message });

      if (e.message.includes("comms")) {
        console.error(
          "--- Critical Session Error (sendIq/comms). Stopping loop. ---",
        );
        break;
      }
    }
  }

  console.log(`--- Bulk Finished. Total: ${results.length} ---`);
  global.sheetNumbers = [];
  res.json({ success: true, results, total: results.length });
});

// logging out
app.post("/api/logout", async (req, res) => {
  try {
    isBotReady = false;
    latestQR = "";

    // clear the message history
    data.messages = [];
    saveData();

    // clear ui
    io.emit("messages_update", []);

    broadcastStatus();

    if (Client) {
      await client.logout().catch(() => {});
      await client.destroy().catch(() => {}); //kill internal browser
    }

    res.json({ success: true, message: "Session cleared. Restarting..." });

    // start fresh client without killing node
    startBot();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// important for the app to get connected to each other
server.listen(port, "0.0.0.0", () => {
  console.log(`Server on ${port}`);
  startBot();
});
