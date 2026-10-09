"""Turns daily snapshots into the JSON files the website reads: python -m collector.aggregate

site/data/meta.json      sources status, coverage, categories, stores
site/data/latest.json    today's lists with day-over-day movement (new, up, down)
site/data/rankings/index.json, rankings/<period>.json  top products per period (7d, 30d, YYYY-MM, YYYY)
site/data/history/<market>-<category>.json  daily Amazon ranks per product (for charts)
site/data/products.json  compact ASIN lookup for the browser extension (category, rank today, best, days)
site/data/articles/index.json, articles/<YYYY-Www>.json  weekly articles (copied from data/articles)

Score for a period = sum over days of (N + 1 - rank), N = list length. A product #1 every day of the
period scores highest; it rewards both high ranks and staying power. This is a *ranking signal*,
not a sales figure.
"""
import calendar
import datetime as dt
import gzip
import json
import pathlib
from collections import defaultdict

from .config import AMAZON_CATEGORIES, AMAZON_TOP_N, MARKETS, SHOPIFY_STORES, SHOPIFY_TOP_N

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "data"
TOP_OVERALL, TOP_PER_CAT = 50, 10

# Checked with a real browser on 2026-10-04: the old Top Products URL redirects to the Creative Center
# home, whose public "Trends" only lists hashtags (top 3 without login). No free product data left.
TIKTOK_CHECKED = "2026-10-04"
TIKTOK_REASON = ("TikTok a retiré « Top Products » de son Creative Center public : l'ancienne page redirige vers "
                 "l'accueil, et la rubrique Trends ne montre plus que des hashtags (3 seulement sans compte). "
                 "Aucune donnée produit TikTok gratuite et fiable n'existe aujourd'hui ; les outils qui en "
                 "affichent (Kalodata, FastMoss…) sont payants.")


def load_snapshots():
    snaps = {}
    for f in sorted((ROOT / "data" / "snapshots").glob("*/*.json.gz")):
        s = json.loads(gzip.decompress(f.read_bytes()))
        snaps[s["date"]] = s
    return snaps


def amazon_ranks(snap):
    """{(market, category, asin): item} for one day."""
    out = {}
    for lst in snap["sources"].get("amazon", {}).get("lists", []):
        for it in lst["items"]:
            out[(lst["market"], lst["category"], it["id"])] = it
    return out


def shopify_ranks(snap):
    out = {}
    for lst in snap["sources"].get("shopify", {}).get("lists", []):
        for it in lst["items"]:
            out[(lst["market"], lst["host"], it["id"])] = dict(it, store=lst["store"], category=lst["category"])
    return out


def periods(days):
    """Period key -> (label, list of dates in the period that we have, expected day count)."""
    if not days:
        return {}
    last = dt.date.fromisoformat(days[-1])
    have = set(days)
    out = {}
    for n in (7, 30):
        want = [(last - dt.timedelta(d)).isoformat() for d in range(n)]
        out[f"{n}d"] = (f"{n} derniers jours", sorted(d for d in want if d in have), n)
    for month in sorted({d[:7] for d in days}):
        y, m = map(int, month.split("-"))
        out[month] = (f"Mois {month}", [d for d in days if d.startswith(month)], calendar.monthrange(y, m)[1])
    for year in sorted({d[:4] for d in days}):
        out[year] = (f"Année {year}", [d for d in days if d.startswith(year)], 366 if calendar.isleap(int(year)) else 365)
    return out


def score(daily, dates, size):
    """daily: {date: {key: item}} -> {key: stats}."""
    acc = {}
    for d in dates:
        for key, it in daily.get(d, {}).items():
            a = acc.setdefault(key, {"points": 0, "days": 0, "best": 10**6, "sum": 0})
            a["points"] += size + 1 - it["rank"]
            a["days"] += 1
            a["best"] = min(a["best"], it["rank"])
            a["sum"] += it["rank"]
            a["last"] = it  # most recent details win
    return acc


