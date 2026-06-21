import csv
import io

SRC = r"C:\Users\kttwatt\WNHBarcode\scripts\items_formatted.csv"
OUT_ITEMS = r"C:\Users\kttwatt\WNHBarcode\scripts\insert_items.sql"
OUT_LINK = r"C:\Users\kttwatt\WNHBarcode\scripts\link_depts.sql"


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


rows = []
with io.open(SRC, "r", encoding="utf-8-sig", newline="") as f:
    for r in csv.DictReader(f):
        rows.append(r)

# --- statement 1: insert items ---
values = []
for r in rows:
    values.append(
        "  (%s, %s, %s, %s, %s)"
        % (q(r["code"]), q(r["name"]), q(r["unit"]), r["price"] or "0", q(r["subgroup_code"]))
    )

items_sql = (
    "with input(code, name, unit, price, subgroup_code) as (\n  values\n"
    + ",\n".join(values)
    + "\n)\n"
    "insert into public.items (code, name, unit, price, barcode, subgroup_id)\n"
    "select i.code, i.name, i.unit, i.price::numeric, i.code, sg.id\n"
    "from input i\n"
    "join public.item_subgroups sg on sg.code = i.subgroup_code\n"
    "on conflict (code) do nothing;\n"
)

with io.open(OUT_ITEMS, "w", encoding="utf-8") as f:
    f.write(items_sql)

# --- statement 2: link all codes to OR department ---
codes = ", ".join(q(r["code"]) for r in rows)
link_sql = (
    "insert into public.department_items (department_id, item_id)\n"
    "select d.id, it.id\n"
    "from public.items it\n"
    "cross join public.departments d\n"
    "where d.code = 'OR'\n"
    "  and it.code in (" + codes + ")\n"
    "on conflict (department_id, item_id) do nothing;\n"
)

with io.open(OUT_LINK, "w", encoding="utf-8") as f:
    f.write(link_sql)

print("items rows:", len(rows))
print("items sql bytes:", len(items_sql.encode("utf-8")))
print("link sql bytes:", len(link_sql.encode("utf-8")))
