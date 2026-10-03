"""Amazon Best Sellers (public pages, refreshed hourly by Amazon). One page per category per day."""
import html
import json
import re

from . import http
from .config import AMAZON_CATEGORIES, AMAZON_TOP_N, MARKETS

RANK_LIST = re.compile(r'data-client-recs-list="([^"]*)"')
CARD = re.compile(r'id="gridItemRoot"(.*?)(?=id="gridItemRoot"|<div id="endOfList"|$)', re.S)


def _text(pattern, s):
    m = re.search(pattern, s, re.S)
    return html.unescape(m.group(1)).strip() if m else None


def _number(s):
    if not s:
        return None
    digits = re.sub(r"[^\d,\.]", "", s)
    if not digits:
        return None
    # "1 234,56 €" / "$1,234.56" -> float
    if "," in digits and "." in digits:
        digits = digits.replace(",", "") if digits.rfind(".") > digits.rfind(",") else digits.replace(".", "").replace(",", ".")
    elif "," in digits:
        head, _, tail = digits.rpartition(",")
        digits = f"{head.replace(',', '')}.{tail}" if len(tail) <= 2 else digits.replace(",", "")
    try:
        return float(digits)
    except ValueError:
        return None


def parse_page(page, domain):
    """Returns ranked items. Raises ValueError if the page is not a best-seller list (captcha, layout change)."""
    if "captcha" in page.lower() and "gridItemRoot" not in page:
        raise ValueError("captcha")
    ranks = {}
    m = RANK_LIST.search(page)
    if m:
        for rec in json.loads(html.unescape(m.group(1))):
            r = rec.get("metadataMap", {}).get("render.zg.rank")
            if r:
                ranks[rec["id"]] = int(r)
    items = []
    for card in CARD.findall(page):
        asin = _text(r'data-asin="([A-Z0-9]{10})"', card)
        if not asin:
            continue
        rank = ranks.get(asin) or int(_text(r'zg-bdg-text">#(\d+)', card) or 0)
        title = _text(r'line-clamp-\d[^"]*">([^<]+)<', card) or _text(r'<img alt="([^"]+)"', card)
        stars = _text(r'a-icon-alt">([\d,\.]+)', card)
        reviews = _text(r'a-icon-row.*?a-size-small">([\d\s \xa0,\.]+)<', card)
        items.append({
            "id": asin,
            "rank": rank,
            "title": title,
            "url": f"https://{domain}/dp/{asin}",
            "image": _text(r'<img[^>]+src="([^"]+)"', card),
            "price": _number(_text(r'p13n-sc-price[^"]*">([^<]+)<', card)),
            "rating": _number(stars),
            "reviews": int(re.sub(r"\D", "", reviews)) if reviews and re.sub(r"\D", "", reviews) else None,
        })
    if not items:
        raise ValueError("no items found (layout change?)")
    items.sort(key=lambda i: i["rank"])
    return items[:AMAZON_TOP_N]


RETRY_ROUNDS = 2  # occasional captchas (seen on GitHub runners) usually clear after a minute or two


def collect(log):
    lists, failed = [], {}
    todo = []
    for market, cfg in MARKETS.items():
        idx = 1 if market == "FR" else 2
        for key, row in AMAZON_CATEGORIES.items():
            todo.append((market, key, f"https://{cfg['amazon']}/gp/bestsellers/{row[idx]}/"))
    for attempt in range(RETRY_ROUNDS + 1):
        if attempt:
            log(f"amazon: retrying {len(todo)} blocked page(s), round {attempt}")
            http.pause(60, 120)
        retry = []
        for market, key, url in todo:
            cfg = MARKETS[market]
            try:
                items = parse_page(http.get(url, cfg["lang"]), cfg["amazon"])
                lists.append({"market": market, "category": key, "source_url": url, "items": items})
                failed.pop((market, key), None)
                log(f"amazon {market} {key}: {len(items)} items")
            except (http.FetchError, ValueError) as e:
                failed[(market, key)] = str(e)
                retry.append((market, key, url))
                log(f"amazon {market} {key}: ERROR {e}")
            http.pause()
        todo = retry
        if not todo:
            break
    return {"lists": lists, "errors": [f"{m}/{k}: {e}" for (m, k), e in failed.items()]}
