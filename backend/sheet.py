import json
import os
import re

import gspread
from google.oauth2 import service_account

# =========================
# Google Sheets Auth
# =========================
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]
json_file = "nice-road-460613-q7-258158f521b3.json"

if not os.path.exists(json_file):
    print(json.dumps({"error": f"File {json_file} not found"}))
    exit(1)

# Use the modern google-auth library
creds = service_account.Credentials.from_service_account_file(json_file, scopes=scope)
client = gspread.authorize(creds)

try:
    sheet = client.open_by_key("1n_YhhtYk4ZiMHOhOl5m5QSz_XCAq8KD3blRvf_tZ-As").sheet1
    rows = sheet.get_all_records()
except Exception as e:
    print(json.dumps({"error": str(e)}))
    exit(1)

# =========================
# Processing
# =========================
numbers = []
for row in rows:
    clean_row = {k.strip().lower(): v for k, v in row.items()}
    val = clean_row.get("phone")
    if val:
        phone = re.sub(r"\D", "", str(val))
        if phone.startswith("00"):
            phone = phone[2:]
        if phone.startswith("1") and len(phone) == 10:
            phone = "20" + phone
        if len(phone) >= 11:
            numbers.append(phone)

# Clean output for Node.js
print(json.dumps({"numbers": numbers}))
