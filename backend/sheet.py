import json
import os
import re

import gspread
from oauth2client.service_account import ServiceAccountCredentials

scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

json_file = "nice-road-460613-q7-258158f521b3.json"

# This is the ONLY way to fix 'Invalid JWT Signature' if the file is acting up
with open(json_file, "r") as f:
    creds_dict = json.load(f)

# Manually forcing the newline fix because your OS/Editor broke the file
if "private_key" in creds_dict:
    creds_dict["private_key"] = creds_dict["private_key"].replace("\\n", "\n")

creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
client = gspread.authorize(creds)

sheet = client.open_by_key("1n_YhhtYk4ZiMHOhOl5m5QSz_XCAq8KD3blRvf_tZ-As").sheet1
rows = sheet.get_all_records()

print(f"✅ Loaded {len(rows)} rows")


def normalize_phone(phone):
    if not phone:
        return None
    phone = re.sub(r"\D", "", str(phone))
    if phone.startswith("00"):
        phone = phone[2:]
    if phone.startswith("1") and len(phone) == 10:
        phone = "20" + phone
    return phone if len(phone) >= 11 else None


numbers = []
for row in rows:
    clean_row = {k.strip().lower(): v for k, v in row.items()}
    phone = normalize_phone(clean_row.get("phone"))
    if phone:
        numbers.append(phone)

print(f"📦 Found {len(numbers)} valid numbers")
print(json.dumps({"numbers": numbers}))
