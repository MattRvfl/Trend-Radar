"""Polite HTTP client (stdlib only): one shared user agent, gzip, retries, random pauses."""
import gzip
import random
import time
import urllib.error
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")


class FetchError(Exception):
    pass


def pause(lo=4.0, hi=9.0):
    """Random pause between requests so we never hammer a site."""
    time.sleep(random.uniform(lo, hi))


def get(url, lang="en-US", retries=2, timeout=30, accept="text/html,application/xhtml+xml,*/*;q=0.8"):
    headers = {
        "User-Agent": UA,
        "Accept": accept,
        "Accept-Language": f"{lang},{lang.split('-')[0]};q=0.9,en;q=0.5",
        "Accept-Encoding": "gzip",
    }
    last = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    body = gzip.decompress(body)
                return body.decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            if e.code in (403, 404):
                break
        except Exception as e:  # network errors, timeouts
            last = str(e)
        if attempt < retries:
            time.sleep(15 * (attempt + 1))
    raise FetchError(f"{url}: {last}")
