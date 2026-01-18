import json
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

creds = ServiceAccountCredentials.from_json_keyfile_name(
    "fine-serenity-445909-r7-701b7fa397c0.json",
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
# Save numbers to JSON file (DON'T SEND HERE)
# =========================
NUMBERS_FILE = "./sheet_numbers.json"

with open(NUMBERS_FILE, "w", encoding="utf-8") as f:
    json.dump({"numbers": numbers}, f, ensure_ascii=False, indent=2)

print(f"💾 Saved {len(numbers)} numbers to {NUMBERS_FILE}")
print("✅ Done! Use the frontend to send messages.")
