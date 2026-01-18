import json
import os
import re

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# =========================
# Google Sheets Auth
# =========================
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]


creds_json = os.environ.get("GOOGLE_CREDENTIALS")
if creds_json:
    # 1. Handle double-wrapping: If variable starts with quotes, unwrap it
    creds_json = creds_json.strip()
    if creds_json.startswith('"') and creds_json.endswith('"'):
        # This converts the string "{\"...}" into actual JSON text
        creds_json = json.loads(creds_json)

    # 2. Parse the JSON text into a dictionary
    if isinstance(creds_json, str):
        creds_dict = json.loads(creds_json)
    else:
        creds_dict = creds_json

    # 3. FIX: Replace ALL variations of escaped newlines
    pk = creds_dict["private_key"]
    pk = pk.replace("\\\\n", "\n")  # Fix double escapes
    pk = pk.replace("\\n", "\n")  # Fix single escapes
    creds_dict["private_key"] = pk

    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
else:
    # Local - use file
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        "nice-road-460613-q7-45b493f82c63.json",
        scope,
    )

client = gspread.authorize(creds)
sheet = client.open_by_key("1n_YhhtYk4ZiMHOhOl5m5QSz_XCAq8KD3blRvf_tZ-As").sheet1
rows = sheet.get_all_records()
print(f"✅ Loaded {len(rows)} rows")


# =========================
# Helpers
# =========================
def normalize_phone(phone):
    if not phone:
        return None
    phone = str(phone)
    phone = re.sub(r"\D", "", phone)
    if phone.startswith("00"):
        phone = phone[2:]
    if phone.startswith("1") and len(phone) == 10:
        phone = "20" + phone
    if len(phone) < 11:
        return None
    return phone


# =========================
# Build numbers array
# =========================
numbers = []
for row in rows:
    clean_row = {k.strip().lower(): v for k, v in row.items()}
    phone = normalize_phone(clean_row.get("phone"))
    if phone:
        numbers.append(phone)

print(f"📦 Found {len(numbers)} valid numbers")

# =========================
# Output for Node.js
# =========================
# We print the JSON so Node.js can catch it in its 'stdout'
print(json.dumps({"numbers": numbers}))
