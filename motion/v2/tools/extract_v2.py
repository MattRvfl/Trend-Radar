"""Données réelles propres à la v2 (format vertical, voix off) : listes Hygiène et Santé FR jour par jour
(le rasoir Philips OneBlade 360 passe de n° 25 à n° 2), top 10 Beauté et Parfum FR du 8 octobre
(Medicube : 7 des 10 premières places) et minutage de la voix off.

Lancer depuis la racine du dépôt :  python motion/v2/tools/extract_v2.py
Écrit motion/v2/src/data2.js et motion/v2/src/vo.js.
"""
import gzip
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
V2 = ROOT / "motion" / "v2"
sys.path.insert(0, str(ROOT))
from collector.config import AMAZON_CATEGORIES  # noqa: E402

SNAP = ROOT / "data" / "snapshots" / "2026"
DAYS = ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]
snaps = {d: json.load(gzip.open(SNAP / f"{d}.json.gz")) for d in DAYS}


def short(title, n=34):
    t = re.split(r"\s[|–]\s|\s-\s|,\s|\s\|", title)[0].strip()
    if len(t) > n:
        t = t[:n].rsplit(" ", 1)[0].rstrip(" -–:,") + "…"
    return t


def amz(day, market, cat):
    for lst in snaps[day]["sources"]["amazon"]["lists"]:
        if lst["market"] == market and lst["category"] == cat:
            return lst["items"]
    return []


# ---- Crochet : Hygiène et Santé (FR), 30 rangs par jour.
HERO_KEY = "OneBlade 360 Authentic"
hero_id = next(it["id"] for it in amz("2026-10-08", "FR", "sante") if HERO_KEY in it["title"])
sante = {d: [{"id": it["id"], "rank": it["rank"], "t": short(it["title"]), "price": it.get("price")}
             for it in amz(d, "FR", "sante")] for d in DAYS}
hero_ranks = {d: next((x["rank"] for x in sante[d] if x["id"] == hero_id), None) for d in DAYS}

# ---- Stat : Beauté et Parfum (FR), top 10 du 8 octobre.
beaute = []
for it in amz("2026-10-08", "FR", "beaute")[:10]:
    brand = it["title"].split()[0]
    beaute.append({"rank": it["rank"], "t": short(it["title"], 40), "brand": brand,
                   "medicube": brand.lower() == "medicube", "price": it.get("price")})

amazon_meta = snaps["2026-10-08"]["sources"]["amazon"]
DATA2 = {
    "days": DAYS,
    "hero": {"id": hero_id, "title": "Philips OneBlade 360", "ranks": hero_ranks,
             "cat": AMAZON_CATEGORIES["sante"][0], "market": "FR"},
    "sante": sante,
    "beaute": beaute,
    "beaute_cat": AMAZON_CATEGORIES["beaute"][0],
    "collected_at": amazon_meta.get("collected_at"),
}
(V2 / "src").mkdir(parents=True, exist_ok=True)
(V2 / "src" / "data2.js").write_text(
    "// Généré par motion/v2/tools/extract_v2.py à partir des vrais relevés. Ne pas éditer.\n"
    "export const DATA2 = " + json.dumps(DATA2, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print("rangs du rasoir :", hero_ranks)
print("Medicube dans le top 10 Beauté FR :", sum(b["medicube"] for b in beaute), "/ 10")

# ---- Voix off : mots (sans les balises d'intention [excited]…), décalés sur la piste du film.
VO_OFFSET = 0.02     # la voix démarre 20 ms après la première image (grille calée sur t = 0)
SCRIBE_LAG = 0.12    # Scribe date les mots ~120 ms après l'attaque réelle (mesuré sur l'enveloppe)
words = json.loads((V2 / "assets" / "vo-leo-takeB-words.json").read_text(encoding="utf-8"))["words"]
vo = []
for w in words:
    if w["type"] != "word" or w["text"].startswith("["):
        continue
    s = max(0.0, w["start"] - SCRIBE_LAG) + VO_OFFSET
    e = max(s + 0.08, w["end"] - SCRIBE_LAG * 0.5 + VO_OFFSET)
    vo.append({"w": w["text"], "s": round(s, 3), "e": round(e, 3)})
(V2 / "src" / "vo.js").write_text(
    "// Minutage mot à mot de la voix off (ElevenLabs Scribe sur la prise B), en secondes du film.\n"
    f"export const VO_OFFSET = {VO_OFFSET};\n"
    "export const VO = " + json.dumps(vo, ensure_ascii=False) + ";\n", encoding="utf-8")
print(len(vo), "mots ; dernier :", vo[-1])
