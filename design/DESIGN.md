# Relevé : charte de design

> Version 1.0, 3 octobre 2026. Document de référence pour construire le site statique (GitHub Pages) qui lit `site/data/*.json`.
> Toute décision ici est **définitive** pour la v1. Si un cas n'est pas couvert, appliquer les principes (§2) dans l'ordre où ils sont listés.

---

## 0. Nom

**Relevé** (au lieu de « Trend Radar »).

- Un *relevé*, c'est une lecture d'instrument à heure fixe : c'est exactement ce que fait le produit (une lecture par jour des classements publics). Le nom promet une mesure, pas une prédiction : il porte la valeur d'honnêteté.
- Court, français, prononçable par un anglophone, pas de conflit avec un outil e-commerce connu.
- Signature (balise `<meta name="description">` et sous-titre de l'accueil) : **« Les classements du commerce en ligne, relevés chaque matin. France et États-Unis. »**
- Logotype : mot « Relevé » en Inter 700, `letter-spacing: -0.02em`, précédé d'un pictogramme SVG 20×20 : carré `--radius-sm` rempli `--text`, contenant une polyligne `--bg` de 3 segments qui monte (la courbe de rang). Favicon = ce pictogramme seul (SVG inline en data URI).

---

## 1. Références étudiées et ce que j'en retiens

| # | Référence | Ce que j'ai observé précisément | Ce que Relevé en fait |
|---|---|---|---|
| 1 | **Exploding Topics** (https://explodingtopics.com/) | Chaque carte associe un chiffre absolu (« 8.1K Volume ») et un relatif (« +300% Growth ») ; une seule barre de filtre « FILTER BY: 2 years / All Categories ». | On associe toujours **rang absolu + variation**. On rejette le pourcentage de croissance sans base : un rang qui passe de 2 à 1 n'est pas « +50 % ». Variation exprimée **en places**. |
| 2 | **Google Trends, Trending now** (https://trends.google.com/trending?geo=FR) | Volume affiché en tranche (« 50K+ searches »), ancienneté (« 19h ago »), statut défini en clair (« Active : These search queries are still being searched more than usual »), tri explicite (Titre / Volume / Récence / Pertinence). | Section Buzz : on recopie la tranche **telle quelle** (« 1 000+ recherches »), jamais convertie en nombre exact. Chaque statut a une définition visible au survol/focus. |
| 3 | **Our World in Data, grapher** (https://ourworldindata.org/grapher/life-expectancy) | Ligne « Data source: … » sous chaque graphique, et métadonnées « Last updated » / « Next expected update ». | Composant **Ligne de source** obligatoire sous chaque module : source, date et heure du relevé, prochain relevé prévu. |
| 4 | **FT Visual Vocabulary** (https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md) | Classement → « ordered bar », « dot strip », « slope » (« perfect for showing how ranks have changed over time ») ; évolution temporelle → « line ». | Score = **barre ordonnée** ; historique = **courbe** ; aucun camembert, aucune jauge. |
| 5 | **Edward Tufte, sparklines** (https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/) | Graphique « de la taille d'un mot », point le plus récent mis en couleur et relié au chiffre affiché, bande grise de « plage normale », pente moyenne proche de 45°. | Sparkline 72×20 px, dernier point en accent égal au rang affiché à côté, bande « top 10 » en fond, même échelle pour toutes les lignes. |
| 6 | **Linear, refonte de l'UI** (https://linear.app/now/how-we-redesigned-the-linear-ui) | Thème généré en LCH à partir de 3 variables (base, accent, contraste) ; réduction volontaire de la couleur dans le chrome ; Inter Display pour les titres, Inter pour le reste. | Gris quasi achromatiques, **un seul accent**, Inter avec axe optique (`opsz`) qui donne la coupe Display aux grandes tailles. |
| 7 | **Stripe, systèmes de couleurs accessibles** (https://stripe.com/blog/accessible-color-systems) | Clarté perceptuelle (CIELAB) ; cibles 4.5:1 texte et 3:1 icônes/grand texte ; écart fixe de niveaux qui garantit le contraste. | Toutes les couleurs sémantiques sont calées au même niveau de clarté (≈ 5–7:1 sur fond clair, ≈ 7–9:1 sur fond sombre). Ratios vérifiés au §3.3. |
| 8 | **Vercel Geist, couleurs** (https://vercel.com/geist/colors) | Échelle par rôle : 1-3 fonds de composant (défaut/survol/actif), 4-6 bordures, 7-8 fonds forts, 9 texte secondaire, 10 texte principal. | Tokens nommés **par rôle** (`--surface-2` = survol, `--border-strong` = contour de contrôle), jamais par teinte. |
| 9 | **IBM Carbon, palettes data viz** (https://carbondesignsystem.com/data-visualization/color-palettes/) | Palette d'alerte séparée des palettes catégorielles (rouge erreur, orange, jaune, vert) ; dégradés « not supported » pour signifier une progression ; divergente violet/teal pour les taux de variation. | Palette **statut** (ok/partiel/erreur) distincte de la palette **variation** (hausse/baisse/nouveau). Aucun dégradé porteur de sens. |
| 10 | **Datawrapper, daltonisme** (https://www.datawrapper.de/blog/colorblindness-part2) | « Blue is the safest hue » ; ne pas opposer vert et rouge de même clarté ; « get it right in black & white » ; étiquettes directes, symboles, formes. | Hausse/baisse codées par **icône ▲▼ + signe + teinte** ; teintes dérivées de la palette Okabe-Ito (vert bleuté / vermillon) ; lisible en niveaux de gris grâce aux icônes. |
| 11 | **Refactoring UI, construire sa palette** (https://www.refactoringui.com/previews/building-your-color-palette) | 8 à 10 gris, 9 nuances par couleur, définies une fois pour toutes ; ne pas générer avec `lighten()`/`darken()`. | Valeurs hex figées dans `tokens.css` ; interdiction de `color-mix()` ou d'opacité pour fabriquer une couleur sémantique. |
| 12 | **FastMoss / Kalodata / Jungle Scout** (https://www.fastmoss.com/blog/best-tiktok-shop-tools-for-sellers-2026/, https://www.junglescout.com/features/product-database/) | Classements filtrés par **période × catégorie × pays**, tendance 7/28/90 jours ; colonnes « estimated sales », « revenue » issues de modèles propriétaires (étiquetées « estimates »). | On garde le trio de filtres **Marché / Période / Catégorie** (le modèle mental des vendeurs). On refuse toute estimation de ventes : c'est notre différenciation, rappelée dans l'interface. |

Référence complémentaire pour les teintes : palette Okabe & Ito, conçue pour les daltoniens (https://jfly.uni-koeln.de/color/).

---

## 2. Positionnement visuel et principes

**Positionnement : un instrument de mesure, pas une vitrine.** Le ton visuel croise la rigueur éditoriale d'un service data de presse (FT, Our World in Data) et la densité calme d'un outil (Linear, Vercel). Fond neutre, typographie unique, couleur réservée au sens. Les images produits sont les seules taches de couleur « libres » : elles servent à reconnaître un produit en un coup d'œil.

### Les 5 principes (par ordre de priorité)

1. **La source avant le chiffre.** Aucun nombre n'apparaît sans que sa source et sa date soient visibles dans le même bloc (pas seulement en pied de page). Règle : chaque module commence par un titre et finit par une *Ligne de source* (§7.12).
2. **Dire ce qu'on ne sait pas.** Une donnée absente s'affiche « — » (jamais 0), une période incomplète affiche sa couverture, un jour non relevé est hachuré, une source en panne garde sa place avec un message. On n'interpole pas, on n'extrapole pas, on n'estime pas de ventes.
3. **La couleur signifie, elle ne décore pas.** Couleur autorisée pour : variation (hausse/baisse/nouveau), statut de source, accent d'interaction (lien, sélection, focus), pastille de source. Partout ailleurs : gris. Une couleur n'est jamais seule à porter une information (toujours icône, signe ou texte).
4. **Densité calme.** Une liste de 30 produits doit se lire en 10 secondes : colonnes fixes, chiffres tabulaires alignés à droite, rang dans une colonne dédiée, une ligne = une hauteur constante, pas de bordures de cellule verticales.
5. **Un geste, une réponse.** Chaque vue répond à une question (§5). Les filtres vivent dans l'URL (partageable, bouton Retour fiable). Le détail d'un produit s'ouvre en panneau sans quitter la liste. Tout est faisable au clavier.

---

## 3. Design tokens

### 3.1 Fichier `assets/css/tokens.css` (à copier tel quel)

```css
/* ==========================================================================
   Relevé : design tokens v1.0
   Thème : clair par défaut, sombre via prefers-color-scheme ou data-theme.
   ========================================================================== */

/* Typographie : charger dans <head>, avant tokens.css
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap">
*/

:root {
  color-scheme: light;

  /* ---- Fonds et surfaces ---- */
  --bg:            #FAFAF9;  /* fond de page */
  --surface:       #FFFFFF;  /* cartes, panneau, lignes de liste */
  --surface-2:     #F4F4F2;  /* survol, fond de contrôle segmenté */
  --surface-3:     #EBEBE8;  /* état actif/pressé ; texte-3 interdit dessus */
  --border:        #E4E4E0;  /* séparateurs, contour de carte (décoratif) */
  --border-strong: #8F8F96;  /* contour de champ/contrôle (≥ 3:1) */

  /* ---- Texte ---- */
  --text:   #18181B;  /* principal */
  --text-2: #52525B;  /* secondaire : méta, libellés */
  --text-3: #6B6B73;  /* tertiaire : axes, aides ; jamais sur --surface-3 */

  /* ---- Accent (interaction uniquement) ---- */
  --accent:       #2453C2;
  --accent-hover: #1D46A8;
  --accent-soft:  #EBF0FB;  /* fond d'élément sélectionné, bande top 10 */
  --on-accent:    #FFFFFF;
  --focus-ring:   #2453C2;

  /* ---- Variation de rang (toujours avec icône + signe) ---- */
  --up:           #00704F;  --up-soft:      #E2F3EC;
  --down:         #B03A06;  --down-soft:    #FBEAE0;
  --new:          #8A3373;  --new-soft:     #F6E7F1;
  --neutral:      #6B6B73;  --neutral-soft: #F1F1EF;

  /* ---- Statut de source (toujours avec icône + mot) ---- */
  --ok:     #00704F;  --ok-soft:     #E2F3EC;
  --warn:   #8A5300;  --warn-soft:   #FBF0D9;
  --danger: #B42318;  --danger-soft: #FDEBEA;

  /* ---- Pastilles de source (point 8 px + nom, jamais en aplat) ---- */
  --src-amazon:  #9E5F00;
  --src-shopify: #4E7F2A;
  --src-tiktok:  #0B7E85;
  --src-google:  #4A64D0;

  /* ---- Graphiques ---- */
  --chart-line:  var(--accent);
  --chart-grid:  #EDEDEA;
  --chart-band:  #EBF0FB;   /* bande « top 10 » */
  --hatch:       #C9C9C4;   /* hachures « jour non relevé » */
  --skeleton:    #EBEBE8;
  --image-tile:  #FFFFFF;   /* fond des vignettes produit, blanc dans les 2 thèmes */
  --overlay:     rgb(24 24 27 / 0.32);

  /* ---- Ombres ---- */
  --shadow-1: 0 1px 2px rgb(24 24 27 / 0.06);
  --shadow-2: 0 1px 2px rgb(24 24 27 / 0.06), 0 4px 12px rgb(24 24 27 / 0.08);
  --shadow-3: 0 16px 48px rgb(24 24 27 / 0.16);

  /* ---- Typographie ---- */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace; /* uniquement page Méthode (formule) */

  --text-xs:   0.75rem;    --lh-xs:   1rem;       /* 12/16 axes, méta fine */
  --text-sm:   0.8125rem;  --lh-sm:   1.25rem;    /* 13/20 badges, colonnes secondaires */
  --text-md:   0.875rem;   --lh-md:   1.375rem;   /* 14/22 texte d'interface par défaut */
  --text-base: 1rem;       --lh-base: 1.5rem;     /* 16/24 lecture (Méthode), titres produit du panneau */
  --text-lg:   1.125rem;   --lh-lg:   1.625rem;   /* 18/26 titres de module (h3) */
  --text-xl:   1.375rem;   --lh-xl:   1.75rem;    /* 22/28 titres de section (h2) */
  --text-2xl:  1.75rem;    --lh-2xl:  2.125rem;   /* 28/34 h1 mobile, chiffres KPI */
  --text-3xl:  2.25rem;    --lh-3xl:  2.625rem;   /* 36/42 h1 ≥ 900 px */

  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold: 600;
  --weight-bold:    700;   /* h1 et logotype uniquement */

  --tracking-tight: -0.02em;  /* ≥ 22 px */
  --tracking-caps:   0.04em;  /* petites capitales de libellés de colonnes */

  /* ---- Espacements (base 4 px) ---- */
  --space-0: 0;
  --space-1: 0.125rem; /* 2  */
  --space-2: 0.25rem;  /* 4  */
  --space-3: 0.5rem;   /* 8  */
  --space-4: 0.75rem;  /* 12 */
  --space-5: 1rem;     /* 16 : gouttière mobile */
  --space-6: 1.25rem;  /* 20 */
  --space-7: 1.5rem;   /* 24 : gouttière tablette, gap de grille */
  --space-8: 2rem;     /* 32 : gouttière desktop, écart entre modules */
  --space-9: 2.5rem;   /* 40 */
  --space-10: 3rem;    /* 48 : écart entre sections */
  --space-11: 4rem;    /* 64 */

  --gutter: var(--space-5);
  --container: 75rem;      /* 1200 px */
  --reading: 42.5rem;      /* 680 px, page Méthode */
  --panel-width: 30rem;    /* 480 px, panneau produit desktop */
  --header-h: 3.5rem;      /* 56 px */
  --tabbar-h: 3.5rem;      /* 56 px, barre d'onglets mobile */
  --row-h: 4rem;           /* 64 px, ligne de classement desktop */
  --row-h-mobile: 4.5rem;  /* 72 px */
  --tap: 2.75rem;          /* 44 px, cible tactile minimale */

  /* ---- Rayons ---- */
  --radius-xs: 4px;    /* badges, pastilles */
  --radius-sm: 6px;    /* boutons, champs, vignettes de ligne */
  --radius-md: 10px;   /* cartes, modules */
  --radius-lg: 14px;   /* panneau, feuilles mobiles */
  --radius-full: 999px;

  /* ---- Z-index ---- */
  --z-base: 0;
  --z-sticky: 100;     /* en-tête, barre de filtres, barre d'onglets */
  --z-dropdown: 200;   /* menus Mois/Année, popover statut */
  --z-overlay: 300;    /* voile du panneau */
  --z-panel: 310;      /* panneau produit (<dialog>) */
  --z-toast: 400;
  --z-tooltip: 500;    /* infobulles de graphique */

  /* ---- Mouvement ---- */
  --dur-instant: 80ms;   /* survol, pression */
  --dur-fast: 140ms;     /* badges, menus */
  --dur-base: 220ms;     /* panneau, feuille mobile */
  --dur-slow: 320ms;     /* tracé de courbe à l'ouverture */
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --skeleton-cycle: 1400ms;
}

/* ---- Thème sombre : préférence système, sauf choix explicite « clair » ---- */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0E0F11;  --surface: #17181B;  --surface-2: #1F2024;  --surface-3: #26282D;
    --border: #2B2D32;  --border-strong: #686B74;
    --text: #EDEDEF;  --text-2: #A8A8B0;  --text-3: #8B8B94;
    --accent: #82A7F8;  --accent-hover: #A1BEFA;  --accent-soft: #1A2540;  --on-accent: #0E0F11;  --focus-ring: #82A7F8;
    --up: #3CCB9B;  --up-soft: #10291F;
    --down: #FF925A;  --down-soft: #33190D;
    --new: #EE93CF;  --new-soft: #2E1726;
    --neutral: #8B8B94;  --neutral-soft: #222327;
    --ok: #3CCB9B;  --ok-soft: #10291F;
    --warn: #F0C04A;  --warn-soft: #2B2210;
    --danger: #FF8078;  --danger-soft: #331614;
    --src-amazon: #F0A23B;  --src-shopify: #8CC265;  --src-tiktok: #3CC8CF;  --src-google: #8BA0F2;
    --chart-grid: #24262A;  --chart-band: #1A2540;  --hatch: #3A3C42;  --skeleton: #222327;
    --image-tile: #FFFFFF;
    --overlay: rgb(0 0 0 / 0.6);
    --shadow-1: 0 0 0 1px var(--border);
    --shadow-2: 0 0 0 1px var(--border), 0 4px 16px rgb(0 0 0 / 0.5);
    --shadow-3: 0 0 0 1px var(--border), 0 16px 48px rgb(0 0 0 / 0.6);
  }
}

/* ---- Thème sombre forcé par l'utilisateur (même valeurs) ---- */
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0E0F11;  --surface: #17181B;  --surface-2: #1F2024;  --surface-3: #26282D;
  --border: #2B2D32;  --border-strong: #686B74;
  --text: #EDEDEF;  --text-2: #A8A8B0;  --text-3: #8B8B94;
  --accent: #82A7F8;  --accent-hover: #A1BEFA;  --accent-soft: #1A2540;  --on-accent: #0E0F11;  --focus-ring: #82A7F8;
  --up: #3CCB9B;  --up-soft: #10291F;
  --down: #FF925A;  --down-soft: #33190D;
  --new: #EE93CF;  --new-soft: #2E1726;
  --neutral: #8B8B94;  --neutral-soft: #222327;
  --ok: #3CCB9B;  --ok-soft: #10291F;
  --warn: #F0C04A;  --warn-soft: #2B2210;
  --danger: #FF8078;  --danger-soft: #331614;
  --src-amazon: #F0A23B;  --src-shopify: #8CC265;  --src-tiktok: #3CC8CF;  --src-google: #8BA0F2;
  --chart-grid: #24262A;  --chart-band: #1A2540;  --hatch: #3A3C42;  --skeleton: #222327;
  --image-tile: #FFFFFF;
  --overlay: rgb(0 0 0 / 0.6);
  --shadow-1: 0 0 0 1px var(--border);
  --shadow-2: 0 0 0 1px var(--border), 0 4px 16px rgb(0 0 0 / 0.5);
  --shadow-3: 0 0 0 1px var(--border), 0 16px 48px rgb(0 0 0 / 0.6);
}

/* ---- Gouttières responsive ---- */
@media (min-width: 600px)  { :root { --gutter: var(--space-7); } }
@media (min-width: 1200px) { :root { --gutter: var(--space-8); } }

/* ---- Mouvement réduit : tout devient instantané, pas de shimmer ---- */
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-instant: 0ms; --dur-fast: 0ms; --dur-base: 0ms; --dur-slow: 0ms;
    --skeleton-cycle: 0ms;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 3.2 Règles d'usage des couleurs

- **Accent** : liens, élément sélectionné (segment actif, onglet actif, ligne ouverte dans le panneau), anneau de focus, courbe de rang. Jamais pour une variation.
- **Hausse / baisse / nouveau** : uniquement dans le composant *Badge de variation* (§7.3) et dans les graphiques de variation TikTok. Le badge porte toujours l'icône (▲ ▼ ✚) et un nombre ou un mot.
- **Statut** : uniquement dans le *Bandeau des sources* (§7.11) et les états d'erreur de source.
- **Pastilles de source** : point de 8 px à gauche du nom de la source. Jamais en fond, jamais en texte de paragraphe, jamais sur une barre de graphique.
- **Vignettes produit** : fond `--image-tile` blanc dans les deux thèmes (les visuels Amazon/Shopify sont détourés sur blanc ; un fond sombre les rendrait « collés »). En thème sombre, ajouter `outline: 1px solid var(--border)` et `filter: brightness(0.92)` pour éviter l'éblouissement.
- Interdits : `opacity` pour éclaircir un texte, `color-mix()`/`lighten()` pour créer une teinte, dégradés porteurs de sens, texte `--text-3` sur `--surface-3`.

### 3.3 Contrastes vérifiés (WCAG 2.1, formule de luminance relative)

Seuils : texte normal ≥ 4.5:1 (AA), grand texte et composants/graphiques ≥ 3:1 (AA, critère 1.4.11).

**Thème clair**

| Paire | Ratio | Usage |
|---|---|---|
| `--text` #18181B / `--bg` #FAFAF9 | 16.96 | texte principal |
| `--text` / `--surface` #FFFFFF | 17.72 | |
| `--text-2` #52525B / `--bg` | 7.40 | méta |
| `--text-2` / `--surface-2` #F4F4F2 | 7.02 | |
| `--text-2` / `--surface-3` #EBEBE8 | 6.47 | |
| `--text-3` #6B6B73 / `--surface` | 5.28 | axes, aides |
| `--text-3` / `--bg` | 5.06 | |
| `--text-3` / `--surface-2` | 4.80 | |
| `--text-3` / `--surface-3` | 4.42 | **interdit** (< 4.5) |
| `--border-strong` #8F8F96 / `--surface` | 3.21 | contour de champ (1.4.11) |
| `--border-strong` / `--bg` | 3.08 | |
| `--accent` #2453C2 / `--surface` | 6.79 | liens, focus |
| `--on-accent` #FFFFFF / `--accent` | 6.79 | bouton plein |
| `--on-accent` / `--accent-hover` #1D46A8 | 8.42 | |
| `--accent` / `--accent-soft` #EBF0FB | 5.95 | segment actif |
| `--up` #00704F / `--surface` · / `--up-soft` | 6.12 · 5.32 | badge hausse |
| `--down` #B03A06 / `--surface` · / `--down-soft` | 6.08 · 5.20 | badge baisse |
| `--new` #8A3373 / `--surface` · / `--new-soft` | 7.50 · 6.29 | badge nouveau |
| `--neutral` #6B6B73 / `--neutral-soft` #F1F1EF | 4.67 | badge stable |
| `--warn` #8A5300 / `--surface` · / `--warn-soft` | 6.33 · 5.60 | statut partiel |
| `--danger` #B42318 / `--surface` · / `--danger-soft` | 6.57 · 5.71 | statut erreur |
| `--src-amazon` #9E5F00 / `--surface` | 5.13 | pastille |
| `--src-shopify` #4E7F2A / `--surface` | 4.78 | |
| `--src-tiktok` #0B7E85 / `--surface` | 4.84 | |
| `--src-google` #4A64D0 / `--surface` | 5.22 | |

**Thème sombre**

| Paire | Ratio | Usage |
|---|---|---|
| `--text` #EDEDEF / `--bg` #0E0F11 | 16.40 | |
| `--text` / `--surface` #17181B | 15.18 | |
| `--text-2` #A8A8B0 / `--surface` · / `--surface-2` #1F2024 · / `--surface-3` #26282D | 7.52 · 6.89 · 6.25 | |
| `--text-3` #8B8B94 / `--surface` · / `--bg` · / `--surface-2` | 5.26 · 5.68 · 4.82 | |
| `--text-3` / `--surface-3` | 4.37 | **interdit** |
| `--border-strong` #686B74 / `--surface` · / `--bg` | 3.33 · 3.60 | |
| `--accent` #82A7F8 / `--surface` · / `--accent-soft` #1A2540 | 7.47 · 6.39 | |
| `--on-accent` #0E0F11 / `--accent` | 8.07 | |
| `--up` #3CCB9B / `--surface` · / `--up-soft` | 8.63 · 7.51 | |
| `--down` #FF925A / `--surface` · / `--down-soft` | 8.04 · 7.40 | |
| `--new` #EE93CF / `--surface` · / `--new-soft` | 8.21 · 7.67 | |
| `--neutral` #8B8B94 / `--neutral-soft` #222327 | 4.65 | |
| `--warn` #F0C04A / `--surface` · / `--warn-soft` | 10.44 · 9.22 | |
| `--danger` #FF8078 / `--surface` · / `--danger-soft` | 7.28 · 6.80 | |
| Sources amazon / shopify / tiktok / google sur `--surface` | 8.40 / 8.47 / 8.75 / 7.11 | |

**Daltonisme.** `--up` et `--down` ont volontairement la même clarté (ratio entre eux ≈ 1.0) : ils ne se distinguent **pas** en niveaux de gris, et c'est assumé, car l'information est portée par l'icône ▲/▼ et le signe +/−. Les teintes (vert bleuté vs vermillon, dérivées d'Okabe-Ito) restent distinctes pour les deutéranopes et protanopes. Test obligatoire avant mise en ligne : Chrome DevTools > Rendering > *Emulate vision deficiencies* (Deuteranopia, Protanopia, Achromatopsia) sur la vue Classements.

### 3.4 Typographie

- **Une seule famille : Inter** (Google Fonts, variable, axes `opsz` 14–32 et `wght` 400–700). `font-optical-sizing: auto` donne automatiquement la coupe « Display » aux titres (comme Linear).
- `body { font: var(--weight-regular) var(--text-md)/var(--lh-md) var(--font-sans); -webkit-font-smoothing: antialiased; }`
- **Chiffres** : toute valeur numérique (rang, score, prix, note, avis, dates dans les tableaux, axes) porte la classe `.num` : `font-variant-numeric: tabular-nums lining-nums;` et est alignée à droite dans sa colonne. Le rang en colonne utilise `.num` + `--weight-semibold`.
- Titres : h1 `--text-2xl` (mobile) / `--text-3xl` (≥ 900 px), `--weight-bold`, `--tracking-tight` ; h2 `--text-xl` semibold `--tracking-tight` ; h3 `--text-lg` semibold. Pas de h4+.
- Libellés de colonnes : `--text-xs`, `--weight-medium`, `--text-3`, `text-transform: uppercase`, `letter-spacing: var(--tracking-caps)`.
- Titres produits : 2 lignes max (`-webkit-line-clamp: 2`), `--text-md` `--weight-medium` ; titre complet dans l'attribut `title` et dans le panneau.
- Typographie française : espace insécable (U+00A0) avant « : » et dans « n° 4 » ; espace fine insécable (U+202F) avant « ; ! ? » et à l'intérieur des guillemets « ». Les nombres passent par `Intl.NumberFormat('fr-FR')` (séparateur de milliers = U+202F).

---

## 4. Grille et mise en page

- Mobile-first. Points de rupture (`min-width`) : **600 px** (tablette), **900 px** (desktop compact), **1200 px** (desktop large).
- Conteneur : `max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter);` Gouttière 16 / 24 / 32 px.
- Grille de page ≥ 900 px : 12 colonnes, `gap: var(--space-7)`. Accueil ≥ 1200 px : contenu principal 8 colonnes + colonne latérale 4 colonnes.
- **Aucun défilement horizontal**, à aucune largeur ≥ 320 px. `html, body { overflow-x: clip; }` en filet de sécurité, mais chaque composant doit tenir sans lui (tester à 320 px).
- En-tête collant (`--header-h`), puis barre de filtres collante sous l'en-tête dans Classements. Mobile : barre d'onglets fixe en bas (`--tabbar-h` + `env(safe-area-inset-bottom)`), et `padding-bottom` équivalent sur `<main>`.
- Écart vertical : 32 px entre modules, 48 px entre sections de page.

---

## 5. Architecture de l'information

### 5.1 Vues

| Vue | Route (hash, compatible GitHub Pages) | Question à laquelle elle répond | Données |
|---|---|---|---|
| **Aujourd'hui** | `#/` | « Qu'est-ce qui bouge ce matin ? » | `latest.json`, `meta.json` |
| **Classements** | `#/classements?m=FR&p=jour&c=toutes` | « Qu'est-ce qui se vend le plus, sur quelle durée, dans quelle catégorie ? » | `latest.json` (p=jour), `rankings.json` (autres) |
| **Fiche produit** (panneau) | `#/produit/FR/high-tech/B0XXXXXXX` | « Ce produit est-il un feu de paille ou un pilier ? » | `history/FR-high-tech.json`, `latest.json`, `rankings.json` |
| **Boutiques** | `#/boutiques?m=US&vue=boutique` ou `&vue=cumul&p=7j` | « Que vendent le mieux les marques DTC qui marchent ? » | `latest.json` (shopify), `rankings.json` (shopify) |
| **TikTok** | `#/tiktok?m=FR` | « Quels produits sont poussés en pub en ce moment ? » | `latest.json` (tiktok) |
| **Buzz** | `#/buzz` | « De quoi parle-t-on aujourd'hui ? » (secondaire) | `latest.json` (gtrends) |
| **Méthode** | `#/methode` (ancres `#/methode/score`, etc.) | « D'où viennent ces chiffres et que valent-ils ? » | `meta.json` |

Valeurs de paramètres :
- `m` : `FR` | `US`. Défaut : dernier choix (`localStorage['releve.market']`), sinon `FR`.
- `p` : `jour` | `7j` | `30j` | `AAAA-MM` (mois) | `AAAA` (année). Les mois et années proposés sont exactement les clés présentes dans `rankings.json`.
- `c` : `toutes` | clé de catégorie de `meta.categories` (`high-tech`, `cuisine-maison`…).
- `f` (période Jour uniquement, optionnel) : `nouveaux` | `hausses` : filtre client utilisé par les liens « Tout voir » de l'accueil ; affiché comme une puce retirable « Nouveaux uniquement ✕ » au-dessus de la liste.
- Panneau produit : la route du panneau se superpose à la vue d'origine (l'app mémorise la dernière route de vue). En accès direct, la vue de fond est `#/classements?m=<marché>&p=jour&c=<catégorie>`. Fermer le panneau = `history.back()` si on vient de l'app, sinon remplacement par la route de fond.
- Le panneau n'existe **que pour Amazon** (seule source avec historique quotidien). Les lignes Shopify et TikTok renvoient vers la page source (lien externe).

### 5.2 Navigation

- **Desktop (≥ 900 px)** : en-tête unique : logotype à gauche ; onglets « Aujourd'hui · Classements · Boutiques · TikTok · Buzz · Méthode » ; à droite le sélecteur de marché global `FR | US` puis le bouton de thème (cycle Auto → Clair → Sombre, libellé accessible « Thème : automatique »).
- **Tablette (600–899 px)** : même en-tête, onglets en texte `--text-sm` ; si l'espace manque, « Méthode » passe en icône ⓘ avec libellé visible au focus.
- **Mobile (< 600 px)** : en-tête = logotype + sélecteur `FR | US` + lien « Méthode ». Barre d'onglets en bas, 5 entrées icône + libellé 12 px : Aujourd'hui, Classements, Boutiques, TikTok, Buzz. Le bouton de thème est dans le pied de page.
- Onglet actif : `aria-current="page"`, texte `--text`, soulignement 2 px `--accent` (desktop) / icône et libellé `--accent` (mobile). Inactif : `--text-2`.
- Le marché est global : changer `FR | US` met à jour `m` dans la route courante.
- Le Buzz Google est volontairement en dernier : section secondaire, hors produits.

---

## 6. Wireframes

Conventions : `▣` logotype, `[img]` vignette produit, `▲3` / `▼2` badges, `✚ Nouveau` badge nouveau, `╱╱` hachures, `·` séparateur, `↗` lien externe.

### 6.1 Chrome commun

Desktop
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▣ Relevé    Aujourd'hui   Classements   Boutiques   TikTok   Buzz   Méthode      [FR|US]  ◐  │ 56px collant
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Sources du 3 oct.  ✓ Amazon 06:12 · ✓ Shopify 06:14 · ! TikTok indisponible · ✓ Google 06:15  ⓘ│ 36px
└────────────────────────────────────────────────────────────────────────────────────────────────┘
  ... contenu ...
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Relevé : projet personnel, sans lien avec Amazon, Shopify, TikTok ou Google.                   │
│ Un classement n'est pas un volume de ventes.  Méthode · Code source ↗ · Thème : Auto ▾         │
│ Données générées le 3 oct. 2026 à 06:20 (heure de Paris).                                      │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Mobile 360 px
```
┌────────────────────────────────────┐
│ ▣ Relevé          [FR|US]  Méthode │ 56px collant
├────────────────────────────────────┤
│ ● 3 sources sur 4 à jour        ›  │ 40px, ouvre la feuille « Sources »
└────────────────────────────────────┘
          ... contenu ...
┌────────────────────────────────────┐
│  ⌂       ≡        ▦      ▶     ✦   │ 56px fixe
│Aujourd. Classem. Boutiq. TikTok Buzz│
└────────────────────────────────────┘
```

### 6.2 Aujourd'hui

Desktop ≥ 1200 px (8 + 4 colonnes)
```
┌─ main (8 col) ──────────────────────────────────────────────┐ ┌─ aside (4 col) ──────────────────┐
│ Relevé du samedi 3 octobre                         (h1)      │ │ Pubs TikTok · 7 jours      Voir ›│
│ 1 020 produits · 17 catégories · France · comparé au 2 oct.  │ │ 1 [img] Mini-ventilateur  ▲ 24 % │
│ ⓘ Un classement n'est pas un volume de ventes. En savoir +   │ │ 2 [img] Brosse lissante   ▲ 8 %  │
│                                                              │ │ 3 [img] Gourde isotherme  ✚      │
│ Entrées du jour (h2)                         Tout voir (38) ›│ │ … 5 lignes                        │
│ ┌──────────┐┌──────────┐┌──────────┐┌──────────┐            │ │ TikTok Creative Center · 06:13   │
│ │  [img]   ││  [img]   ││  [img]   ││  [img]   │  4 cartes   │ ├──────────────────────────────────┤
│ │✚ Nouveau ││✚ Nouveau ││✚ Nouveau ││✚ Nouveau │  (2 rangs)  │ │ Buzz Google · France      Voir ›│
│ │n° 3 Beauté│ n° 7 Jouets ...                                │ │ 1 « match psg »  200 000+ rech.  │
│ │Titre sur  ││          ││          ││          │            │ │ 2 « soldes »      50 000+ rech.  │
│ │2 lignes   ││          ││          ││          │            │ │ … 5 lignes                        │
│ │24,99 € ★4,5│ ...                                           │ │ Google Trends · 06:15            │
│ └──────────┘└──────────┘└──────────┘└──────────┘            │ └──────────────────────────────────┘
│ Amazon.fr Meilleures ventes · relevé le 3 oct. à 06:12       │
│                                                              │
│ Plus fortes hausses depuis hier (h2)                Tout voir›│
│ RANG  VAR.   PRODUIT                         CATÉG.   PRIX  14 J│
│  4    ▲ 18   [img] Titre produit…            Cuisine 19,99 € ╱╲_│
│ 11    ▲ 15   [img] Titre produit…            Sport   34,90 € __╱│
│ … 10 lignes                                                  │
│ Amazon.fr · relevé le 3 oct. à 06:12 · comparé au 2 oct.     │
│                                                              │
│ Montées sur 7 jours (h2)          (même liste, colonne 7 J)  │
│ Toujours en tête (h2)   n° 1 à 3 depuis ≥ 7 jours d'affilée  │
│                                                              │
│ N° 1 par catégorie (h2)                                      │
│ ┌────────────┐┌────────────┐┌────────────┐┌────────────┐     │
│ │High-Tech   ││Cuisine     ││Beauté      ││Mode        │ ... │ 17 tuiles, 4 par rangée
│ │[img] Titre ││[img] Titre ││[img] Titre ││[img] Titre │     │
│ │12 j en tête││✚ Nouveau   ││▲ 2         ││3 j en tête │     │
│ └────────────┘└────────────┘└────────────┘└────────────┘     │
└──────────────────────────────────────────────────────────────┘
```
Entre 900 et 1199 px : la colonne latérale passe sous « N° 1 par catégorie » en 2 colonnes (TikTok | Buzz).

Mobile 360 px
```
┌────────────────────────────────────┐
│ Relevé du samedi 3 octobre    (h1) │
│ 1 020 produits · 17 catégories     │
│ France · comparé au 2 oct.         │
│ ┌────────────────────────────────┐ │
│ │ⓘ Un classement n'est pas un    │ │
│ │volume de ventes.  En savoir +  │ │
│ └────────────────────────────────┘ │
│ Entrées du jour            38 ›    │
│ ┌────────────────────────────────┐ │
│ │ 3 [img]  Titre produit sur     │ │ 72px
│ │          2 lignes max…         │ │
│ │  ✚ Nouveau · Beauté · 24,99 €  │ │
│ ├────────────────────────────────┤ │
│ │ 7 [img]  …                     │ │ 5 lignes
│ └────────────────────────────────┘ │
│ Amazon.fr · relevé 3 oct. 06:12    │
│                                    │
│ Plus fortes hausses        Tout ›  │
│ │ 4 [img] Titre…           ▲ 18 │  │
│ │         Cuisine · 19,99 €     │  │
│ … 5 lignes                         │
│ Montées sur 7 jours · 5 lignes     │
│ Toujours en tête · 5 lignes        │
│ N° 1 par catégorie                 │
│ ┌───────────────┐┌───────────────┐ │ 2 tuiles par rangée
│ │High-Tech      ││Cuisine        │ │
│ │[img]          ││[img]          │ │
│ │Titre 2 lignes ││Titre 2 lignes │ │
│ └───────────────┘└───────────────┘ │
│ Pubs TikTok · 3 lignes      Voir › │
│ Buzz Google · 3 lignes      Voir › │
└────────────────────────────────────┘
```

### 6.3 Classements

Desktop, période « 7 j », toutes catégories
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Classements (h1)                                                                               │
│ Les produits les plus présents en tête des Meilleures ventes Amazon.                           │
├─ barre de filtres (collante sous l'en-tête) ───────────────────────────────────────────────────┤
│ Période [ Jour | 7 j | 30 j | Mois ▾ | Année ▾ ]   Catégorie [ Toutes les catégories     ▾ ]  │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 7 derniers jours · 27 sept. → 3 oct.   ■■■□□□□  3 jours relevés sur 7                          │
│ ⚠ Période incomplète : ce classement ne repose que sur 3 jours.                                 │
│ Score = somme des points du jour (31 − rang) sur la période. Comment ça marche ?               │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ RANG  PRODUIT                                  CATÉGORIE   SCORE              PRÉSENCE  MEILLEUR  MOYEN    PRIX    NOTE  │
│   1   [img] Titre produit sur deux lignes…     High-Tech   90 ██████████ /90   3/3 j     n° 1      1,0   29,99 €  4,6 ↗│
│   2   [img] Titre…                             Beauté      87 █████████▋       3/3 j     n° 1      2,0   12,49 €  4,4 ↗│
│   3   [img] Titre…                             Jouets      58 ██████▍          2/3 j     n° 1      2,0   …           │
│  …                                                                                             │
│  50                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Amazon.fr Meilleures ventes, top 30 × 17 catégories · relevés du 1er au 3 oct. · Prochain relevé : demain matin │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Colonnes affichées en ≥ 1200 px : toutes. 900–1199 px : on masque MOYEN et NOTE. 600–899 px : RANG, PRODUIT (catégorie passe sous le titre), SCORE, PRÉSENCE, PRIX.

Desktop, période « Jour », catégorie « Cuisine et Maison »
```
│ Jour · 3 oct. · comparé au 2 oct.                                                              │
│ RANG  VAR. 24 H  PRODUIT                              7 J     SÉRIE     PRIX     NOTE (AVIS)       14 JOURS │
│   1   =          [img] Titre…                         ▲ 2     12 j      19,99 €  4,7 (54 210)      ‾‾‾‾‾‾‾● │
│   2   ▲ 3        [img] Titre…                         —       2 j       …                          __╱‾‾●   │
│   3   ✚ Nouveau  [img] Titre…                         —       1 j                                  ●        │
│  …30                                                                                           │
```
Période « Jour » + « Toutes les catégories » : 17 blocs empilés, un par catégorie (ordre de `meta.categories`), chacun = titre h3 + 5 premières lignes + bouton « Voir les 30 › » qui fixe `c=<catégorie>`.

Mobile 360 px
```
┌────────────────────────────────────┐
│ Classements                   (h1) │
├─ filtres (collants) ───────────────┤
│ [Jour|7 j|30 j|Mois▾|Année▾]       │ contrôle segmenté pleine largeur
│ [ Toutes les catégories        ▾ ] │
├────────────────────────────────────┤
│ 7 derniers jours                   │
│ ■■■□□□□ 3 jours relevés sur 7      │
│ ⚠ Période incomplète.  Pourquoi ?  │
├────────────────────────────────────┤
│  1 [img] Titre produit sur deux    │ 72px
│          lignes maximum…           │
│          High-Tech · 29,99 €       │
│          ██████████ 90 · 3/3 j     │
├────────────────────────────────────┤
│  2 [img] …                         │
│ … 50 lignes (par paquets de 25)    │
│ [ Afficher 25 de plus ]            │
│ Amazon.fr · relevés 1er→3 oct.     │
└────────────────────────────────────┘
```
Mobile, période Jour : ligne = `rang · [img] · titre (2 l.) / badge var. 24 h · catégorie · prix`. Pas de sparkline en mobile (elle est dans le panneau).

### 6.4 Fiche produit (panneau)

Desktop : `<dialog>` collé à droite, 480 px, pleine hauteur, voile `--overlay` sur la liste.
```
                                        ┌──────────────────────────────────────────────┐
                                        │ Amazon.fr · Cuisine et Maison           ✕   │
                                        │ ┌────────┐                                   │
                                        │ │ [img]  │ Titre complet du produit sur      │
                                        │ │120×120 │ autant de lignes que nécessaire   │
                                        │ └────────┘ [ Voir sur Amazon.fr ↗ ]          │
                                        │                                              │
                                        │ RANG AUJ.   MEILLEUR    DANS LE TOP 30       │
                                        │ n° 4 ▲ 2    n° 1        12 j d'affilée       │ KPI 28px
                                        │             le 28 sept.                      │
                                        │ PRIX 24,99 €   NOTE 4,6 ★  (12 345 avis)     │
                                        │                                              │
                                        │ Rang jour par jour       [7 j|30 j|Tout]     │
                                        │ n° 1 ┤░░░░░░░░░░░░░░░░░░░░░░░░░░░░ top 10    │
                                        │      ┤░░░╲●─●╲░░░░░░░░░░░░░░░░░░░           │
                                        │ n° 10┤─────────────●───●──╲────── ●  n° 4    │
                                        │ n° 20┤                   ╱╱                  │
                                        │ n° 30┤                   ╱╱                  │
                                        │ hors ┤ ○                 ╱╱                  │
                                        │       5 sept.          20 sept.     3 oct.   │
                                        │ ╱╱ jour non relevé   ○ absent du top 30      │
                                        │ ▸ Voir les données (tableau)                 │
                                        │                                              │
                                        │ Dans les classements de période              │
                                        │ 7 derniers jours  n° 3 · 3/3 j               │
                                        │ 30 derniers jours n° 8 · 12/14 j             │
                                        │ Octobre 2026      n° 2 · 3/3 j               │
                                        │                                              │
                                        │ Amazon.fr Meilleures ventes, Cuisine et      │
                                        │ Maison · relevé le 3 oct. à 06:12            │
                                        │ ⓘ Le rang indique une position, pas un       │
                                        │ nombre de ventes.                            │
                                        └──────────────────────────────────────────────┘
```

Mobile 360 px : feuille plein écran (`<dialog>` 100 dvh), entrée par le bas.
```
┌────────────────────────────────────┐
│ ‹ Retour        Amazon.fr      ✕   │ 56px collant
├────────────────────────────────────┤
│ ┌──────┐ Titre complet du produit  │
│ │[img] │ sur plusieurs lignes      │
│ │ 96px │ Cuisine et Maison · FR    │
│ └──────┘                           │
│ [   Voir sur Amazon.fr ↗        ]  │ pleine largeur, 44px
│ ┌───────────┬───────────┐          │
│ │RANG AUJ.  │MEILLEUR   │          │ grille 2×2
│ │n° 4 ▲ 2   │n° 1       │          │
│ ├───────────┼───────────┤          │
│ │TOP 30     │PRIX       │          │
│ │12 j       │24,99 €    │          │
│ └───────────┴───────────┘          │
│ ★ 4,6 · 12 345 avis                │
│ Rang jour par jour [7 j|30 j|Tout] │
│ ┌────────────────────────────────┐ │
│ │ courbe 328×160                 │ │
│ └────────────────────────────────┘ │
│ ▸ Voir les données                 │
│ Dans les classements de période    │
│ Ligne de source + avertissement    │
└────────────────────────────────────┘
```

### 6.5 Boutiques (Shopify)

Desktop, vue « Par boutique »
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Boutiques (h1)                                                                                 │
│ Les meilleures ventes « depuis toujours » de 13 marques Shopify (États-Unis).                  │
│ ⓘ Shopify trie sur l'historique complet des ventes : ce sont des produits phares, pas des      │
│   nouveautés.                                                                                  │
│ [ Par boutique | Toutes boutiques ]          Univers [ Tous ▾ ]                                │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ ColourPop · Beauté ───────────┐ ┌─ Stanley · Cuisine ────────────┐ ┌─ Kith · Mode ─────────┐│
│ │ 1 [img] Titre…        12,00 $US│ │ 1 [img] Quencher H2.0  45,00 $US│ │ 1 [img] …             ││
│ │ 2 [img] Titre…         8,00 $US│ │ 2 …                            │ │ …                     ││
│ │ … 12 lignes (6 + « 6 de plus »)│ │                                │ │                       ││
│ │ colourpop.com ↗ · 06:14        │ │ stanley1913.com ↗ · 06:14      │ │                       ││
│ └────────────────────────────────┘ └────────────────────────────────┘ └───────────────────────┘│
│ (3 colonnes ≥ 1200, 2 colonnes 900–1199)                                                       │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Vue « Toutes boutiques » : contrôle Période `[7 j | 30 j | Mois ▾ | Année ▾]` + indicateur de couverture + liste identique à Classements (colonnes RANG, PRODUIT, BOUTIQUE, SCORE, PRÉSENCE, MEILLEUR, PRIX). Score Shopify = somme de (13 − rang) (liste de 12) : le libellé de méthode l'indique.

Mobile 360 px
```
┌────────────────────────────────────┐
│ Boutiques                     (h1) │
│ ⓘ Classement depuis toujours.  +   │
│ [Par boutique|Toutes boutiques]    │
│ [ Univers : Tous              ▾ ]  │
│ ┌────────────────────────────────┐ │
│ │ ColourPop · Beauté          ▾  │ │ en-tête de boutique repliable
│ │ 1 [img] Titre…       12,00 $US │ │ 3 premiers visibles
│ │ 2 [img] Titre…        8,00 $US │ │
│ │ 3 [img] …                      │ │
│ │ Voir les 12 ›   colourpop.com ↗│ │
│ └────────────────────────────────┘ │
│ … une carte par boutique           │
└────────────────────────────────────┘
```

### 6.6 TikTok

Desktop (source disponible)
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Pubs TikTok (h1)                                                                               │
│ Les produits les plus présents dans les publicités TikTok sur 7 jours, France.                 │
│ ⓘ Popularité publicitaire, pas des ventes TikTok Shop. CTR et CVR sont des moyennes TikTok.    │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ RANG  PRODUIT                              CATÉGORIE         POPULARITÉ           ÉVOL.    CTR     CVR  │
│   1   [img] Mini-ventilateur portable      Électroménager    12 400 ██████████   ▲ 24 %   1,8 %   6,2 %│
│   2   [img] …                              Beauté             9 800 ███████▉     ▼ 3 %    …           │
│  …                                                                                             │
│ TikTok Creative Center, Top Products · 7 derniers jours · relevé le 3 oct. à 06:13          ↗  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Desktop et mobile (source indisponible) : la vue garde son titre et son explication, la liste est remplacée par l'état « Source indisponible » (§7.9).
```
┌────────────────────────────────────┐
│ Pubs TikTok                   (h1) │
│ ┌────────────────────────────────┐ │
│ │ ⊘  TikTok n'a pas pu être      │ │
│ │    relevé ce matin.            │ │
│ │ Le Creative Center a refusé    │ │
│ │ la connexion. Nouvel essai     │ │
│ │ demain matin.                  │ │
│ │ Dernier relevé réussi : 1 oct. │ │
│ │ [ Ouvrir le Creative Center ↗ ]│ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```
Mobile (disponible) : ligne = `rang · [img] · titre (2 l.)` / `Popularité 12 400 · ▲ 24 %` / `CTR 1,8 % · CVR 6,2 %` en `--text-sm --text-2`.

### 6.7 Buzz

Desktop : deux colonnes côte à côte, France | États-Unis (le marché global ne filtre pas cette page, il ordonne seulement la colonne de gauche).
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Buzz (h1)                                                                                      │
│ Les recherches Google qui s'envolent aujourd'hui, tous sujets confondus (pas seulement des     │
│ produits). Volume approximatif fourni par Google.                                              │
├───────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ France                                        │ États-Unis                                     │
│ 1  « match psg »            200 000+ rech.    │ 1  « powerball »             1 000 000+ rech.  │
│    il y a 5 h · Le Parisien : Titre article ↗ │    il y a 3 h · CNN : Titre article ↗          │
│ 2  …                                          │ …                                              │
│ … 10                                          │ … 10                                           │
│ Google Trends, Tendances du moment · 06:15    │ Google Trends · 06:15                          │
└───────────────────────────────────────────────┴────────────────────────────────────────────────┘
```
Mobile : les deux listes empilées, sélecteur `[France | États-Unis]` en tête (initialisé sur le marché global). Pas d'image (le Buzz est secondaire, on économise la bande passante).

### 6.8 Méthode

Desktop : colonne de lecture 680 px, sommaire collant à gauche (≥ 1200 px).
```
┌──────────────┐ ┌──────────────────────────────────────────────┐
│ Sur cette    │ │ Méthode et sources (h1)                      │
│ page         │ │ Ce que mesure Relevé, et ce qu'il ne mesure  │
│ · L'essentiel│ │ pas.                                         │
│ · Amazon     │ │ ┌──────────────────────────────────────────┐ │
│ · Shopify    │ │ │ L'essentiel (3 puces)                    │ │ encadré --surface
│ · TikTok     │ │ └──────────────────────────────────────────┘ │
│ · Google     │ │ Amazon (h2) ● ✓ OK · relevé 3 oct. 06:12     │
│ · Le score   │ │ Ce que c'est / Ce que ce n'est pas / Limites │
│ · Données    │ │ Shopify (h2) …  TikTok (h2) …  Google (h2) … │
│   incomplètes│ │ Le score (h2)                                │
│ · Glossaire  │ │   score = Σ (31 − rang)   (bloc mono)        │
└──────────────┘ │   Exemple chiffré + mini-tableau             │
                 │ Données incomplètes (h2) · Glossaire (h2)    │
                 │ Historique : 1er relevé le 1er oct. 2026,    │
                 │ 3 jours collectés.                           │
                 └──────────────────────────────────────────────┘
```
Mobile : même contenu en une colonne, sommaire en `<details>` « Sur cette page » en tête.

---

## 7. Composants

Chaque composant est une fonction JS pure `render<Nom>(data) → string` (HTML échappé) dans `assets/js/components/`, stylée par une classe racine `.c-<nom>`.

### 7.1 Ligne de classement (`.c-row`)

- Élément : `<li>` dans un `<ol class="c-rank-list">` (le classement est une liste ordonnée ; l'attribut `value` porte le rang réel).
- Grille CSS desktop : `grid-template-columns: 3rem 5.5rem minmax(0,1fr) …` ; colonnes numériques alignées à droite ; hauteur `--row-h` (64 px) ; séparateur `border-bottom: 1px solid var(--border)` ; pas de bordure verticale ; pas de zébrage.
- Contenu : rang (`.num`, semibold, `--text-md`, rang 1–3 identique aux autres : pas de médailles) · badge(s) · vignette 48×48 (`--radius-sm`, fond `--image-tile`, `object-fit: contain`, padding 4 px) · titre (2 lignes) + catégorie en `--text-sm --text-2` · colonnes de données · lien externe ↗.
- Interaction : le **titre** est un `<a href="#/produit/...">` ; un pseudo-élément `::after` étend sa zone cliquable à toute la ligne. Le lien externe ↗ est un second `<a>` placé au-dessus (`position: relative; z-index: 1`), 44×44 de zone tactile, `aria-label="Voir sur Amazon.fr (nouvel onglet)"`.
- États : survol → fond `--surface-2` (`--dur-instant`) ; focus clavier sur le titre → anneau sur toute la ligne via `:has(a:focus-visible)` ; ligne ouverte dans le panneau → fond `--accent-soft` + barre gauche 2 px `--accent`.
- Mobile (< 600 px) : grille `2rem 2.75rem 1fr`, hauteur min `--row-h-mobile`, vignette 44×44, deuxième ligne de méta (`badge · catégorie · prix`), troisième ligne optionnelle (barre de score + présence) selon la période.

### 7.2 Carte produit (`.c-card`)

Usage : « Entrées du jour » et « N° 1 par catégorie ».
- `<article>` fond `--surface`, bordure 1 px `--border`, `--radius-md`, padding `--space-4`, `--shadow-1`. Pas d'ombre au repos en sombre (bordure seule, déjà dans le token).
- Ordre : surtitre (catégorie, `--text-xs` caps `--text-3`) · image carrée 1:1 sur `--image-tile` (`aspect-ratio: 1`, `object-fit: contain`, padding 12 px) · badge · titre 2 lignes · ligne `n° 3 · 24,99 € · ★ 4,5` en `.num --text-sm --text-2`.
- Toute la carte est cliquable via le lien du titre (même technique que la ligne) ; survol → `--shadow-2` et bordure `--border-strong` ; jamais d'agrandissement (`transform: scale`) de la carte.
- Largeur : grille `repeat(auto-fill, minmax(10.5rem, 1fr))`.

### 7.3 Badge de variation (`.c-delta`)

| Cas (champs de `latest.json`) | Rendu | Couleurs | Libellé accessible / infobulle |
|---|---|---|---|
| `new === true` | `✚ Nouveau` | `--new` sur `--new-soft` | « Nouveau dans le top 30 aujourd'hui » |
| `change > 0` | `▲ 3` | `--up` sur `--up-soft` | « Gagne 3 places depuis hier (n° 7 → n° 4) » |
| `change < 0` | `▼ 2` | `--down` sur `--down-soft` | « Perd 2 places depuis hier (n° 2 → n° 4) » |
| `change === 0` | `=` | `--neutral` sur `--neutral-soft` | « Même rang qu'hier » |
| `change === null && !new` | `—` | `--text-3`, sans fond | « Pas de comparaison possible (premier relevé) » |

- Forme : `inline-flex`, hauteur 20 px, padding `0 6px`, `--radius-xs`, `--text-sm`, `--weight-semibold`, `.num`. Icônes = SVG 8×8 du sprite (`#i-up`, `#i-down`, `#i-new`), `aria-hidden="true"` ; le texte accessible est dans un `<span class="sr-only">`.
- Variante 7 jours (`change_7d`) : même rendu, préfixé « 7 j » en `--text-3` dans la colonne 7 J. `null` → `—`.
- Série (`streak`) : texte simple `12 j` (`.num --text-2`), sans couleur ; infobulle « Dans le top 30 depuis 12 jours d'affilée ». Accueil, carte « Toujours en tête » : `12 j en tête`.
- Interdit : pourcentage de variation de rang, flèches colorées sans nombre.

### 7.4 Contrôle segmenté (`.c-segmented`)

Usage : marché `FR | US`, période, vue Boutiques, plage de la courbe.
- Implémentation : `<fieldset>` + `<legend class="sr-only">` + `<input type="radio">` natifs visuellement masqués + `<label>` stylés (navigation flèches native, aucune ARIA à recoder).
- Conteneur : fond `--surface-2`, `--radius-sm`, padding 2 px, bordure 1 px `--border`. Segment : hauteur 32 px (40 px en mobile), padding `0 12px`, `--text-md --weight-medium --text-2`. Segment coché : fond `--surface`, texte `--text`, `--shadow-1` ; en sombre fond `--surface-3`.
- Focus : `input:focus-visible + label` → anneau (§9.3).
- Changement → mise à jour de l'URL (`history.replaceState` pour la plage de la courbe, `pushState` pour marché et période) puis rendu.
- Mobile : pleine largeur, segments `flex: 1`.

### 7.5 Sélecteur de période (`.c-period`)

- Un contrôle segmenté `Jour | 7 j | 30 j | Mois ▾ | Année ▾`.
- « Mois » et « Année » sont des segments-boutons qui ouvrent un menu (`popover` HTML natif + `<button popovertarget>`), listant les clés disponibles de `rankings.json`, le plus récent en premier : « Octobre 2026 (en cours) », « Septembre 2026 ». Une fois choisi, le segment affiche la valeur (« Oct. 2026 ▾ ») et devient coché.
- Le menu : `--surface`, `--shadow-2`, `--radius-md`, items 40 px, item courant coché ✓. Fermeture : Échap, clic extérieur (natif `popover`).
- Si une seule valeur existe (ex. un seul mois), le segment sélectionne directement sans menu.
- Une période sans donnée n'est pas proposée (on ne montre pas de mois vides).

### 7.6 Sélecteur de catégorie (`.c-select`)

- `<select>` natif stylé (`appearance: none`, chevron SVG en `background-image`), hauteur 36 px (44 px mobile), bordure 1 px `--border-strong`, `--radius-sm`, fond `--surface`.
- Options : « Toutes les catégories » puis les 17 libellés de `meta.categories` dans l'ordre du fichier.
- Libellé visible « Catégorie » à gauche (desktop) ; `aria-label` en mobile.

### 7.7 Indicateur de couverture (`.c-coverage`)

Affiché sous la barre de filtres pour toute période ≠ Jour, et en tête de la vue Boutiques « Toutes boutiques ».
- Texte : `<libellé période> · <du> → <au>` puis `<days_covered> jour(s) relevé(s) sur <days_expected>`.
- Jauge : si `days_expected ≤ 31` → `days_expected` segments (8×8 px, écart 3 px jusqu'à 14 segments ; 6×8 px, écart 2 px de 15 à 31), remplis `--text-2` pour les jours couverts (alignés à droite, du plus ancien au plus récent), vides = contour 1 px `--border-strong`. Si `> 31` (année) → barre continue 120×6 px, remplissage proportionnel `--text-2`, et pourcentage en texte.
- Ton :
  - `covered / expected ≥ 0.8` → neutre, rien de plus.
  - `0.5 ≤ ratio < 0.8` → note `--text-2` : « Période partiellement couverte. »
  - `ratio < 0.5` → bandeau `--warn-soft` / `--warn` avec icône ⚠ : « Période incomplète : ce classement ne repose que sur 3 jours. » + lien « Pourquoi ? » vers `#/methode/donnees-incompletes`.
  - Pour un mois ou une année **en cours**, le dénominateur reste celui de la période complète, et on ajoute « (en cours) » après le libellé.
- Jamais de couleur de jauge sémantique : la jauge est grise, seul le message prend la teinte d'avertissement.

### 7.8 Barre de score (`.c-score`)

- Nombre `.num` (largeur fixe 3ch, aligné à droite) suivi d'une barre horizontale 96×6 px (64 px mobile), `--radius-full`, piste `--surface-3`, remplissage `--text-2` (pas d'accent : ce n'est pas un état interactif).
- Échelle **absolue** : 100 % = score maximal possible = `30 × days_covered` (Amazon) ou `12 × days_covered` (Shopify), c.-à-d. « n° 1 chaque jour relevé ». Ainsi une barre pleine a un sens, indépendamment de la liste.
- Infobulle / `aria-label` : « 87 points sur 90 possibles (n° 1 chaque jour relevé = 90) ».

### 7.9 États vide, chargement, erreur

**Chargement (skeleton)**
- Apparition différée de 150 ms (évite le flash si le JSON est en cache).
- Reproduit **exactement** la géométrie finale (même nombre de lignes : 10 pour un module, 25 pour une liste ; mêmes hauteurs) → zéro décalage de mise en page.
- Blocs `--skeleton`, `--radius-xs` ; vignette = carré, titre = 2 barres (100 % et 60 %), chiffres = barres de 3ch.
- Animation : balayage de clarté (`background-position`) sur `--skeleton-cycle` ; désactivée en mouvement réduit (bloc statique).
- `aria-busy="true"` sur le conteneur + texte `sr-only` « Chargement des classements… ».

**Vide (filtre sans résultat, ou donnée pas encore disponible)**
- Bloc centré dans la zone de liste, padding 48 px, icône 24 px `--text-3`, titre `--text-lg`, phrase `--text-2`, action éventuelle en bouton secondaire.
- Cas et textes : voir §11.

**Erreur de chargement (fichier JSON inaccessible)**
- Même gabarit que le vide, icône ⚠ `--danger`, bouton « Réessayer » qui relance le `fetch`.
- Le reste de la page (autres modules) reste fonctionnel : une erreur est locale au module.

**Source indisponible (`status: "error"` ou liste vide)**
- Carte `--surface`, bordure 1 px `--border`, barre gauche 3 px `--danger`, icône ⊘, titre « <Source> n'a pas pu être relevé ce matin. », message d'erreur humanisé (pas de trace technique ; le texte brut de `errors[]` est disponible dans un `<details>` « Détail technique »), « Nouvel essai demain matin. », lien externe vers la source.
- **Source partielle (`status: "partial"`)** : la liste s'affiche normalement, précédée d'une note `--warn-soft` : « Relevé partiel : 15 catégories sur 17. Manquent : Jardin, Auto et Moto. »

### 7.10 Ligne de source (`.c-source`)

- Toujours en bas d'un module, `--text-xs`, `--text-3`, séparée du contenu par 12 px.
- Format : `● <Source> <nom de liste> · relevé le <j mois> à <hh:mm> [· comparé au <j mois>] [· Prochain relevé : demain matin]` + `↗` vers `source_url` quand il existe.
- Le `●` est la pastille 8 px de la couleur de source.

### 7.11 Bandeau des sources (`.c-status`)

- Desktop : bande de 36 px sous l'en-tête (non collante), fond `--bg`, bordure basse `--border`, `--text-sm`. Pour chaque source : icône d'état + nom + heure de collecte (`collected_at` en heure de Paris), séparées par `·`. Bouton ⓘ à droite → `#/methode`.
- Icônes d'état (forme + couleur + mot, jamais la couleur seule) : `✓` `--ok` « OK » (le mot est `sr-only` quand l'heure suffit) ; `◐` `--warn` « Partiel » ; `!` dans un triangle `--danger` « Indisponible ».
- Mobile : une ligne-bouton de 40 px « ● 3 sources sur 4 à jour › » (pastille `--ok` si 4/4, `--warn` sinon) qui ouvre une feuille (`<dialog>` bas d'écran, `--radius-lg` en haut) listant les 4 sources avec statut, heure, nombre de listes, et lien Méthode.
- Fraîcheur globale : si `meta.last_day` est antérieur à la date du jour (heure de Paris) de plus d'un jour, bandeau `--warn-soft` pleine largeur au-dessus du contenu : « Données du 1er oct. : les relevés suivants ont échoué. » Ce bandeau ne se ferme pas.

### 7.12 Panneau produit (`.c-panel`)

- Élément `<dialog>` ouvert par `showModal()` (piège de focus et Échap natifs). `::backdrop` = `--overlay`.
- Desktop ≥ 900 px : ancré à droite, largeur `--panel-width`, hauteur 100 dvh, `--shadow-3`, `--radius-lg` à gauche seulement, entrée `translateX(24px) → 0` + opacité en `--dur-base --ease-out`. Le contenu défile à l'intérieur ; l'en-tête du panneau (source + catégorie + ✕) est collant.
- < 900 px : plein écran, entrée `translateY(16px) → 0`, en-tête avec « ‹ Retour » et ✕.
- Focus initial : le titre `<h2 tabindex="-1">`. À la fermeture : focus rendu à la ligne d'origine.
- Navigation clavier dans le panneau : `J` / `K` (et boutons « Produit précédent / suivant » en bas) parcourent la liste d'origine sans fermer le panneau.
- Contenu (ordre fixe) : en-tête · identité (image 120 px, titre complet h2, bouton principal « Voir sur Amazon.fr ↗ ») · KPI (Rang aujourd'hui + badge, Meilleur rang + date, Série, Prix, Note + avis) · courbe de rang (§8.1) · « Dans les classements de période » (pour 7 j, 30 j, mois en cours : rang dans la liste de période si présent, sinon « Hors des 50 premiers ») · ligne de source · avertissement méthodologique.
- KPI : libellé `--text-xs` caps `--text-3`, valeur `--text-2xl` `.num --weight-semibold`. Un KPI sans donnée affiche « — ».
- Bouton principal : fond `--accent`, texte `--on-accent`, hauteur 40 px (44 px mobile), `--radius-sm`. C'est le **seul** bouton plein de tout le site.

### 7.13 Boutons et liens

- Lien de texte : `--accent`, soulignement `text-underline-offset: 3px`, `text-decoration-thickness: 1px` ; survol → `--accent-hover`, épaisseur 2 px.
- Bouton secondaire : fond `--surface`, bordure 1 px `--border-strong`, texte `--text`, 36 px ; survol fond `--surface-2`.
- Bouton fantôme (« Tout voir › », « Afficher 25 de plus ») : texte `--text-2`, sans fond ; survol `--text` + fond `--surface-2`.
- Lien externe : icône ↗ 12 px après le texte, `target="_blank" rel="noopener noreferrer"`, texte `sr-only` « (nouvel onglet) ».

### 7.14 Infobulle (`.c-tip`)

- Déclenchée au survol **et** au focus (jamais au survol seul), délai 300 ms, fond `--text`, texte `--bg`, `--text-xs`, `--radius-xs`, max 240 px, `z-index: var(--z-tooltip)`.
- Le contenu de l'infobulle est toujours aussi disponible pour les lecteurs d'écran (`aria-describedby` ou texte `sr-only`).
- Sur tactile, les informations critiques ne sont jamais *uniquement* en infobulle.

---

## 8. Visualisation de données

### 8.1 Courbe de rang (panneau produit)

- SVG fait main (`assets/js/charts/rank-chart.js`), largeur = largeur du conteneur (mesurée par `ResizeObserver`, re-rendu sans animation), hauteur 200 px (≥ 600 px) / 160 px (mobile). Marges : gauche 40, droite 44 (étiquette de fin), haut 8, bas 24.
- **Axe Y inversé, domaine fixe [1, 30]** : rang 1 en haut. Jamais d'échelle automatique (sinon un produit qui oscille entre n° 1 et n° 2 semble s'effondrer). Graduations et lignes de grille à 1, 10, 20, 30, étiquetées « n° 1 », « n° 10 »… en `--text-xs --text-3`, grille 1 px `--chart-grid`.
- **Bande « top 10 »** : rectangle de 1 à 10, fond `--chart-band`, étiquette « top 10 » à droite (`--text-3`). C'est la « plage normale » de Tufte : on voit d'un coup d'œil si le produit est dans le peloton de tête.
- **Zone « hors top 30 »** : bande de 16 px sous l'axe, libellée « hors », séparée par un tiret 2-2 `--border-strong`. Un jour où le produit est **absent** du top 30 (alors que le relevé a eu lieu) = petit cercle creux 3 px `--text-3` dans cette zone.
- **Jour non relevé** (date entre `meta.first_day` et `meta.last_day` absente de l'union des dates du fichier `history/<marché>-<catégorie>.json`) = colonne hachurée pleine hauteur (`<pattern>` diagonal 45°, trait 1 px `--hatch`, pas 5 px).
- **Tracé** : `<polyline>` 2 px `--chart-line`, `stroke-linejoin: round`, segments **droits** entre jours consécutifs présents ; la ligne est **interrompue** dès qu'un jour est absent ou non relevé (jamais de pont, jamais de chute fictive vers 30). Points de 3 px de rayon quand ≤ 31 points affichés ; au-delà, pas de points sauf le dernier.
- **Dernier point** : cercle 4 px plein `--chart-line` + contour 2 px `--surface`, étiquette directe à droite « n° 4 » en `--text-sm --weight-semibold`. Le même nombre figure dans le KPI « Rang aujourd'hui ».
- **Axe X** : premier et dernier jour toujours étiquetés (« 5 sept. », « 3 oct. ») ; en 30 j, étiquette tous les lundis ; en « Tout », le 1er de chaque mois (« oct. »). Pas de ligne d'axe X : la grille suffit.
- **Plage** : `[7 j | 30 j | Tout]`, défaut 30 j (ou « Tout » si l'historique < 30 j). Si l'historique fait < 2 jours : pas de courbe, état vide « La courbe apparaîtra après deux relevés. »
- **Interaction** : survol/toucher → règle verticale 1 px `--border-strong` + infobulle « ven. 2 oct. · n° 6 » (ou « absent du top 30 », ou « pas de relevé ce jour-là »). Clavier : le `<svg>` a `tabindex="0"`, `←` `→` déplacent le curseur jour par jour, `Home`/`End` vont aux extrémités ; l'infobulle suit et une région `aria-live="polite"` annonce la valeur.
- **Accessibilité** : `role="img"` + `aria-label` résumé généré : « Rang de 30 jours : n° 4 aujourd'hui, meilleur n° 1 le 28 septembre, présent 12 jours sur 14 relevés. » Sous la courbe, `<details>` « Voir les données » contenant un `<table>` date / rang.
- Animation : à la première ouverture seulement, tracé `stroke-dashoffset` en `--dur-slow`. Aucune au changement de plage. Aucune en mouvement réduit.

### 8.2 Sparkline (listes, période Jour, ≥ 600 px)

- 72×20 px, en ligne avec le texte (colonne « 14 JOURS »), 14 derniers jours.
- Domaine Y **fixe [1, 30]**, inversé, identique pour toutes les lignes (petits multiples comparables).
- Trait 1.5 px `--text-3` ; dernier point 2.5 px `--chart-line` (le seul accent, relié au rang affiché en tête de ligne). Fond : bande top 10 en `--chart-band` (de y=1 à y=10). Absences = interruption de la ligne ; pas de hachures (trop petit).
- Moins de 2 points présents → « — » `--text-3` centré.
- `aria-hidden="true"` : l'information est redondante avec le panneau ; pas d'infobulle.
- Chargement : les fichiers `history/<marché>-<catégorie>.json` sont chargés **à la demande** quand une liste de la catégorie entre dans le viewport (`IntersectionObserver`), puis mis en cache mémoire. En liste « toutes catégories » des périodes longues, pas de sparkline (colonnes Score/Présence à la place).

### 8.3 Montrer un score

- Le **rang dans la période** est l'information principale (colonne RANG). Le score est secondaire : nombre + barre absolue (§7.8).
- Toujours accompagné de **Présence** (`days / days_covered`, ex. « 3/3 j ») et **Meilleur rang** (« n° 1 ») ; « Rang moyen » en colonne optionnelle (1 décimale, virgule).
- L'explication du score est à un clic de chaque liste de période (« Comment ça marche ? » → `#/methode/score`) et dans l'infobulle de l'en-tête de colonne SCORE.
- Popularité TikTok : même barre ordonnée, échelle **relative au n° 1 de la liste** (pas de maximum théorique connu), et le libellé de colonne le dit : « POPULARITÉ (relative au n° 1) » dans l'infobulle.

### 8.4 Ce qu'on ne fait pas

1. Pas de conversion rang → ventes estimées, chiffre d'affaires ou « demande ». Jamais.
2. Pas de pourcentage d'évolution d'un rang (n° 2 → n° 1 n'est pas « +50 % »).
3. Pas de courbe lissée (`monotone`, `cardinal`, Bézier) : elle invente des valeurs entre les relevés.
4. Pas d'échelle Y automatique sur les rangs ; pas d'axe Y non inversé.
5. Pas de remplissage par 0 ou par 30 des jours manquants ; pas d'interpolation à travers un trou.
6. Pas de camembert, donut, jauge, 3D, double axe, carte de chaleur arc-en-ciel.
7. Pas de rouge/vert seuls, pas de dégradé porteur de sens.
8. Pas de comparaison visuelle directe entre sources (un n° 1 Amazon et un n° 1 Shopify ne mesurent pas la même chose) : pas de liste mélangeant les sources.
9. Pas d'animation de données au-delà de `--dur-slow`, pas de compteur qui « défile ».
10. Pas de légende détachée quand une étiquette directe est possible.

---

## 9. Contraintes techniques pour le développement

### 9.1 Pile et structure

- HTML/CSS/JS **vanilla**, modules ES (`<script type="module">`), **aucun build, aucun `node_modules`, aucun framework**. Le dossier `site/` est servi tel quel par GitHub Pages.
- **Aucune bibliothèque JS.** Les graphiques sont en SVG écrit à la main (§8). Seule ressource externe : Google Fonts (Inter). Si la police ne charge pas, la pile système prend le relais sans casser la mise en page.
- Arborescence :
```
site/
  index.html                 shell unique : en-tête, <main id="app">, barre d'onglets, <dialog id="panel">, sprite SVG inline
  assets/
    css/
      tokens.css             §3.1 tel quel
      base.css               reset, typographie, .num, .sr-only, focus, liens
      layout.css             conteneur, grilles, en-tête, barre d'onglets
      components.css         .c-row, .c-card, .c-delta, .c-segmented, .c-period, .c-select,
                             .c-coverage, .c-score, .c-source, .c-status, .c-panel, .c-tip, états
    js/
      theme-init.js          script classique synchrone (§9.6), seul fichier non module
      main.js                démarrage, routeur hash, thème
      router.js              parse/serialize de la route et des paramètres
      data.js                fetch + cache mémoire + gestion d'erreurs par fichier
      format.js              Intl : nombres, prix, dates, heures (Europe/Paris), pluriels
      escape.js              échappement HTML et validation d'URL
      views/                 today.js, rankings.js, stores.js, tiktok.js, buzz.js, method.js
      components/            row.js, card.js, delta.js, segmented.js, period.js, coverage.js,
                             score.js, source.js, status.js, panel.js, states.js, tip.js
      charts/                rank-chart.js, sparkline.js
  data/                      généré par collector/aggregate.py (ne pas éditer)
```
- Rendu : fonctions qui retournent des chaînes HTML injectées via `innerHTML` dans le conteneur de la vue, puis délégation d'événements sur `#app`. Pas de DOM virtuel.

### 9.2 Sécurité des données externes

- **Tout** texte issu des JSON (titres, noms, articles) passe par `escapeHTML()` avant injection. Aucune exception.
- Toute URL (`url`, `image`, `source_url`, `news_url`) passe par `safeURL()` : protocole `https:` uniquement, sinon le lien n'est pas rendu.
- Images externes : `referrerpolicy="no-referrer"`.
- `<meta http-equiv="Content-Security-Policy">` : `default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'`. (`'unsafe-inline'` pour les styles seulement, afin d'autoriser les variables CSS posées en attribut `style`, ex. `style="--fill:0.97"` sur la barre de score ; les scripts restent strictement `'self'`, donc aucun `<script>` inline.)

### 9.3 Accessibilité

- Cible : WCAG 2.1 AA.
- Lien d'évitement « Aller au contenu » en premier élément focalisable.
- Repères : `<header>`, `<nav aria-label="Navigation principale">`, `<main id="app">`, `<footer>`. Un seul `<h1>` par vue ; au changement de route, le focus va sur le `<h1>` (`tabindex="-1"`) et `document.title` = « <Vue> · Relevé ».
- **Focus visible** partout : `:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; border-radius: inherit; }`. Jamais `outline: none` sans remplacement.
- Ordre de tabulation = ordre visuel. Raccourcis : `Échap` ferme panneau/menus ; `J`/`K` dans le panneau ; flèches dans les contrôles segmentés (natif) et la courbe.
- Cibles tactiles ≥ 44×44 px en < 900 px (`--tap`).
- Les états (variation, statut) ont toujours une alternative textuelle (§7.3, §7.11). Les icônes décoratives ont `aria-hidden="true"`.
- Changement de filtre : la liste est remplacée et une région `aria-live="polite"` annonce « 50 produits, 7 derniers jours, toutes catégories ».
- `lang="fr"` sur `<html>` ; titres de produits US dans un `<span lang="en">`.
- Zoom 200 % et largeur 320 px sans perte de contenu ni défilement horizontal.

### 9.4 Performance

- Volume : ~1 020 produits Amazon/jour (17 × 30 × 2), + 17 × 12 Shopify, + TikTok, + 20 Buzz. `latest.json` est le plus lourd : chargé une fois, gardé en mémoire pour toute la session.
- Chargement initial : `meta.json` + `latest.json` en parallèle (`Promise.all`) ; `rankings.json` seulement à l'entrée dans Classements (période ≠ Jour) ou Boutiques « Toutes boutiques » ; `history/*.json` seulement pour le panneau et les sparklines visibles.
- `fetch(url, { cache: 'no-cache' })` : revalidation (ETag GitHub Pages) pour obtenir les données du jour sans perdre le cache HTTP.
- Rendu par paquets : listes longues rendues par 25 lignes, bouton « Afficher 25 de plus » (pas de défilement infini : le pied de page et la ligne de source restent atteignables). Vue Jour « Toutes les catégories » : 17 × 5 lignes au premier rendu.
- Images : `loading="lazy" decoding="async"`, `width`/`height` explicites (48, 44, 120, ou carte 1:1), `fetchpriority="high"` uniquement pour les 4 premières cartes de l'accueil. En cas d'erreur (`onerror` délégué), remplacer par une tuile `--surface-2` avec l'initiale de la catégorie.
- CSS : `content-visibility: auto; contain-intrinsic-size: auto 64px;` sur `.c-row` des listes > 25 lignes.
- Budgets : JS total < 60 Ko non minifié ; CSS < 40 Ko ; LCP < 2,5 s en 4G simulée ; CLS < 0,05 (skeletons à géométrie exacte).

### 9.5 Formats (module `format.js`)

- Nombres : `Intl.NumberFormat('fr-FR')` → `12 345`. Décimales de note : 1 (« 4,6 »). Rang moyen : 1 décimale.
- Prix : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' | 'USD' })` → `24,99 €` / `24,99 $US`. Prix `null` → « — ».
- Dates : fuseau `Europe/Paris`. Courte : « 3 oct. » ; longue : « samedi 3 octobre » ; avec année si ≠ année courante. Heure : « 06:12 ». Relative (Buzz uniquement) : « il y a 5 h » via `Intl.RelativeTimeFormat('fr')`.
- Pluriels : `Intl.PluralRules('fr')` (« 1 jour relevé », « 3 jours relevés »).
- Trafic Google : afficher `traffic_label` reformaté en français (« 1000+ » → « 1 000+ recherches ») sans changer la valeur.

### 9.6 Thème

- Valeur stockée : `localStorage['releve.theme']` ∈ `auto | light | dark` (lecture/écriture dans `try/catch`). `auto` = pas d'attribut `data-theme`.
- Fichier `assets/js/theme-init.js` (classique, non module, ~10 lignes) chargé de façon **synchrone** dans `<head>` avant les CSS : il pose `data-theme` avant le premier rendu (pas de flash) tout en respectant la CSP (pas de script inline).
- `<meta name="theme-color">` avec deux balises `media="(prefers-color-scheme: …)"` : `#FAFAF9` et `#0E0F11`.

---

## 10. Règles de contenu par vue (logique d'affichage)

- **Aujourd'hui** (marché global) :
  - *Entrées du jour* : produits `new === true`, triés par rang croissant ; 8 cartes desktop, 5 lignes mobile ; « Tout voir (n) » → Classements Jour avec la liste filtrée côté client (paramètre `f=nouveaux`).
  - *Plus fortes hausses depuis hier* : `change > 0`, tri `change` décroissant puis rang croissant ; 10 lignes.
  - *Montées sur 7 jours* : `change_7d > 0`, même tri ; masqué (état vide) si moins de 8 jours collectés.
  - *Toujours en tête* : `rank ≤ 3 && streak ≥ 7`, tri `streak` décroissant ; masqué (état vide) si moins de 7 jours collectés.
  - *N° 1 par catégorie* : rang 1 de chaque liste, avec badge (variation) ou série.
- **Classements** : Jour → `latest.amazon` ; autres périodes → `rankings[p].amazon[m].overall` (toutes catégories, 50 lignes) ou `.by_category[c]` (10 lignes ; le dire : « Les 10 premiers de la catégorie sur la période »).
- **Boutiques** : `latest.shopify` filtré par marché ; « Univers » filtre sur la catégorie de la boutique.
- **TikTok** : `latest.tiktok` filtré par marché ; 7 jours fixes (`period_days`).
- **Buzz** : `latest.gtrends`, une liste par marché.

---

## 11. Micro-copie (français)

### 11.1 Titres et sous-titres

| Emplacement | Texte |
|---|---|
| `<title>` accueil | « Relevé · Ce qui grimpe dans les classements, ce matin » |
| h1 Aujourd'hui | « Relevé du {samedi 3 octobre} » |
| Sous-titre | « {1 020} produits · {17} catégories · {France} · comparé au {2 oct.} » (premier jour : « premier relevé, pas encore de comparaison ») |
| Modules accueil | « Entrées du jour » · « Plus fortes hausses depuis hier » · « Montées sur 7 jours » · « Toujours en tête » · « N° 1 par catégorie » |
| h1 Classements | « Classements » / « Les produits les plus présents en tête des Meilleures ventes Amazon. » |
| h1 Boutiques | « Boutiques » / « Les meilleures ventes « depuis toujours » de {13} marques Shopify ({États-Unis}). » |
| h1 TikTok | « Pubs TikTok » / « Les produits les plus présents dans les publicités TikTok sur 7 jours, {France}. » |
| h1 Buzz | « Buzz » / « Les recherches Google qui s'envolent aujourd'hui, tous sujets confondus. » |
| h1 Méthode | « Méthode et sources » / « Ce que mesure Relevé, et ce qu'il ne mesure pas. » |

### 11.2 Libellés

- Périodes : « Jour », « 7 j », « 30 j », « Mois », « Année » ; libellés longs : « 7 derniers jours », « 30 derniers jours », « Octobre 2026 », « Année 2026 », suffixe « (en cours) ».
- Colonnes : RANG · VAR. 24 H · 7 J · PRODUIT · CATÉGORIE · BOUTIQUE · SCORE · PRÉSENCE · MEILLEUR · MOYEN · SÉRIE · PRIX · NOTE · 14 JOURS · POPULARITÉ · ÉVOL. · CTR · CVR.
- Marché : « FR » / « US » (libellé accessible « France » / « États-Unis »).
- Actions : « Tout voir » · « Voir les 30 » · « Afficher 25 de plus » · « Voir sur Amazon.fr » · « Voir sur Amazon.com » · « Voir la boutique » · « Réessayer » · « Fermer » · « Produit précédent » · « Produit suivant » · « Voir les données ».
- Thème : « Thème : automatique / clair / sombre ».

### 11.3 Messages d'état

| Situation | Titre | Texte |
|---|---|---|
| Chargement | — | (sr-only) « Chargement des classements… » |
| Filtre vide | « Aucun produit ici » | « Aucun produit ne correspond à cette catégorie sur cette période. Essayez « Toutes les catégories ». » |
| Premier jour (pas de comparaison) | « Les variations arrivent demain » | « Il faut deux relevés pour comparer. Le premier date d'aujourd'hui. » |
| Montées 7 j / Toujours en tête indisponibles | « Encore {4} jours de patience » | « Cette liste a besoin d'au moins 7 jours de relevés. Nous en avons {3}. » |
| Courbe < 2 points | « Pas encore de courbe » | « La courbe apparaîtra après deux relevés de ce produit. » |
| Période incomplète | — | « Période incomplète : ce classement ne repose que sur {3} jours. » + « Pourquoi ? » |
| Fichier inaccessible | « Impossible de charger les données » | « Le fichier des classements n'a pas répondu. Vérifiez votre connexion, puis réessayez. » [Réessayer] |
| Source indisponible | « {TikTok} n'a pas pu être relevé ce matin » | « Nouvel essai demain matin. Dernier relevé réussi : {1er oct.} » (ou « Aucun relevé réussi pour l'instant. ») |
| Source partielle | — | « Relevé partiel : {15} catégories sur {17}. Manquent : {Jardin, Auto et Moto}. » |
| Données anciennes | — | « Données du {1er oct.} : les relevés suivants ont échoué. » |
| Image indisponible | — | (alt) « Image indisponible » |
| Bandeau mobile | — | « {3} sources sur {4} à jour » |

### 11.4 Avertissements méthodologiques

- **Court (accueil, panneau, pied de page)** : « Un classement n'est pas un volume de ventes. Le n° 1 est le produit le plus vendu de sa catégorie au moment du relevé, sans dire combien. »
- **Score (infobulle de colonne)** : « Chaque jour, un produit gagne 31 − son rang (30 points pour le n° 1, 1 point pour le n° 30). Le score additionne ces points sur la période : il récompense à la fois le rang et la durée. »
- **Shopify** : « Shopify trie sur l'historique complet des ventes : ce sont des produits phares, pas des nouveautés. »
- **TikTok** : « Popularité dans les publicités TikTok sur 7 jours. Ce ne sont pas les ventes de TikTok Shop. CTR et CVR sont des moyennes fournies par TikTok, pas vos futurs résultats. »
- **Buzz** : « Toutes les recherches qui s'envolent (actualité, sport, produits…). Volume approximatif fourni par Google. »

### 11.5 Page Méthode : « L'essentiel » (encadré)

1. « Relevé lit chaque matin des classements publics : Amazon (17 catégories, France et États-Unis), 17 boutiques Shopify, TikTok Creative Center et Google Trends. »
2. « Ce sont des **positions**, jamais des quantités vendues. Aucune estimation de ventes n'est faite ici. »
3. « Chaque chiffre affiche sa source et l'heure du relevé. Quand une source manque ou qu'une période est incomplète, la page le dit. »

Pour chaque source (h2) : trois sous-parties fixes « Ce que c'est », « Ce que ce n'est pas », « Limites connues », puis le statut du jour. Textes de base : champ `meta.method` (déjà rédigé dans `aggregate.py`).

---

## 12. Recette avant mise en ligne

- [ ] 320, 360, 600, 900, 1200, 1440 px : aucun défilement horizontal, aucun texte tronqué hors `line-clamp` prévu.
- [ ] Thèmes clair et sombre, plus les 3 simulations de daltonisme : hausses, baisses, nouveautés et statuts restent identifiables.
- [ ] Navigation complète au clavier : changer marché/période/catégorie, ouvrir un produit, parcourir la courbe, fermer, focus revenu sur la ligne.
- [ ] `prefers-reduced-motion: reduce` : aucune animation, skeleton statique.
- [ ] Jeu de données « jour 1 » (un seul snapshot) : tous les états vides du §11.3 s'affichent, aucun « NaN », « undefined » ou « 0 » à la place de « — ».
- [ ] TikTok en erreur et Amazon partiel : la page reste utilisable, messages corrects.
- [ ] Lighthouse mobile : Accessibilité 100, Performance ≥ 90, CLS < 0,05.
- [ ] Toutes les chaînes externes échappées (tester avec un titre contenant `<img src=x onerror=alert(1)>`).
