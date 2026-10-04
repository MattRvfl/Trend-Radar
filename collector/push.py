"""Web push notifications: python -m collector.push [--dry-run]

Sends each notification once (push_events): the latest weekly article, and every rush that appeared on
the latest snapshot (present today, absent from the previous snapshot). Subscriptions come from
Supabase (push_subscriptions); a subscription the push service reports gone (404/410) is deleted, one
that keeps failing is dropped after MAX_FAILURES.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY (raw P-256 key, base64url), SITE_URL.
Needs `pywebpush` (installed by the workflow); --dry-run needs neither it nor the secrets.
"""
import argparse
import json
import os
import pathlib
import urllib.parse

from .aggregate import amazon_ranks, load_snapshots
from .config import AMAZON_CATEGORIES, MARKETS
from .newsletter import SITE_URL, supabase
from .weekly import find_rushes

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_FAILURES = 5
TTL = 24 * 3600   # a notification nobody could receive within a day is dropped


def article_event():
    arts = sorted((ROOT / "data" / "articles").glob("*.json"))
    if not arts:
        return None
    art = json.loads(arts[-1].read_text(encoding="utf-8"))
    body = art["title"] + (f" · {art['summary']}" if art.get("summary") else "")
    return {"id": f"article:{art['id']}", "topic": "article", "market": None,
            "payload": {"title": "Relevé · l'article de la semaine est sorti", "body": body[:180],
                        "url": SITE_URL + f"#/articles/{art['id']}", "tag": f"article-{art['id']}"}}


def rush_events(snaps):
    days = sorted(snaps)
    if len(days) < 2:          # first day: everything would look "new"
        return []
    today, prev = amazon_ranks(snaps[days[-1]]), amazon_ranks(snaps[days[-2]])
    events = []
    for market, info in MARKETS.items():
        mine = {k: v for k, v in today.items() if k[0] == market}
        before = {(r["category"], r["brand"]) for r in find_rushes({k: v for k, v in prev.items() if k[0] == market})}
        for r in find_rushes(mine):
            if (r["category"], r["brand"]) in before:
                continue
            cat = AMAZON_CATEGORIES[r["category"]][0]
            name = r["brand"].capitalize()
            events.append({
                "id": f"rush:{market}:{r['category']}:{r['brand']}:{days[-1]}", "topic": "rush", "market": market,
                "payload": {"title": f"Ruée en {cat} · {info['label']}",
                            "body": f"{name} occupe {r['share']} des {r['of']} premières places des meilleures ventes Amazon.",
                            "url": SITE_URL + f"#/classements?m={market}&c={r['category']}",
                            "tag": f"rush-{market}-{r['category']}"}})
    return events


def subscriptions(topic):
    return supabase("GET", "push_subscriptions?select=endpoint,p256dh,auth,markets,failures"
                           f"&topics=cs.%7B{topic}%7D") or []


def already_sent(event_id):
    return bool(supabase("GET", f"push_events?select=id&id=eq.{urllib.parse.quote(event_id, safe='')}"))


def send(event, subs, key):
    from pywebpush import WebPushException, webpush

    sent = 0
    for s in subs:
        if event["market"] and event["market"] not in (s.get("markets") or []):
            continue
        ep = urllib.parse.quote(s["endpoint"], safe="")
        try:
            webpush({"endpoint": s["endpoint"], "keys": {"p256dh": s["p256dh"], "auth": s["auth"]}},
                    data=json.dumps(event["payload"], ensure_ascii=False), ttl=TTL,
                    vapid_private_key=key, vapid_claims={"sub": SITE_URL})
            sent += 1
            if s.get("failures"):
                supabase("PATCH", f"push_subscriptions?endpoint=eq.{ep}", {"failures": 0})
        except WebPushException as ex:
            status = getattr(ex.response, "status_code", None)
            if status in (404, 410) or (s.get("failures") or 0) + 1 >= MAX_FAILURES:
                supabase("DELETE", f"push_subscriptions?endpoint=eq.{ep}")
            else:
                supabase("PATCH", f"push_subscriptions?endpoint=eq.{ep}", {"failures": (s.get("failures") or 0) + 1})
            print(f"  push failed ({status}): {str(ex)[:120]}")
    return sent


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="list the notifications that would go out")
    args = ap.parse_args(argv)

    events = [e for e in [article_event(), *rush_events(load_snapshots())] if e]
    if args.dry_run:
        for e in events:
            print(f"{e['id']}: {e['payload']['title']} | {e['payload']['body']} -> {e['payload']['url']}")
        print(f"{len(events)} notification(s) candidate(s)")
        return
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "VAPID_PRIVATE_KEY") if not os.environ.get(k)]
    if missing:
        print(f"push not configured (missing secrets: {', '.join(missing)}), nothing sent")
        return
    key = os.environ["VAPID_PRIVATE_KEY"].strip()
    for e in events:
        if already_sent(e["id"]):
            continue
        n = send(e, subscriptions(e["topic"]), key)
        supabase("POST", "push_events", {"id": e["id"], "recipients": n})
        print(f"{e['id']}: sent to {n} device(s)")


if __name__ == "__main__":
    main()
