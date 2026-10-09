"""Extrait les vraies données de Relevé (snapshots + site/data) pour le motion design.

Lancer depuis la racine du dépôt, après `python -m collector.aggregate` :
    python motion/tools/extract_data.py
Écrit motion/src/data.js (module ES : export const DATA = {...}).
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / "site" / "data"
OUT = ROOT / "motion" / "src" / "data.js"

import sys
sys.path.insert(0, str(ROOT))
from collector.config import AMAZON_CATEGORIES, SHOPIFY_STORES  # noqa: E402
from collector.aggregate import load_snapshots, amazon_ranks    # noqa: E402
from collector.weekly import find_rushes                         # noqa: E402

latest = json.loads((SITE / "latest.json").read_text(encoding="utf-8"))
meta = json.loads((SITE / "meta.json").read_text(encoding="utf-8"))
r7 = json.loads((SITE / "rankings" / "7d.json").read_text(encoding="utf-8"))


def short(title, n=46):
    """Titre court lisible : coupe au premier séparateur, puis à n caractères sur un mot."""
    t = re.split(r"\s[|–]\s|\s-\s|,\s|\s\|", title)[0].strip()
    if len(t) > n:
        t = t[:n].rsplit(" ", 1)[0].rstrip(" -–:,") + "…"
    return t


def cat_label(key):
    return AMAZON_CATEGORIES[key][0]


def item(it, market, category):
    return {
        "id": it["id"], "rank": it["rank"], "title": it["title"], "short": short(it["title"]),
        "price": it.get("price"), "rating": it.get("rating"), "reviews": it.get("reviews"),
        "change": it.get("change"), "new": bool(it.get("new")), "streak": it.get("streak"),
        "market": market, "category": category, "cat": cat_label(category),
    }


all_items = []
lists = {}
for lst in latest["amazon"]:
    rows = [item(it, lst["market"], lst["category"]) for it in lst["items"]]
    lists[f"{lst['market']}-{lst['category']}"] = rows
    all_items.extend(rows)

fr = [i for i in all_items if i["market"] == "FR"]
us = [i for i in all_items if i["market"] == "US"]
ups = sorted([i for i in fr if (i["change"] or 0) > 0], key=lambda i: (-i["change"], i["rank"]))
downs = sorted([i for i in fr if (i["change"] or 0) < 0], key=lambda i: (i["change"], i["rank"]))
news = sorted([i for i in fr if i["new"]], key=lambda i: (i["rank"], i["category"]))

# Mur d'ouverture : un mélange de vrais produits (FR + US), rangs 1 à 30.
wall = []
for k, rows in lists.items():
    wall.extend(rows[:8])

# Top 8 de la veille, liste par liste : les produits sortis aujourd'hui quittent le mur en glissant.
snaps_all = load_snapshots()
prev_day = latest["compared_to"]
yesterday = {}
for lst in snaps_all[prev_day]["sources"]["amazon"]["lists"]:
    key = f"{lst['market']}-{lst['category']}"
    yesterday[key] = [{"id": it["id"], "rank": it["rank"], "title": it["title"], "price": it.get("price"),
                       "market": lst["market"], "category": lst["category"], "cat": cat_label(lst["category"])}
                      for it in lst["items"][:8]]

# Historique réel d'un produit qui grimpe (courbe de rang).
hist = json.loads((SITE / "history" / "FR-sante.json").read_text(encoding="utf-8"))
curve = next(v for v in hist.values() if "OneBlade 360 Authentic" in v["title"])

# Classement 7 jours (Jeux et Jouets, FR) pour l'animation de ré-ordonnancement.
r7_jouets = [{"title": x["title"], "short": short(x["title"]), "points": x["points"], "days": x["days"],
              "best": x["best_rank"], "price": x.get("price"), "id": x["id"]}
             for x in r7["amazon"]["FR"]["by_category"]["jouets"][:8]]

# Boutiques Shopify.
stores = []
for lst in latest["shopify"]:
    stores.append({
        "market": lst["market"], "store": lst["store"], "host": lst["host"], "category": lst["category"],
        "cat": cat_label(lst["category"]) if lst["category"] in AMAZON_CATEGORIES else lst["category"],
        "items": [{"rank": it["rank"], "title": it["title"], "type": it.get("type"), "price": it.get("price"),
                   "change": it.get("change"), "new": bool(it.get("new"))} for it in lst["items"][:6]],
    })

gtrends = {lst["market"]: [{"rank": it["rank"], "title": it["title"], "traffic": it["traffic_label"],
                            "news": it.get("news_title"), "source": it.get("news_source")}
                           for it in lst["items"]] for lst in latest["gtrends"]}

# Ruées réelles (notifications push).
snaps = load_snapshots()
day = sorted(snaps)[-1]
today = amazon_ranks(snaps[day])
rushes = []
for m, label in (("FR", "France"), ("US", "États-Unis")):
    mine = {k: v for k, v in today.items() if k[0] == m}
    for r in find_rushes(mine):
        rushes.append({"market": m, "label": label, "category": r["category"], "cat": cat_label(r["category"]),
                       "brand": r["brand"].capitalize(), "share": r["share"], "of": r["of"],
                       "title": f"Ruée en {cat_label(r['category'])} · {label}",
                       "body": f"{r['brand'].capitalize()} occupe {r['share']} des {r['of']} premières places "
                               f"des meilleures ventes Amazon."})

# Mini-courbes (14 jours) : rangs réels jour par jour, None si absent du top 30.
_hist_cache = {}
def spark(market, category, pid):
    key = f"{market}-{category}"
    if key not in _hist_cache:
        f = SITE / "history" / f"{key}.json"
        _hist_cache[key] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    ranks = (_hist_cache[key].get(pid) or {}).get("ranks", {})
    return [ranks.get(d) for d in sorted(snaps_all)]

for coll in (ups, downs, news):
    for it in coll[:12]:
        it["spark"] = spark(it["market"], it["category"], it["id"])
for rows in lists.values():
    for it in rows[:10]:
        it["spark"] = spark(it["market"], it["category"], it["id"])

def r7_list(market, cat, n=8):
    return [{"title": x["title"], "short": short(x["title"]), "points": x["points"], "days": x["days"],
             "best": x["best_rank"], "price": x.get("price"), "id": x["id"], "rating": x.get("rating"),
             "reviews": x.get("reviews")} for x in r7["amazon"][market]["by_category"][cat][:n]]

# Article hebdo réel (aperçu généré par collector.weekly --force dans tmp/, ignoré par git).
article = None
arts = sorted((ROOT / "tmp" / "articles").glob("*.json")) or sorted((ROOT / "data" / "articles").glob("*.json"))
if arts:
    a = json.loads(arts[-1].read_text(encoding="utf-8"))
    article = {"title": a["title"], "summary": a.get("summary"), "sections": [s["title"] for s in a.get("sections", [])]}

fr_cats = [l["category"] for l in latest["amazon"] if l["market"] == "FR"]
DATA = {
    "date": latest["date"], "compared_to": latest["compared_to"],
    "days": sorted(snaps),
    "counts": {"fr_products": len(fr), "fr_categories": len(fr_cats), "us_products": len(us),
               "categories_total": len(AMAZON_CATEGORIES),
               "stores": sum(len(v) for v in SHOPIFY_STORES.values())},
    "categories": [{"key": k, "label": v[0]} for k, v in AMAZON_CATEGORIES.items()],
    "storeNames": [name for m in ("US", "FR") for name, _ in SHOPIFY_STORES[m].values()],
    "wall": wall,
    "yesterday": yesterday,
    "ups": ups[:12], "downs": downs[:12], "news": news[:12],
    "number1": [lists[f"FR-{c}"][0] for c in fr_cats],
    "lists": {k: v[:10] for k, v in lists.items() if k in ("FR-jouets", "US-jouets", "FR-sante", "US-high-tech",
                                                             "FR-high-tech", "US-beaute", "FR-beaute")},
    "curve": {"title": curve["title"], "short": "Philips OneBlade 360", "ranks": curve["ranks"],
              "cat": cat_label("sante"), "market": "FR"},
    "r7_jouets": r7_jouets,
    "r7": {"FR-jouets": r7_list("FR", "jouets"), "US-jouets": r7_list("US", "jouets")},
    "r7_meta": {"days_covered": r7["days_covered"], "days_expected": r7["days_expected"]},
    "article": article,
    "stores": stores,
    "gtrends": gtrends,
    "rushes": rushes,
    "sources": {k: {"status": v.get("status"), "collected_at": v.get("collected_at")}
                for k, v in meta.get("sources", {}).items()} if isinstance(meta.get("sources"), dict) else {},
}

OUT.write_text("// Généré par motion/tools/extract_data.py à partir des vrais relevés. Ne pas éditer.\n"
               "export const DATA = " + json.dumps(DATA, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(f"{OUT.relative_to(ROOT)} : {len(wall)} produits du mur, {len(ups)} hausses, {len(news)} entrées, "
      f"{len(stores)} boutiques, {len(rushes)} ruées")
