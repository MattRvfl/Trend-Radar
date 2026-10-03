"""Best sellers of selected Shopify stores, via the storefront's own `sort_by=best-selling` collection page.

products.json ignores sort_by (checked 2026-10-03), so the order comes from the HTML page and the
details from /products/<handle>.json. Each run re-checks that the sort really changes the order.
"""
import json
import re

from . import http
from .config import SHOPIFY_JUNK, SHOPIFY_STORES, SHOPIFY_TOP_N

HANDLE = re.compile(r'/products/([a-z0-9][a-z0-9-]*)')


def _handles(page):
    seen = []
    for h in HANDLE.findall(page):
        if h not in seen:
            seen.append(h)
    return seen


def _is_junk(handle, title=""):
    s = f"{handle} {title}".lower()
    return any(j in s for j in SHOPIFY_JUNK)


def collect(log):
    lists, errors = [], []
    for market, stores in SHOPIFY_STORES.items():
        for host, (name, category) in stores.items():
            base = f"https://{host}"
            try:
                best = _handles(http.get(f"{base}/collections/all?sort_by=best-selling"))
                http.pause(1, 3)
                alpha = _handles(http.get(f"{base}/collections/all?sort_by=title-ascending"))
                if len(best) < 5 or best[:8] == alpha[:8]:
                    raise ValueError("best-selling sort not honoured any more")
                items = []
                for h in best[:SHOPIFY_TOP_N * 2]:
                    if len(items) >= SHOPIFY_TOP_N:
                        break
                    if _is_junk(h):
                        continue
                    http.pause(1, 2.5)
                    try:
                        p = json.loads(http.get(f"{base}/products/{h}.json", accept="application/json"))["product"]
                    except (http.FetchError, ValueError, KeyError):
                        continue
                    if _is_junk(h, p.get("title", "")):
                        continue
                    variant = (p.get("variants") or [{}])[0]
                    image = (p.get("image") or {}).get("src")
                    items.append({
                        "id": f"{host}/{h}",
                        "rank": len(items) + 1,
                        "title": p.get("title"),
                        "url": f"{base}/products/{h}",
                        "image": image,
                        "price": float(variant["price"]) if variant.get("price") else None,
                        "type": p.get("product_type") or None,
                    })
                if not items:
                    raise ValueError("no real product among the best sellers")
                lists.append({"market": market, "store": name, "host": host, "category": category,
                              "source_url": f"{base}/collections/all?sort_by=best-selling", "items": items})
                log(f"shopify {name}: {len(items)} items")
            except (http.FetchError, ValueError) as e:
                errors.append(f"{name}: {e}")
                log(f"shopify {name}: ERROR {e}")
            http.pause(2, 5)
    return {"lists": lists, "errors": errors}
