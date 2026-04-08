# Running Coach × Claude IA

Générateur de plans d'entraînement running personnalisés, propulsé par l'API Anthropic Claude.

## Présentation

Application web 100 % front-end (HTML/CSS/JS) qui produit un plan d'entraînement complet semaine par semaine à partir de votre profil de coureur. Aucun serveur, aucune inscription — votre clé API Anthropic suffit.

## Fonctionnalités

- **Génération IA** — Plan structuré en JSON par Claude (Opus, Sonnet ou Haiku), avec phases, volume hebdomadaire et allures précises
- **5 disciplines** — Route, Trail court, Trail long, Cross, Piste, Course à obstacles
- **Allures VMA** — Calcul automatique EF / SL / Seuil / VMA / Récup depuis votre VMA (km/h)
- **Calculateur VMA** — Estimation depuis un chrono récent (1 500 m, 3 km, 5 km, 10 km)
- **5 styles de plan** — Classique FFA, 80/20 Polarisé, Lydiard, HIIT Intensif, Progressif Doux
- **Santé & blessures** — Pathologies prises en compte dans la génération (tendinite, rotule, lombalgie…)
- **Régénération par semaine** — Relancez une semaine précise avec une consigne libre
- **Export CSV** — Téléchargement du plan complet (UTF-8, compatible Excel)
- **Impression PDF A3** — Mise en page paysage optimisée pour l'impression ou l'export PDF
- **Glossaire intégré** — Définitions des acronymes running (EF, SL, VMA, PPG, Seuil…)

## Utilisation

1. Ouvrez `index.html` dans un navigateur moderne (Chrome, Edge, Firefox)
2. Entrez votre clé API Anthropic (`sk-ant-...`) — obtenez-la sur [console.anthropic.com](https://console.anthropic.com)
3. Remplissez les 4 sections du panneau gauche :
   - **1. La course cible** — type, distance, date, objectif chrono
   - **2. Votre profil** — niveau, séances/semaine, kilométrage, VMA
   - **3. Santé & blessures** — pathologies à prendre en compte
   - **4. Modèle & options** — choix du modèle Claude, méthode, niveau de détail
4. Cliquez sur **Générer mon plan**

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
index.html   — Structure HTML (panneau accordéon + stage plan)
style.css    — Design dark panel / light stage, animations, responsive table
app.js       — Logique : API Claude, génération du prompt, parsing JSON,
               rendu tableau, export CSV, impression PDF, calculateur VMA
```

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

- Navigateur moderne avec support `fetch` / `XMLHttpRequest` (Chrome 90+, Edge 90+, Firefox 90+)
- Clé API Anthropic active avec crédits disponibles
- Connexion internet (appel direct à `api.anthropic.com`)

## Limites connues

- Plans ≥ 8 semaines : le niveau de détail est automatiquement réduit pour ne pas dépasser la limite de 8 192 tokens de sortie
- L'impression PDF nécessite d'autoriser les pop-ups pour la page
- La clé API n'est pas persistée entre les sessions (à ressaisir à chaque ouverture)
