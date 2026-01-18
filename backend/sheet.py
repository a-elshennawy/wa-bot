import json
import os
import re

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# =========================
# Google Sheets Auth (FILE ONLY)
# =========================
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

# Force use of the file you just uploaded
json_file = "nice-road-460613-q7-258158f521b3.json"

if os.path.exists(json_file):
    creds = ServiceAccountCredentials.from_json_keyfile_name(json_file, scope)
else:
    # This will help us see if Railway actually sees the file
    print(f"ERROR: File {json_file} not found in directory")
    exit(1)

client = gspread.authorize(creds)
sheet = client.open_by_key("1n_YhhtYk4ZiMHOhOl5m5QSz_XCAq8KD3blRvf_tZ-As").sheet1
rows = sheet.get_all_records()

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

# The ONLY thing Node.js should see is this JSON
print(json.dumps({"numbers": numbers}))
