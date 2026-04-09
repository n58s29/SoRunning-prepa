# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

---

## [2.1.0] — 2026-04-09

### Refonte UX — wizard 3 étapes & sélection visuelle

#### Ajouté
- **Navigation wizard** en 3 étapes (Course → Profil → Options) avec indicateur de progression, boutons Retour/Suivant et points de progression animés
- **Cards visuelles cliquables** pour le type de course (grille 3×2 avec icônes) et pour le niveau de pratique (grille 2×2 avec sous-titres descriptifs)
- **Sélecteur segmenté** pour le nombre de séances par semaine (boutons 2/3/4/5/6)
- **Date picker natif** (`type="date"`) — remplace la saisie masquée JJ/MM/AAAA ; date minimum automatiquement fixée à aujourd'hui
- Calculateur VMA **repliable** (accordéon inline)
- Zone de génération **toujours visible** en bas du panneau (clé API + bouton Générer)
- Labels min/max sur le slider kilométrage

#### Modifié
- Panel gauche élargi de 360 px → **440 px** pour plus de confort de lecture
- `parseLocalDate()` accepte désormais les deux formats : `YYYY-MM-DD` (natif) et `DD/MM/YYYY` (héritage)
- Architecture accordéons (4 sections) remplacée par le wizard 3 étapes
- Indicateurs d'étapes complétées (✓) sur les cercles de navigation

#### Conservé
- Charte graphique identique : `--pink #f773b4`, noir, blanc, rose pâle
- Toute la logique métier (API Claude, prompts, parsing, export, impression, regen)

---

## [2.0.0] — 2026-04-08

### Refonte UX/UI complète — architecture 3 fichiers

#### Ajouté
- Panneau gauche en thème sombre (`#0d0d0d`) avec inputs et selects stylisés
- Navigation par **accordéons numérotés** (1 à 4) — plusieurs sections peuvent rester ouvertes simultanément ; section 1 ouverte par défaut
- **Grille de feature cards** sur l'écran d'accueil avec effet hover animé
- Icône 🏃 animée (bouncing) sur l'écran d'accueil
- Runner 🏃 animé en translation pendant la génération
- **Barre de progression dégradée** (`--pink` → `#ff9de0`) pendant l'appel API
- **Topbar sticky** sur la vue plan (titre + boutons d'action toujours visibles au scroll)
- Bannière d'erreur **inline et dismissible** (bouton ✕) en remplacement de la div statique
- `backdrop-filter: blur(3px)` sur les overlays de modales
- Animation `scale + translateY` à l'ouverture des modales
- Scrollbars personnalisées (panel gauche + wrapper table + stage droit)
- Hauteur minimale des cellules de séance portée à **95 px** (vs 82 px)
- Bordure rose sur les cellules week-end (`rgba(247,191,217,.12)`)

#### Modifié
- Architecture passée d'un **fichier unique** (`RunningCoach_Claude.html`) à **3 fichiers séparés** (`index.html`, `style.css`, `app.js`)
- Navigation par **onglets horizontaux** remplacée par des **accordéons verticaux** dans le panneau gauche
- `validateVMA` utilise désormais `classList.add/remove` au lieu de `el.className =` — préserve la classe `dark-input`
- `checkValidity` utilise `classList.contains('is-valid')` en cohérence
- Wrapper du tableau plan avec `border-radius: 12px` et `box-shadow`

#### Conservé (inchangé)
- Toute la logique métier : API Claude, construction du prompt, parsing JSON, détection du type de séance, calcul VMA/allures, export CSV, impression PDF A3, régénération par semaine, glossaire

---

## [1.0.0] — 2026-04-08

### Première version — migration HTA → navigateur

#### Ajouté
- Fichier unique `RunningCoach_Claude.html` — application web standalone sans dépendances
- Intégration **API Anthropic Claude** (`https://api.anthropic.com/v1/messages`) en remplacement de l'API SNCF GPT
  - Header `anthropic-dangerous-allow-browser: true` pour les appels directs depuis le navigateur
  - Parsing de `res.content[0].text` (format Anthropic vs `choices[0].message.content` OpenAI)
  - Gestion de `stop_reason === 'max_tokens'` (réponse tronquée)
- **Sélecteur de modèle** : Opus 4.6, Sonnet 4.6 (défaut), Haiku 4.5, Sonnet 3.5, Haiku 3.5
- Saisie de la **clé API utilisateur** (`sk-ant-...`) avec champ masqué et toggle affichage
- Navigation par **4 onglets** : Course, Profil, Santé, Options
- **Calculateur VMA** depuis un chrono récent (1 500 m, 3 km, 5 km, 10 km)
- Export **CSV** via `Blob` + `URL.createObjectURL` (remplace `ActiveXObject FileSystem`)
- Impression **PDF A3 paysage** via `Blob` HTML + `window.open` (remplace `ActiveXObject Shell`)
- Mode compact automatique pour les plans ≥ 8 semaines (≤ 15 mots/séance) pour respecter la limite de 8 192 tokens
- Parsing JSON robuste : suppression des balises markdown, extraction entre `{` et `}`, nettoyage des retours à la ligne dans les valeurs string
- **Régénération de semaine** avec consigne libre via modal
- **Glossaire** running intégré (16 termes : EF, SL, VMA, Seuil, PPG, Récup, FC, Z1-Z5, 30/30, Allure, Fartlek, Affûtage, D+, Rep, Échauffement, RC)
- Palette SoRunning : `--pink #f773b4`, `--black #000`, `--white #fff`, `--pale-pink #f7bfd9`
- 6 types de discipline : Route, Trail court, Trail long, Cross, Piste, Course à obstacles
- 5 méthodes d'entraînement : Classique FFA, 80/20 Polarisé, Lydiard, HIIT Intensif, Progressif Doux

#### Retiré (vs version HTA originale)
- Dépendances Windows/HTA : `<HTA:APPLICATION>`, `ActiveXObject`, `WScript`, `Scripting.FileSystemObject`
- Appel API `gpt.sncf.fr` (remplacé par `api.anthropic.com`)
- Code IE-spécifique
