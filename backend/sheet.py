import json
import os
import re

import gspread
from oauth2client.service_account import ServiceAccountCredentials

scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

creds_json = os.environ.get("GOOGLE_CREDENTIALS")

if creds_json:
    # 1. Convert string to JSON dictionary
    creds_json = creds_json.strip()
    creds_dict = json.loads(creds_json) if isinstance(creds_json, str) else creds_json

    # 2. Fix ONLY the newlines (No regex, no body rebuilding)
    if "private_key" in creds_dict:
        creds_dict["private_key"] = creds_dict["private_key"].replace("\\n", "\n")

    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
else:
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        "nice-road-460613-q7-45b493f82c63.json", scope
    )

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

print(json.dumps({"numbers": numbers}))