def card(key, a, extra=None):
    it = a["last"]
    c = {"id": it["id"], "title": it.get("title"), "image": it.get("image"), "url": it.get("url"),
         "price": it.get("price"), "points": a["points"], "days": a["days"], "best_rank": a["best"],
         "avg_rank": round(a["sum"] / a["days"], 1)}
    if it.get("rating") is not None:
        c["rating"], c["reviews"] = it["rating"], it.get("reviews")
    c.update(extra or {})
    return c


def build_rankings(snaps):
    days = sorted(snaps)
    amz = {d: amazon_ranks(snaps[d]) for d in days}
    shp = {d: shopify_ranks(snaps[d]) for d in days}
    out = {}
    for pkey, (label, dates, expected) in periods(days).items():
        if not dates:
            continue
        res = {"label": label, "days_covered": len(dates), "days_expected": expected,
               "from": dates[0], "to": dates[-1], "amazon": {}, "shopify": {}}
        sa = score(amz, dates, AMAZON_TOP_N)
        for market in MARKETS:
            mine = [(k, a) for k, a in sa.items() if k[0] == market]
            mine.sort(key=lambda ka: (-ka[1]["points"], ka[1]["best"]))
            per_cat = defaultdict(list)
            for k, a in mine:
                if len(per_cat[k[1]]) < TOP_PER_CAT:
                    per_cat[k[1]].append(card(k, a))
            res["amazon"][market] = {
                "overall": [card(k, a, {"category": k[1]}) for k, a in mine[:TOP_OVERALL]],
                "by_category": per_cat,
            }
        ss = score(shp, dates, SHOPIFY_TOP_N)
        for market in MARKETS:
            mine = sorted(((k, a) for k, a in ss.items() if k[0] == market), key=lambda ka: (-ka[1]["points"], ka[1]["best"]))
            res["shopify"][market] = [card(k, a, {"store": a["last"]["store"], "category": a["last"]["category"]}) for k, a in mine[:TOP_OVERALL]]
        out[pkey] = res
    return out


def build_latest(snaps):
    days = sorted(snaps)
    today = snaps[days[-1]]
    prev = snaps[days[-2]] if len(days) > 1 else None
    week_ago_day = (dt.date.fromisoformat(days[-1]) - dt.timedelta(7)).isoformat()
    week = snaps.get(week_ago_day)
    prev_r = amazon_ranks(prev) if prev else {}
    week_r = amazon_ranks(week) if week else {}

    # Consecutive days in the list, counting back from today.
    daily = [amazon_ranks(snaps[d]) for d in reversed(days)]
    streak = defaultdict(int)
    for key in daily[0]:
        for ranks in daily:
            if key in ranks:
                streak[key] += 1
            else:
                break

    amazon = []
    for lst in today["sources"].get("amazon", {}).get("lists", []):
        items = []
        for it in lst["items"]:
            key = (lst["market"], lst["category"], it["id"])
            before = prev_r.get(key)
            items.append(dict(it,
                              change=(before["rank"] - it["rank"]) if before else None,
                              new=bool(prev) and before is None,
                              change_7d=(week_r[key]["rank"] - it["rank"]) if key in week_r else None,
                              streak=streak[key]))
        amazon.append(dict(lst, items=items))

    src = today["sources"]
    return {
        "date": today["date"],
        "compared_to": prev["date"] if prev else None,
        "amazon": amazon,
        "shopify": [lst for lst in src.get("shopify", {}).get("lists", []) if lst["items"]],
        "gtrends": src.get("gtrends", {}).get("lists", []),
    }


def build_history(snaps, keep_days=400):
    days = sorted(snaps)[-keep_days:]
    files = defaultdict(dict)
    for d in days:
        for (market, cat, asin), it in amazon_ranks(snaps[d]).items():
            prod = files[f"{market}-{cat}"].setdefault(asin, {"title": it.get("title"), "image": it.get("image"),
                                                              "url": it.get("url"), "ranks": {}})
            prod["ranks"][d] = it["rank"]
            prod["title"], prod["image"] = it.get("title") or prod["title"], it.get("image") or prod["image"]
    return files


