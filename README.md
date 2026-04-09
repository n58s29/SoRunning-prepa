# Kinetic Editorial — Running Coach IA

Générateur de plans d'entraînement running personnalisés, propulsé par l'API Anthropic Claude. Interface premium "Kinetic Editorial" — design system sport haut de gamme.

## Présentation

Application web 100 % front-end (HTML/CSS/JS) qui produit un plan d'entraînement complet semaine par semaine à partir de votre profil de coureur. Aucun serveur, aucune inscription — votre clé API Anthropic suffit.

Design inspiré des éditoriaux mode/auto premium : thème sombre intégral, typographie Plus Jakarta Sans + Inter, surface tiers, glassmorphism, et progression éditoriale en 3 étapes.

## Fonctionnalités

- **Génération IA** — Plan structuré en JSON par Claude (Opus, Sonnet ou Haiku), avec phases, volume hebdomadaire et allures précises
- **6 disciplines** — Route, Trail court, Trail long, Cross, Piste, Course à obstacles
- **Allures VMA** — Calcul automatique EF / SL / Seuil / VMA / Récup depuis votre VMA (km/h)
- **Calculateur VMA** — Estimation depuis un chrono récent (1 500 m, 3 km, 5 km, 10 km)
- **5 styles de plan** — Classique FFA, 80/20 Polarisé, Lydiard, HIIT Intensif, Progressif Doux
- **Contraintes physiologiques** — 11 pathologies prises en compte (tendinite, rotule, lombalgie, fasciite…)
- **Régénération par semaine** — Relancez une semaine précise avec une consigne libre
- **Export CSV** — Téléchargement du plan complet (UTF-8, compatible Excel)
- **Impression PDF A3** — Mise en page paysage optimisée pour l'impression ou l'export PDF
- **Glossaire intégré** — Définitions des acronymes running (EF, SL, VMA, PPG, Seuil…)
- **Stats bar** — Volume total, intensités, difficulté et pace cible affichés après génération

## Utilisation

1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Edge, Firefox)
2. Parcourez le **wizard en 3 étapes** dans la zone principale :
   - **Step 1 — Select Your Course** — type de terrain (cards visuelles asymétriques), distance, date, objectif chrono
   - **Step 2 — Runner Profile** — niveau (cards), séances/semaine, kilométrage, VMA
   - **Step 3 — Health Optimization** — contraintes physiologiques, Neural Engine (clé API + modèle + méthode)
3. Dans le **Plan Summary** (Step 3), cliquez sur **GENERATE MY PLAN**

> La clé API n'est jamais stockée. Elle est utilisée uniquement pour l'appel direct à `api.anthropic.com` depuis votre navigateur.

## Modèles disponibles

| Modèle | Usage recommandé |
|--------|-----------------|
| Claude Sonnet 4.6 | ✅ Recommandé — équilibre qualité / vitesse |
| Claude Opus 4.6 | Plans très détaillés, plus lent |
| Claude Haiku 4.5 | Rapide et économique |
| Claude 3.5 Sonnet | Génération précédente |
| Claude 3.5 Haiku | Génération précédente, économique |

## Structure des fichiers

```
index.html   — Structure HTML (sidebar + topbar + wizard 3 étapes + vue plan)
style.css    — Design system Kinetic Editorial (thème sombre, surface tiers, animations)
app.js       — Logique : wizard, API Claude, génération du prompt, parsing JSON,
               rendu tableau, stats bar, export CSV, impression PDF, calculateur VMA
```

## Design System

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bg` | `#0e0e0e` | Fond principal |
| `--surface` | `#1a1a1a` | Cartes et inputs |
| `--surface-high` | `#262626` | Cartes actives |
| `--primary` | `#ff86bf` | Accent rose premium |
| `--tertiary` | `#98a1ff` | Week-end, PPG |
| `--font-display` | Plus Jakarta Sans | Headings, CTAs |
| `--font-body` | Inter | Corps de texte |

## Types de séances

| Badge | Type | Description |
|-------|------|-------------|
| EF | Endurance Fondamentale | 60-70 % FCM, allure conversation |
| SL | Sortie Longue | > 1 h en EF, développe l'endurance |
| VMA | Intervalles | 100-110 % VMA, développe le moteur cardio |
| Seuil | Allure Anaérobie | 85-90 % FCM, tolérance lactique |
| PPG | Renforcement | Gainage, squats, plyométrie |
| Récup | Récupération Active | Footing léger 25-40 min |
| 🏁 | Jour de course | Dernière séance du plan |

## Prérequis

- Navigateur moderne (Chrome 90+, Edge 90+, Firefox 90+)
- Clé API Anthropic active avec crédits disponibles
- Connexion internet (appel direct à `api.anthropic.com`)

## Version

**v3.0.0** — Refonte design Kinetic Editorial — voir [CHANGELOG.md](CHANGELOG.md)

## Limites connues

- Plans ≥ 8 semaines : le niveau de détail est automatiquement réduit pour ne pas dépasser la limite de 8 192 tokens de sortie
- L'impression PDF nécessite d'autoriser les pop-ups pour la page
- La clé API n'est pas persistée entre les sessions (à ressaisir à chaque ouverture)
