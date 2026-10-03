"""Google Trends "Trending now" public RSS feed (official, free). These are all searches, not only products."""
import html
import re
import xml.etree.ElementTree as ET

from . import http
from .config import MARKETS

NS = {"ht": "https://trends.google.com/trending/rss"}


def _traffic(s):
    """'1000+' -> 1000, '2K+' -> 2000."""
    if not s:
        return None
    m = re.match(r"([\d\.,]+)\s*([KkMm]?)", s.replace(" ", "").replace(" ", ""))
    if not m:
        return None
    n = float(m.group(1).replace(",", ""))
    return int(n * {"k": 1_000, "m": 1_000_000}.get(m.group(2).lower(), 1))


def collect(log):
    lists, errors = [], []
    for market in MARKETS:
        url = f"https://trends.google.com/trending/rss?geo={market}"
        try:
            root = ET.fromstring(http.get(url, accept="application/rss+xml,application/xml"))
            items = []
            for i, it in enumerate(root.iter("item"), 1):
                news = it.find("ht:news_item", NS)
                raw = it.findtext("ht:approx_traffic", namespaces=NS)
                items.append({
                    "id": (it.findtext("title") or "").strip().lower(),
                    "rank": i,
                    "title": html.unescape(it.findtext("title") or ""),
                    "traffic": _traffic(raw),
                    "traffic_label": raw,
                    "published": it.findtext("pubDate"),
                    "image": it.findtext("ht:picture", namespaces=NS),
                    "news_title": html.unescape(news.findtext("ht:news_item_title", namespaces=NS) or "") if news is not None else None,
                    "news_url": news.findtext("ht:news_item_url", namespaces=NS) if news is not None else None,
                })
            lists.append({"market": market, "source_url": url, "items": items})
            log(f"gtrends {market}: {len(items)} items")
        except (http.FetchError, ET.ParseError) as e:
            errors.append(f"{market}: {e}")
            log(f"gtrends {market}: ERROR {e}")
        http.pause(1, 3)
    return {"lists": lists, "errors": errors}
