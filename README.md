# Relevé

Site perso qui relève chaque matin les produits les plus demandés (France + États-Unis) et construit
l'historique jour après jour : jour, 7 jours, 30 jours, mois, année.

| Source | Ce qui est relevé | Limite |
|---|---|---|
| Amazon Best Sellers | top 30 de 17 catégories, FR et US | classement, pas un volume de ventes |
| Boutiques Shopify | top 12 « meilleures ventes » de 16 boutiques | tri Shopify = ventes depuis toujours |
| Google Trends | 10 recherches du moment par pays (flux RSS officiel) | toutes recherches, pas seulement des produits |
| TikTok | — | « Top Products » retiré du Creative Center public (vérifié le 4 oct. 2026) |

## Fonctionnement

- `collector/` (Python, bibliothèque standard uniquement) : `run.py` collecte et enregistre
  `data/snapshots/<année>/<date>.json.gz`; `aggregate.py` calcule les classements dans `site/data/`.
- `site/` : le site statique (HTML/CSS/JS sans build). Charte : `design/DESIGN.md`.
- `.github/workflows/daily.yml` : chaque jour vers 7 h (Paris), collecte, enregistre le relevé dans le dépôt,
  puis publie le site sur GitHub Pages.

## Mise en route (une seule fois)

1. Publier le dépôt sur GitHub (public).
2. Settings → Pages → Source : **GitHub Actions**.
3. Actions → « Collecte quotidienne et publication » → **Run workflow** pour un premier passage.

## En local

```powershell
python -m collector.run        # collecte (≈ 15 min, pauses volontaires entre les requêtes)
python -m collector.aggregate  # régénère site/data
python -m http.server 8765 --directory site
```
