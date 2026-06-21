import csv
import io
import re
import openpyxl

SRC = r"h:\My Drive\วัสดุคงคลัง\พัสุดในคลังหน่วยเบิกกล่มงานการพยาบาลผู้ป่วยห้องผ่าตัด (1).xlsx"
OUT_CSV = r"C:\Users\kttwatt\WNHBarcode\scripts\items_formatted.csv"
OUT_LOG = r"C:\Users\kttwatt\WNHBarcode\scripts\transform_report.txt"

DEPARTMENTS = "OR"  # ห้องผ่าตัด

# section header name -> subgroup code (from DB)
SUBMAP = {
    "วัสดุการแพทย์": "203",
    "วัสดุวิทยาศาสตร์และการแพทย์": "211",
    "วัสดุสำนักงาน": "212",
    "วัสดุงานบ้านงานครัว": "208",
}
DEFAULT_SUBGROUP = "203"  # block before first header = วัสดุการแพทย์

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb["Sheet1"]
rows = list(ws.iter_rows(min_row=3, values_only=True))  # skip title + header


def clean_str(raw):
    return "" if raw is None else str(raw).strip()


def clean_name(name):
    s = name
    # 1) cut everything from "ขนาด" onward (size text glued to the name)
    idx = s.find("ขนาด")
    if idx != -1:
        s = s[:idx]
    # 3) english typos
    s = re.sub(r"Blad(?!e)", "Blade", s)
    s = s.replace("Tranfusion", "Transfusion").replace("tranfusion", "transfusion")
    s = s.replace("Blandage", "Bandage").replace("blandage", "bandage")
    s = s.replace("Cat Cut", "Cat Gut").replace("cat cut", "cat gut")
    # 2) thai truncated fragments (order matters)
    s = re.sub(r"กลอ(?=\s|$)", "กล่อง", s)
    s = re.sub(r"กล่(?=\s|$)", "กล่อง", s)
    s = s.replace("มวน", "ม้วน")
    s = re.sub(r"ม้ว(?!น)", "ม้วน", s)
    s = re.sub(r"เส้(?=\s|$)", "เส้น", s)
    s = s.replace("ราน์", "ราวน์")
    s = s.replace("ขิ้น", "ชิ้น")
    # collapse whitespace and trim
    s = re.sub(r"\s+", " ", s).strip()
    return s


def clean_code(raw):
    s = clean_str(raw)
    return re.sub(r"-1$", "", s).strip()


def clean_price(raw):
    if raw is None or str(raw).strip() == "":
        return "0"
    try:
        f = float(raw)
        return str(int(f)) if f == int(f) else str(round(f, 2))
    except (TypeError, ValueError):
        return "0"


out_rows = []
skipped = []
unknown_headers = []
seen = {}
dups = []
changes = []
section_counts = {}
current = DEFAULT_SUBGROUP

for idx, r in enumerate(rows, start=3):
    a = clean_str(r[0] if len(r) > 0 else None)
    name = clean_str(r[1] if len(r) > 1 else None)
    unit = clean_str(r[3] if len(r) > 3 else None)
    price = clean_price(r[4] if len(r) > 4 else None)
    is_code_like = bool(re.match(r"^\d", a))

    # header / footer row (no item name, col A is text not a code)
    if name == "" and not is_code_like:
        if a == "" or a == "รวม":
            continue
        if a in SUBMAP:
            current = SUBMAP[a]
        else:
            unknown_headers.append((idx, a))
        continue

    code = clean_code(a)
    if not code and not name:
        continue
    if not code or not name:
        skipped.append((idx, a, name, "missing code or name"))
        continue
    if code in seen:
        dups.append((idx, code, name, seen[code]))
        continue

    seen[code] = idx
    section_counts[current] = section_counts.get(current, 0) + 1
    cleaned = clean_name(name)
    if cleaned != name:
        changes.append((code, name, cleaned))
    out_rows.append({
        "code": code,
        "name": cleaned,
        "unit": unit,
        "price": price,
        "subgroup_code": current,
        "departments": DEPARTMENTS,
    })

with io.open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["code", "name", "unit", "price", "subgroup_code", "departments"])
    w.writeheader()
    for row in out_rows:
        w.writerow(row)

inv = {v: k for k, v in SUBMAP.items()}
with io.open(OUT_LOG, "w", encoding="utf-8") as f:
    f.write("Total data rows scanned: %d\n" % len(rows))
    f.write("Valid items written:     %d\n" % len(out_rows))
    f.write("Skipped (missing field): %d\n" % len(skipped))
    f.write("Duplicate codes skipped: %d\n" % len(dups))
    f.write("Names cleaned/changed:   %d\n" % len(changes))
    f.write("departments = %s\n\n" % DEPARTMENTS)
    f.write("--- items per subgroup ---\n")
    for code, c in sorted(section_counts.items()):
        f.write("  %s %-30s %d\n" % (code, inv.get(code, "?"), c))
    if dups:
        f.write("\n--- duplicate codes skipped ---\n")
        for idx, code, name, first in dups:
            f.write("  row %d: code=%s name=%r (first at row %d)\n" % (idx, code, name, first))
    if skipped:
        f.write("\n--- skipped rows ---\n")
        for s in skipped:
            f.write("  row %d: A=%r name=%r (%s)\n" % s)
    if unknown_headers:
        f.write("\n--- UNKNOWN headers (not mapped!) ---\n")
        for idx, a in unknown_headers:
            f.write("  row %d: %r\n" % (idx, a))

with io.open(r"C:\Users\kttwatt\WNHBarcode\scripts\name_changes.txt", "w", encoding="utf-8") as f:
    f.write("code | BEFORE -> AFTER\n\n")
    for code, before, after in changes:
        f.write("%s | %s -> %s\n" % (code, before, after))

print("WROTE", len(out_rows), "rows;", len(changes), "names cleaned")
