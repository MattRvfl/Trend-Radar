"""Daily collection: python -m collector.run [--only amazon,shopify,gtrends]

Writes data/snapshots/<year>/<date>.json.gz (one per UTC day; a second run the same day replaces it).
"""
import argparse
import datetime as dt
import gzip
import json
import pathlib
import sys
import time

from . import amazon, gtrends, shopify

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = {"amazon": amazon, "shopify": shopify, "gtrends": gtrends}


def log(msg):
    print(f"[{dt.datetime.now(dt.timezone.utc):%H:%M:%S}] {msg}", flush=True)


def snapshot_path(day):
    return ROOT / "data" / "snapshots" / day[:4] / f"{day}.json.gz"


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=",".join(SOURCES))
    args = ap.parse_args(argv)

    now = dt.datetime.now(dt.timezone.utc)
    day = now.date().isoformat()
    path = snapshot_path(day)
    snap = {"date": day, "sources": {}}
    if path.exists():  # keep sources we don't re-collect this time
        snap = json.loads(gzip.decompress(path.read_bytes()))

    for name in args.only.split(","):
        started = time.time()
        try:
            res = SOURCES[name].collect(log)
        except Exception as e:  # a broken source must never stop the others
            res = {"lists": [], "errors": [f"crash: {type(e).__name__}: {e}"]}
            log(f"{name}: CRASH {e}")
        res["status"] = "ok" if res["lists"] and not res["errors"] else ("partial" if res["lists"] else "error")
        res["collected_at"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
        res["seconds"] = round(time.time() - started)
        snap["sources"][name] = res

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(json.dumps(snap, ensure_ascii=False, separators=(",", ":")).encode(), mtime=0))
    log(f"saved {path.relative_to(ROOT)}: " + ", ".join(f"{k}={v['status']}" for k, v in snap["sources"].items()))
    # Exit non-zero only if *everything* failed, so the workflow still saves partial days.
    return 0 if any(v["lists"] for v in snap["sources"].values()) else 1


if __name__ == "__main__":
    sys.exit(main())
