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

# Check if running on Railway (environment variable exists)
creds_json = os.environ.get("GOOGLE_CREDENTIALS")

if creds_json:
    # 1. Handle Double-Wrapping (Unwrap outer quotes if present)
    creds_json = creds_json.strip()
    if creds_json.startswith('"') and creds_json.endswith('"'):
        creds_json = json.loads(creds_json)

    # 2. Parse JSON
    if isinstance(creds_json, str):
        creds_dict = json.loads(creds_json)
    else:
        creds_dict = creds_json

    # 3. NUCLEAR FIX: Reconstruct Private Key from scratch
    # This ignores whether it has \n, \\n, spaces, or tabs.
    # It grabs only the base64 data and rebuilds the headers.
    raw_key = creds_dict.get("private_key", "")

    # Remove existing headers and all non-base64 characters
    key_body = re.sub(r"[^a-zA-Z0-9+/=]", "", raw_key.replace("PRIVATE KEY", ""))

    # Split the body into 64-character lines (Standard PEM format)
    chunked_body = "\n".join(key_body[i : i + 64] for i in range(0, len(key_body), 64))

    # Reassemble properly
    final_key = (
        f"-----BEGIN PRIVATE KEY-----\n{chunked_body}\n-----END PRIVATE KEY-----"
    )

    creds_dict["private_key"] = final_key

    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
else:
    # Local - use file
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        "nice-road-460613-q7-45b493f82c63.json",
        scope,
    )

client = gspread.authorize(creds)
# This is line 46 where it was failing
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
print(json.dumps({"numbers": numbers}))
