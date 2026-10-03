"""Sends the latest weekly article to newsletter subscribers: python -m collector.newsletter [--dry-run]

Subscribers come from Supabase (profiles.newsletter = true), read with the service-role key; mail goes
through an SMTP relay (Brevo by default). Each issue is recorded in newsletter_issues, so a re-run never
sends twice. Without the secrets below it does nothing (and says so).

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_LOGIN, SMTP_PASSWORD, NEWSLETTER_FROM,
     optional SMTP_HOST (smtp-relay.brevo.com), SMTP_PORT (587), SITE_URL.
"""
import argparse
import html
import json
import os
import pathlib
import smtplib
import ssl
import time
import urllib.parse
import urllib.request
from email.message import EmailMessage
from email.utils import formataddr, make_msgid, parseaddr

from .config import AMAZON_CATEGORIES, MARKETS

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE_URL = os.environ.get("SITE_URL", "https://mattrvfl.github.io/Trend-Radar/")
DAILY_CAP = 290          # Brevo free plan: 300 e-mails/day, keep a margin for login links
PER_SECTION = 5
FLAGS = {"FR": "France", "US": "États-Unis"}


# --- Supabase (PostgREST) ------------------------------------------------------------------------
def supabase(method, path, body=None):
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "return=minimal"}
    if not key.startswith("sb_"):  # legacy service_role JWT; new sb_secret_ keys go in apikey only
        headers["Authorization"] = f"Bearer {key}"
    req = urllib.request.Request(url, method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


def already_sent(issue_id):
    return bool(supabase("GET", f"newsletter_issues?select=id&id=eq.{urllib.parse.quote(issue_id)}"))


def subscribers():
    return supabase("GET", "profiles?select=email,markets,founding_member,unsubscribe_token"
                           "&newsletter=is.true&email=neq.&order=created_at")


# --- Rendering -----------------------------------------------------------------------------------
def e(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def safe_url(u):
    return u if isinstance(u, str) and u.startswith("https://") else None


def price(p, market):
    if not p or p <= 0:
        return ""
    return f"{p:.2f} €".replace(".", ",") if market == "FR" else f"${p:.2f}"


def item_line(s, it):
    title = e((it.get("title") or "")[:110])
    link = safe_url(it.get("url"))
    head = f'<a href="{e(link)}" style="color:#1d1d1f;text-decoration:none">{title}</a>' if link else title
    cat = AMAZON_CATEGORIES.get(it.get("category"), (it.get("category") or "",))[0]
    if s["type"] == "climbers":
        meta = f"▲ +{it['change']} places · n° {it['rank_before']} → n° {it['rank_now']} · {e(cat)}"
    elif s["type"] == "newcomers":
        meta = f"Nouveau · n° {it['rank_now']} · {e(cat)}"
    elif s["type"] == "leaders":
        meta = f"N° 1 · {it['days']} j sur {it['days']} · {e(cat)}"
    elif s["type"] == "rush":
        meta = f"{e(it['brand'].capitalize())} : {it['share']} des {it['of']} premières places · {e(cat)}"
    elif s["type"] == "shopify":
        meta = f"{e(it.get('store'))} · n° {it['rank_now']}"
    else:  # buzz
        return f'<li style="margin:0 0 6px">« {e(it["title"])} » <span style="color:#6e6e73">{e(it.get("traffic_label") or "")} recherches</span></li>'
    p = price(it.get("price"), s["market"])
    return (f'<li style="margin:0 0 10px">{head}<br><span style="color:#6e6e73;font-size:13px">{meta}'
            f'{" · " + e(p) if p else ""}</span></li>')


def render(article, sub):
    url = SITE_URL + f"#/articles/{article['id']}"
    unsub = SITE_URL + f"#/desinscription?t={sub['unsubscribe_token']}"
    markets = [m for m in MARKETS if m in (sub.get("markets") or ["FR"])]
    parts = []
    if article.get("editorial"):
        paras = "".join(f'<p style="margin:0 0 12px">{e(p)}</p>' for p in article["editorial"].split("\n\n") if p.strip())
        parts.append(f'<div style="border-left:3px solid #2453C2;padding:2px 0 2px 14px;margin:0 0 24px">{paras}</div>')
    for s in article["sections"]:
        if s["market"] not in markets:
            continue
        label = f" · {FLAGS[s['market']]}" if len(markets) > 1 else ""
        items = "".join(item_line(s, it) for it in s["items"][:PER_SECTION])
        parts.append(f'<h2 style="font-size:17px;margin:24px 0 4px">{e(s["title"])}{e(label)}</h2>'
                     f'<p style="color:#6e6e73;font-size:13px;margin:0 0 10px">{e(s["intro"])}</p>'
                     f'<ul style="padding-left:18px;margin:0">{items}</ul>')
    founder = ('<p style="margin:0 0 6px">Vous êtes <strong>membre fondateur</strong> : un an offert le jour où '
               'Relevé deviendra payant.</p>') if sub.get("founding_member") else ""
    body = f"""<!doctype html><html lang="fr"><body style="margin:0;background:#f5f5f7">
<div style="max-width:600px;margin:0 auto;padding:24px 20px;font:15px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1d1d1f;background:#fff">
<p style="color:#6e6e73;font-size:13px;margin:0 0 4px">Relevé · semaine {e(article['id'].split('-W')[1])}</p>
<h1 style="font-size:22px;margin:0 0 8px">{e(article['title'])}</h1>
<p style="color:#6e6e73;font-size:13px;margin:0 0 20px">{article['period']['days']} relevés quotidiens · un classement n'est pas un volume de ventes.</p>
{''.join(parts)}
<p style="margin:28px 0"><a href="{e(url)}" style="background:#2453C2;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Lire l'article complet</a></p>
<hr style="border:0;border-top:1px solid #e5e5ea;margin:24px 0">
<div style="color:#6e6e73;font-size:12px">{founder}
<p style="margin:0 0 6px">Vous recevez cet e-mail car vous vous êtes inscrit à la newsletter de Relevé.
<a href="{e(unsub)}" style="color:#6e6e73">Se désinscrire en un clic</a>.</p>
<p style="margin:0">Sources : Amazon Meilleures ventes, boutiques Shopify, Google Trends. Liens sans affiliation.</p></div>
</div></body></html>"""
    text = (f"{article['title']}\n\nLire l'article : {url}\n\n"
            f"Se désinscrire : {unsub}\n")
    return body, text, unsub


def send_all(article, subs, dry_run):
    host = os.environ.get("SMTP_HOST", "smtp-relay.brevo.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    sender = os.environ.get("NEWSLETTER_FROM", "Relevé <releve@example.invalid>")
    name, addr = parseaddr(sender)
    subject = f"Relevé · {article['title']}"
    sent = 0
    smtp = None
    if not dry_run:
        smtp = smtplib.SMTP(host, port, timeout=30)
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(os.environ["SMTP_LOGIN"], os.environ["SMTP_PASSWORD"])
    try:
        for sub in subs[:DAILY_CAP]:
            body, text, unsub = render(article, sub)
            msg = EmailMessage()
            msg["Subject"], msg["From"], msg["To"] = subject, formataddr((name or "Relevé", addr)), sub["email"]
            msg["Message-ID"] = make_msgid(domain=addr.split("@")[-1] if "@" in addr else None)
            msg["List-Unsubscribe"] = f"<{unsub}>"
            msg.set_content(text)
            msg.add_alternative(body, subtype="html")
            if dry_run:
                out = ROOT / "tmp" / "newsletter"
                out.mkdir(parents=True, exist_ok=True)
                (out / f"{article['id']}.html").write_text(body, encoding="utf-8")
                print(f"dry-run: preview written to {out.relative_to(ROOT)} ({len(subs)} subscriber(s) would receive it)")
                return 0
            smtp.send_message(msg)
            sent += 1
            time.sleep(0.4)
    finally:
        if smtp:
            smtp.quit()
    if len(subs) > DAILY_CAP:
        print(f"WARNING: {len(subs) - DAILY_CAP} subscriber(s) not sent (free plan cap {DAILY_CAP}/day)")
    return sent


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="render the e-mail to tmp/ without sending")
    ap.add_argument("--article", help="article file (default: latest in data/articles, or tmp/articles in dry-run)")
    args = ap.parse_args(argv)

    if args.article:
        path = pathlib.Path(args.article)
    else:
        pool = sorted((ROOT / "data" / "articles").glob("*.json")) or (
            sorted((ROOT / "tmp" / "articles").glob("*.json")) if args.dry_run else [])
        if not pool:
            print("no article to send")
            return
        path = pool[-1]
    article = json.loads(path.read_text(encoding="utf-8"))

    if args.dry_run:
        demo = {"email": "apercu@example.invalid", "markets": ["FR", "US"], "founding_member": True,
                "unsubscribe_token": "00000000-0000-0000-0000-000000000000"}
        send_all(article, [demo], True)
        return
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SMTP_LOGIN", "SMTP_PASSWORD", "NEWSLETTER_FROM")
               if not os.environ.get(k)]
    if missing:
        print(f"newsletter not configured (missing secrets: {', '.join(missing)}), nothing sent")
        return
    if already_sent(article["id"]):
        print(f"issue {article['id']} already sent, nothing to do")
        return
    subs = subscribers()
    n = send_all(article, subs, False)
    supabase("POST", "newsletter_issues", {"id": article["id"], "recipients": n})
    print(f"issue {article['id']} sent to {n} subscriber(s)")


if __name__ == "__main__":
    main()
