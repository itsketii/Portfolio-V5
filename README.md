# Portfolio

Portfolio personnel en HTML / CSS / JavaScript pur, sans framework ni étape de build, hébergé sur **GitHub Pages**.

- Personnalisable en direct par le visiteur : couleur de fond, police, finition (flat / frosted), conteneurs, grain, scanlines, mouvement, bordures. Les réglages peuvent être enregistrés ou partagés par lien.
- **Dernière écoute** Spotify (titre en cours ou dernier titre écouté).
- **Activité GitHub** : grille de contributions, derniers événements, langages.
- Heure et météo en direct (Open-Meteo, sans clé).
- Projets et témoignages configurables dans un seul fichier.

## Structure

```
.
├── index.html                    # structure de la page
├── assets/
│   ├── css/style.css             # tous les styles
│   └── js/
│       ├── config.js             # ← TES infos : nom, projets, témoignages, ville
│       ├── mock.js               # données simulées (aperçu local)
│       └── main.js               # logique : réglages, Spotify, GitHub, météo, animations
├── scripts/
│   └── update-data.mjs           # récupère Spotify + GitHub, écrit data/*.json
├── .github/workflows/deploy.yml  # build + déploiement planifié (toutes les 10 min)
└── docs/
    └── GUIDE-SPOTIFY-GITHUB.md   # guide détaillé (Spotify, token GitHub, dépannage)
```

## Comment ça marche

GitHub Pages ne sert que des fichiers statiques et ne peut pas cacher de secrets. Une **GitHub Action** joue le rôle de back-end :

```
toutes les 10 min → Action (avec les secrets) → appelle Spotify + GitHub
                  → écrit data/spotify.json et data/github.json
                  → déploie le site sur GitHub Pages
index.html → lit data/*.json (aucun secret côté visiteur)
```

La météo est appelée directement par la page auprès d'Open-Meteo (gratuit, sans clé).

## Aperçu en local

Ouvre `index.html` dans ton navigateur. En `file://`, les données Spotify et GitHub sont **simulées** automatiquement.

Pour tester avec un petit serveur local : `python -m http.server 8000`, puis `http://localhost:8000`. Dans ce cas, les données réelles sont cherchées dans `data/` : elles n'existent pas en local, donc la section affichera « Rien d'écouté ». Mets `useMock: true` dans `config.js` pour garder l'aperçu simulé.

## Personnaliser le contenu

Tout se passe dans **`assets/js/config.js`** :

| Élément                                                              | Où              |
| ---------------------------------------------------------------------- | ---------------- |
| Nom, titre, ville, fuseau horaire, pseudo GitHub, coordonnées météo | `CONFIG`       |
| Projets                                                                | `PROJECTS`     |
| Témoignages                                                           | `TESTIMONIALS` |

Le texte de présentation, les liens (email, LinkedIn) et le pied de page se modifient dans `index.html`.

## Mise en ligne

1. Crée un dépôt **public** sur GitHub et pousse ce projet sur la branche `main`.
2. **Settings → Pages → Source : GitHub Actions**.
3. Ajoute les secrets : **Settings → Secrets and variables → Actions**.
   | Secret                    | Rôle                                                              |
   | ------------------------- | ------------------------------------------------------------------ |
   | `SPOTIFY_CLIENT_ID`     | identifiant de l'app Spotify                                       |
   | `SPOTIFY_CLIENT_SECRET` | secret de l'app Spotify                                            |
   | `SPOTIFY_REFRESH_TOKEN` | autorisation de lecture de ton historique                          |
   | `GH_PAT`                | token GitHub (scope `read:user`) pour la grille de contributions |
4. **Actions → Build & deploy → Run workflow**. Vérifie `✔ spotify` et `✔ github` dans les logs, puis ouvre le site.

Comment obtenir ces secrets, étape par étape (création de l'app Spotify, refresh token, token GitHub, alternative Last.fm sans Premium, dépannage) : **[docs/GUIDE-SPOTIFY-GITHUB.md](docs/GUIDE-SPOTIFY-GITHUB.md)**.

## Limites à connaître

- Les données sont rafraîchies environ toutes les 10 minutes (GitHub peut retarder les tâches planifiées).
- GitHub désactive les workflows planifiés après 60 jours sans activité dans le dépôt : pousse un commit ou réactive-le dans l'onglet Actions.
- Spotify exige un compte **Premium** pour le propriétaire d'une app en mode développement (règle de février 2026). Sans Premium, utilise Last.fm (voir le guide).
- Ne jamais écrire un secret dans le code ou dans un commit.

## Problemes rencotrés

24/11/2026 - Bug GitHub Pages

Cause :
Le dossier _site n'était pas correctement construit avant upload.

Mauvais :
cp -r index.html assets _site/

Correct :
mkdir -p _site
cp index.html _site/
cp -r assets _site/

Conséquence :
Le déploiement GitHub Pages échouait alors que l'artefact était créé avec succès.


## Licence

Libre d'utilisation pour ton propre portfolio.
