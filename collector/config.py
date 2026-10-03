"""What we collect. Every entry here was checked by hand on 2026-10-03."""

MARKETS = {
    "FR": {"label": "France", "amazon": "www.amazon.fr", "lang": "fr-FR"},
    "US": {"label": "États-Unis", "amazon": "www.amazon.com", "lang": "en-US"},
}

# Shared category key -> (French label, amazon.fr slug, amazon.com slug).
# Only physical-product departments (no books, apps, gift cards, Kindle, music...).
AMAZON_CATEGORIES = {
    "high-tech":      ("High-Tech",               "electronics",    "electronics"),
    "informatique":   ("Informatique",            "computers",      "pc"),
    "cuisine-maison": ("Cuisine et Maison",       "kitchen",        "kitchen"),
    "electromenager": ("Électroménager",          "appliances",     "appliances"),
    "beaute":         ("Beauté et Parfum",        "beauty",         "beauty"),
    "sante":          ("Hygiène et Santé",        "hpc",            "hpc"),
    "mode":           ("Mode",                    "fashion",        "fashion"),
    "sport":          ("Sports et Loisirs",       "sports",         "sporting-goods"),
    "jouets":         ("Jeux et Jouets",          "toys",           "toys-and-games"),
    "jeux-video":     ("Jeux vidéo",              "videogames",     "videogames"),
    "bebe":           ("Bébé et Puériculture",    "baby",           "baby-products"),
    "animaux":        ("Animalerie",              "pet-supplies",   "pet-supplies"),
    "bricolage":      ("Bricolage",               "hi",             "hi"),
    "jardin":         ("Jardin",                  "lawn-garden",    "lawn-garden"),
    "auto":           ("Auto et Moto",            "automotive",     "automotive"),
    "bureau":         ("Fournitures de bureau",   "officeproduct",  "office-products"),
    "epicerie":       ("Épicerie",                "grocery",        "grocery"),
}

# Shopify stores whose /collections/all?sort_by=best-selling really re-orders products
# (verified: order differs from alphabetical). Headless stores (Gymshark, Allbirds, Skims...)
# don't expose this and are excluded. Shopify's sort uses all-time sales, not recent sales.
SHOPIFY_STORES = {
    "US": {
        "www.colourpop.com": ("ColourPop", "beaute"),
        "kyliecosmetics.com": ("Kylie Cosmetics", "beaute"),
        "fentybeauty.com": ("Fenty Beauty", "beaute"),
        "www.rhodeskin.com": ("Rhode", "beaute"),
        "www.summerfridays.com": ("Summer Fridays", "beaute"),
        "kith.com": ("Kith", "mode"),
        "www.puravidabracelets.com": ("Pura Vida", "mode"),
        "www.stanley1913.com": ("Stanley", "cuisine-maison"),
        "www.cozyearth.com": ("Cozy Earth", "cuisine-maison"),
        "liquiddeath.com": ("Liquid Death", "epicerie"),
        "ridge.com": ("Ridge", "mode"),
        "www.ugmonk.com": ("Ugmonk", "bureau"),
    },
    "FR": {
        "www.respire.co": ("Respire", "beaute"),
        "www.polene-paris.com": ("Polène", "mode"),
        "www.jimmyfairly.com": ("Jimmy Fairly", "mode"),
        "www.dagobear.com": ("Dagobear", "mode"),
    },
}

# Handles/titles that are not real products (gift cards, shipping insurance, subscriptions...).
SHOPIFY_JUNK = ("gift", "cadeau", "shipping", "protection", "route-", "insurance", "demo", "monthly-club",
                "customize", "sample", "e-gift", "carte-cadeau", "coffret-cadeau")

AMAZON_TOP_N = 30      # items rendered with full details on page 1
SHOPIFY_TOP_N = 12
