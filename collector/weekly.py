"""Weekly article, built only from real snapshots: python -m collector.weekly [--force]

Writes data/articles/<YYYY-Www>.json (committed: it is the archive). The week is the 7 days ending on the
latest snapshot. Nothing is published with fewer than MIN_DAYS days of data in that window (unless --force,
which writes to tmp/ for previewing only).

Optional editorial: if editorial/next.md exists and is not empty, its text opens the article and the file
is moved to editorial/archive/<id>.md.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
from collections import Counter, defaultdict

from .aggregate import amazon_ranks, load_snapshots, shopify_ranks
from .config import AMAZON_CATEGORIES, MARKETS

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARTICLES = ROOT / "data" / "articles"
EDITORIAL = ROOT / "editorial" / "next.md"
MIN_DAYS = 5
TOP = 10
MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre",
          "octobre", "novembre", "décembre"]
# First words that are not brands (used by the "rush" detector).
NOT_BRANDS = {"lot", "pack", "set", "kit", "coque", "the", "le", "la", "les", "un", "une", "de", "new", "nouveau",
              "nouvelle", "mini", "x", "2", "3", "4", "5", "6", "10", "12", "20", "100", "piles", "chargeur"}


def fr_date(d):
    d = dt.date.fromisoformat(d)
    return f"{d.day}{'er' if d.day == 1 else ''} {MONTHS[d.month - 1]}"


def product(it, market, category, **extra):
    return {"id": it["id"], "title": it.get("title"), "image": it.get("image"), "url": it.get("url"),
            "price": it.get("price"), "rating": it.get("rating"), "reviews": it.get("reviews"),
            "market": market, "category": category, **extra}


def brand(title):
    m = re.match(r"\s*([^\s:,|\-–]+)", title or "")
    word = m.group(1).lower().strip("®™'\"") if m else ""
    return None if not word or word in NOT_BRANDS or word.isdigit() else word


def build(snaps, force=False):
    days = sorted(snaps)
    end = days[-1]
    start = (dt.date.fromisoformat(end) - dt.timedelta(6)).isoformat()
    window = [d for d in days if d >= start]
    before = [d for d in days if d < start]
    if len(window) < MIN_DAYS and not force:
        return None, f"only {len(window)} day(s) in the week ending {end} (need {MIN_DAYS})"

    amz = {d: amazon_ranks(snaps[d]) for d in window}
    seen_before = set()
    for d in before:
        seen_before |= set(amazon_ranks(snaps[d]))
    first, last = amz[window[0]], amz[end]

    sections = []
    for market in MARKETS:
        now = {k: v for k, v in last.items() if k[0] == market}

        climbers = []
        for key, it in now.items():
            was = first.get(key)
            if was and was["rank"] > it["rank"]:
                climbers.append(product(it, market, key[1], rank_now=it["rank"], rank_before=was["rank"],
                                        change=was["rank"] - it["rank"]))
        climbers.sort(key=lambda p: (-p["change"], p["rank_now"]))
        sections.append({"type": "climbers", "market": market, "title": "Les plus fortes montées",
                         "intro": f"Rang du {fr_date(end)} comparé à celui du {fr_date(window[0])}, dans la même catégorie.",
                         "items": climbers[:TOP]})

        if before:
            best = defaultdict(lambda: 99)
            for d in window:
                for key, it in amz[d].items():
                    if key[0] == market:
                        best[key] = min(best[key], it["rank"])
            new = [product(it, market, key[1], rank_now=it["rank"], best_rank=best[key])
                   for key, it in now.items() if key not in seen_before]
            new.sort(key=lambda p: (p["best_rank"], p["rank_now"]))
            sections.append({"type": "newcomers", "market": market, "title": "Nouveaux venus",
                             "intro": "Absents de tous nos relevés précédents, ils sont dans le top 30 ce matin.",
                             "items": new[:TOP]})

        leaders = []
        for key, it in now.items():
            if it["rank"] == 1 and all(amz[d].get(key, {}).get("rank") == 1 for d in window):
                leaders.append(product(it, market, key[1], days=len(window)))
        sections.append({"type": "leaders", "market": market, "title": "Indéboulonnables",
                         "intro": f"N° 1 de leur catégorie chacun des {len(window)} jours relevés.",
                         "items": leaders})

        rushes = []
        for cat in AMAZON_CATEGORIES:
            top = sorted((it for k, it in now.items() if k[1] == cat), key=lambda i: i["rank"])[:10]
            counts = Counter(b for b in (brand(i.get("title")) for i in top) if b)
            if counts:
                name, n = counts.most_common(1)[0]
                if n >= 5:
                    lead = next(i for i in top if brand(i.get("title")) == name)
                    rushes.append(product(lead, market, cat, brand=name, share=n, of=len(top)))
        sections.append({"type": "rush", "market": market, "title": "Ruées",
                         "intro": "Catégories dont au moins 5 des 10 premières places reviennent au même nom.",
                         "items": rushes})

        shp_first, shp_last = shopify_ranks(snaps[window[0]]), shopify_ranks(snaps[end])
        if len(window) > 1:
            entries = [dict(product(it, market, it["category"], rank_now=it["rank"]), store=it["store"])
                       for key, it in shp_last.items() if key[0] == market and key not in shp_first
                       and any(k[1] == key[1] for k in shp_first)]   # store was relevé at the start too
            entries.sort(key=lambda p: p["rank_now"])
            sections.append({"type": "shopify", "market": market, "title": "Entrées dans les boutiques",
                             "intro": "Produits arrivés cette semaine dans le top 12 « meilleures ventes » des boutiques suivies.",
                             "items": entries[:TOP]})

        buzz = {}
        for d in window:
            for lst in snaps[d]["sources"].get("gtrends", {}).get("lists", []):
                if lst["market"] != market:
                    continue
                for it in lst["items"]:
                    b = buzz.setdefault(it["id"], {"title": it["title"], "traffic": 0, "traffic_label": None, "day": d})
                    if (it.get("traffic") or 0) >= b["traffic"]:
                        b.update(traffic=it.get("traffic") or 0, traffic_label=it.get("traffic_label"), day=d)
        sections.append({"type": "buzz", "market": market, "title": "Ce que les gens ont cherché",
                         "intro": "Recherches Google qui ont explosé cette semaine (toutes recherches, pas seulement des produits).",
                         "items": sorted(buzz.values(), key=lambda b: -b["traffic"])[:TOP]})

    iso = dt.date.fromisoformat(end).isocalendar()
    art_id = f"{iso.year}-W{iso.week:02d}"
    sections = [s for s in sections if s["items"]]
    editorial = EDITORIAL.read_text(encoding="utf-8").strip() if EDITORIAL.exists() else ""
    return {
        "id": art_id,
        "title": f"La semaine du {fr_date(window[0])} au {fr_date(end)}",
        "published": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "period": {"from": window[0], "to": end, "days": len(window)},
        "editorial": editorial or None,
        "summary": summary(sections),
        "sections": sections,
    }, None


def summary(sections):
    parts = []
    for s in sections:
        if s["type"] == "rush" and s["items"]:
            r = s["items"][0]
            parts.append(f"{r['brand'].capitalize()} occupe {r['share']} des 10 premières places en "
                         f"{AMAZON_CATEGORIES[r['category']][0]} ({s['market']})")
        if s["type"] == "climbers" and s["items"] and s["market"] == "FR":
            c = s["items"][0]
            parts.append(f"plus forte montée : +{c['change']} places en {AMAZON_CATEGORIES[c['category']][0]}")
    return " · ".join(parts[:2]) or None


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="preview with fewer days, written to tmp/ only")
    args = ap.parse_args(argv)
    art, why = build(load_snapshots(), args.force)
    if not art:
        print(f"no article: {why}")
        return
    out = (ROOT / "tmp" / "articles") if args.force else ARTICLES
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{art['id']}.json"
    if path.exists() and not args.force:
        print(f"article {art['id']} already published, left untouched")
        return
    path.write_text(json.dumps(art, ensure_ascii=False, indent=1), encoding="utf-8")
    if not args.force and art["editorial"]:
        archive = ROOT / "editorial" / "archive"
        archive.mkdir(parents=True, exist_ok=True)
        EDITORIAL.replace(archive / f"{art['id']}.md")
    print(f"article {art['id']} written to {path.relative_to(ROOT)} "
          f"({sum(len(s['items']) for s in art['sections'])} items, {len(art['sections'])} sections)")


if __name__ == "__main__":
    main()
