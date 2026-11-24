# Spotify en temps réel avec un Cloudflare Worker

## Pourquoi
GitHub Pages est statique : `data/spotify.json` ne change que quand le workflow « Build & deploy » s'exécute.
Les exécutions planifiées (`schedule`) de GitHub ne sont **pas garanties** : elles sont retardées, voire ignorées, surtout quand GitHub est chargé. Résultat : le site ne se met à jour qu'après un commit.

Le Worker est une mini-API gratuite qui interroge Spotify **à la demande** (avec un cache de 15 s). Les secrets restent côté Cloudflare, jamais dans la page.

```
navigateur ──▶ Worker Cloudflare ──▶ Spotify
   (toutes les 30 s)  (secrets + cache 15 s)
```
Si le Worker est indisponible, le site retombe automatiquement sur `data/spotify.json`.

## Ce qu'il te faut
- Un compte Cloudflare gratuit (https://dash.cloudflare.com/sign-up). Pas de domaine ni de carte bancaire nécessaires.
- Les 3 valeurs Spotify que tu as déjà : Client ID, Client Secret, Refresh token.

## Étapes (≈ 10 min, tout dans le navigateur)

1. Connecte-toi sur https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Nom : `spotify-last-played` → **Deploy** (le code d'exemple est déployé, c'est normal).
3. Clique **Edit code**. Supprime tout le contenu et colle le contenu de `worker/spotify-worker.js`.
4. Dans le fichier collé, vérifie la liste `ALLOWED_ORIGINS` : elle doit contenir ton site exactement, ex. `https://itsketii.github.io` (sans `/` final, sans `/Portfolio-V5`). Clique **Deploy**.
5. Retourne sur la page du Worker → **Settings** → **Variables and Secrets** → **Add**. Crée 3 variables de type **Secret** (le nom doit être exact) :

   | Nom | Valeur |
   |-----|--------|
   | `SPOTIFY_CLIENT_ID` | ton Client ID |
   | `SPOTIFY_CLIENT_SECRET` | ton Client Secret |
   | `SPOTIFY_REFRESH_TOKEN` | ton refresh token |

   Puis **Deploy** pour appliquer.
6. Copie l'URL du Worker (en haut de la page), de la forme `https://spotify-last-played.TON-COMPTE.workers.dev`.
7. Ouvre cette URL dans le navigateur : tu dois voir du JSON avec ton dernier titre. (Si tu vois `{"error": ...}`, lis le message : secret manquant ou token invalide.)
8. Dans `assets/js/config.js`, renseigne :
   ```js
   spotifyApi: "https://spotify-last-played.TON-COMPTE.workers.dev",
   ```
9. Commit + push. Lance de la musique sur Spotify : le site change en moins de ~45 s sans aucun déploiement.

## Dépannage
| Symptôme | Cause | Solution |
|----------|-------|----------|
| Le site n'est pas à jour | `spotifyApi` vide ou mauvais URL | vérifier `config.js` |
| Erreur CORS dans la console | ton site n'est pas dans `ALLOWED_ORIGINS` | corriger l'origine exacte, redéployer le Worker |
| `{"error":"Secrets Spotify manquants…"}` | secrets absents ou noms incorrects | refaire l'étape 5 |
| `Spotify token: 400/401` | refresh token/secret invalide | régénérer le refresh token (voir GUIDE-SPOTIFY-GITHUB.md §3.5) |
| Titre « en écoute » en retard | cache 15 s + intervalle 30 s | normal ; réduire `pollSpotifyMs` si besoin |

## Limites
Le plan gratuit de Cloudflare autorise 100 000 requêtes/jour : largement suffisant (le cache de 15 s absorbe la plupart des visites).

## Et le workflow GitHub ?
Il reste utile pour `data/github.json` (qui change peu) et comme secours pour Spotify. Il tourne maintenant 2 fois par heure et à chaque push. Tu peux aussi le lancer à la main : *Actions → Build & deploy → Run workflow*.