def build_products(snaps, keep_days=400):
    """{market: {asin: [category, rank today or 0, best rank, days in top]}}; one category per ASIN (its best)."""
    days = sorted(snaps)[-keep_days:]
    today = amazon_ranks(snaps[days[-1]])
    seen = {}
    for d in days:
        for (market, cat, asin), it in amazon_ranks(snaps[d]).items():
            s = seen.setdefault((market, asin, cat), {"best": it["rank"], "days": 0})
            s["best"] = min(s["best"], it["rank"])
            s["days"] += 1
    out = {m: {} for m in MARKETS}
    for (market, asin, cat), s in seen.items():
        row = [cat, (today.get((market, cat, asin)) or {}).get("rank", 0), s["best"], s["days"]]
        cur = out[market].get(asin)
        if cur is None or (row[1] or 999, row[2]) < (cur[1] or 999, cur[2]):
            out[market][asin] = row
    return {"date": days[-1], "products": out}


def build_meta(snaps):
    days = sorted(snaps)
    last = snaps[days[-1]]["sources"]
    sources = {name: {"status": s.get("status"), "collected_at": s.get("collected_at"),
                      "errors": s.get("errors", []), "lists": len(s.get("lists", [])),
                      "last_success": next((d for d in reversed(days)
                                            if snaps[d]["sources"].get(name, {}).get("lists")), None)}
               for name, s in last.items()}
    sources["tiktok"] = {"status": "unavailable", "checked": TIKTOK_CHECKED, "reason": TIKTOK_REASON}
    return {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "first_day": days[0], "last_day": days[-1], "days_collected": len(days),
        "markets": {k: v["label"] for k, v in MARKETS.items()},
        "categories": {k: v[0] for k, v in AMAZON_CATEGORIES.items()},
        "stores": {m: {h: {"name": n, "category": c} for h, (n, c) in s.items()} for m, s in SHOPIFY_STORES.items()},
        "sources": sources,
        "method": {
            "amazon": "Pages publiques « Meilleures ventes » d'Amazon (mises à jour chaque heure par Amazon), relevées une fois par jour : top 30 de 17 catégories, France et États-Unis. C'est un classement, pas un volume de ventes.",
            "shopify": "Tri « meilleures ventes » de boutiques Shopify sélectionnées. Shopify trie sur les ventes depuis toujours : c'est un indicateur de produits phares, pas de nouveauté.",
            "tiktok": TIKTOK_REASON,
            "gtrends": "Flux officiel Google Trends « Tendances du moment » : toutes les recherches qui explosent (actualité, sport, produits…), volume approximatif.",
            "score": "Score d'une période = somme sur chaque jour de (31 − rang). Récompense le rang et la durée de présence.",
        },
    }


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    snaps = load_snapshots()
    if not snaps:
        raise SystemExit("no snapshot yet: run `python -m collector.run` first")
    write(OUT / "meta.json", build_meta(snaps))
    write(OUT / "latest.json", build_latest(snaps))
    rankings = build_rankings(snaps)
    write(OUT / "rankings" / "index.json", {k: {f: v[f] for f in ("label", "days_covered", "days_expected", "from", "to")}
                                            for k, v in rankings.items()})
    for key, data in rankings.items():
        write(OUT / "rankings" / f"{key}.json", data)
    for name, data in build_history(snaps).items():
        write(OUT / "history" / f"{name}.json", data)
    write(OUT / "products.json", build_products(snaps))
    index = []
    for f in sorted((ROOT / "data" / "articles").glob("*.json"), reverse=True):
        art = json.loads(f.read_text(encoding="utf-8"))
        write(OUT / "articles" / f.name, art)
        index.append({k: art.get(k) for k in ("id", "title", "published", "period", "summary")})
    write(OUT / "articles" / "index.json", index)
    print(f"site/data built from {len(snaps)} day(s)")


if __name__ == "__main__":
    main()
