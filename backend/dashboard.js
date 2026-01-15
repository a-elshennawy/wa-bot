const express = require('express');
const fs = require('fs');
const app = express();

const DATA_FILE = './data.json';

app.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.send(`
    <html>
      <head>
        <title>WhatsApp Dashboard</title>
        <style>
          body { font-family: Arial; background:#f4f4f4; padding:20px }
          .box { background:#fff; padding:20px; margin-bottom:20px; border-radius:8px }
        </style>
      </head>
      <body>
        <h1>📊 WhatsApp Automation Dashboard</h1>

        <div class="box">
          <h3>📈 Stats</h3>
          <p>Received: ${data.stats.received}</p>
          <p>Replied: ${data.stats.replied}</p>
          <p>Blacklisted: ${data.blacklist.length}</p>
        </div>

        <div class="box">
          <h3>💬 Last Messages</h3>
          <ul>
            ${data.messages.slice(-10).map(m =>
              `<li><b>${m.from}</b>: ${m.text} → ${m.reply}</li>`
            ).join('')}
          </ul>
        </div>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('📊 Dashboard running on http://localhost:3000');
});
