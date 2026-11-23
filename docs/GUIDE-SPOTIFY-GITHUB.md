# Guide complet — Terminer et déployer le portfolio (GitHub Pages)

> Ce guide accompagne le projet multi-fichiers (voir `README.md`).
> Objectif : le mettre en ligne sur **GitHub Pages**, avec un vrai « Dernière écoute » Spotify, une vraie activité GitHub et la météo réelle.

---

## 0. À lire d'abord : pourquoi pas Django ?

**GitHub Pages n'héberge que des fichiers statiques** (HTML, CSS, JS, JSON). Il ne peut pas exécuter Django, Python ni aucun serveur.
Or Spotify exige un secret (Client Secret + refresh token) qui ne doit **jamais** apparaître dans une page web publique.

La solution retenue : **une GitHub Action planifiée** qui fait le travail d'un back-end.

```
Toutes les 10 min ─▶ GitHub Action ─▶ appelle Spotify + GitHub (avec les secrets)
                                     │
                                     ▼
                    écrit data/spotify.json et data/github.json
                                     │
                                     ▼
                       déploie le site sur GitHub Pages
                                     │
                                     ▼
          portfolio.html lit data/*.json (aucun secret côté visiteur)
```

Avantages : gratuit, tout reste dans GitHub, aucun serveur à maintenir, secrets protégés.
Limite : les données sont rafraîchies toutes les ~10 minutes (pas à la seconde). Pour un « dernier titre écouté », c'est largement suffisant.

> Alternative si tu veux du temps réel : un **Cloudflare Worker** (gratuit) qui sert d'API. Plus rapide, mais un service de plus à gérer. Dis-le-moi si tu préfères.

---

## 1. Ce que tu dois fournir (résumé)

| #  | Élément                              | Où le trouver             | Secret ?      | À qui le donner                             |
| -- | -------------------------------------- | -------------------------- | ------------- | -------------------------------------------- |
| 1  | Nom, titre, bio, ville, email          | toi                        | non           | à moi (ou à modifier dans `CONFIG`)      |
| 2  | Liens LinkedIn / GitHub, pseudo GitHub | toi                        | non           | à moi                                       |
| 3  | Projets (nom, stack, lien)             | toi                        | non           | à moi                                       |
| 4  | Témoignages (ou on les retire)        | toi                        | non           | à moi                                       |
| 5  | Photo (optionnel)                      | toi                        | non           | à moi                                       |
| 6  | **Spotify Client ID**            | Dashboard Spotify          | non (public)  | à moi (facultatif)                          |
| 7  | **Spotify Client Secret**        | Dashboard Spotify          | **OUI** | **uniquement dans les secrets GitHub** |
| 8  | **Spotify Refresh Token**        | généré à l'étape 3.5  | **OUI** | **uniquement dans les secrets GitHub** |
| 9  | **GitHub Personal Access Token** | github.com/settings/tokens | **OUI** | **uniquement dans les secrets GitHub** |
| 10 | Nom du dépôt GitHub                  | toi                        | non           | à moi                                       |

**Règle d'or : ne colle jamais un secret (7, 8, 9) dans le chat, dans un fichier du dépôt ou dans une capture d'écran.** Tu les saisis toi-même dans *Settings → Secrets* de ton dépôt (étape 3.6). Je n'en ai pas besoin pour écrire le code.

---

## 2. Ordre des opérations

1. Créer le dépôt GitHub et y mettre le site (étape 6.1).
2. Créer l'app Spotify et récupérer le refresh token (étape 3).
3. Créer le token GitHub (étape 4).
4. Ajouter les 5 secrets dans le dépôt (étape 3.6 et 4).
5. Ajouter le script et le workflow (étape 5).
6. Activer GitHub Pages en mode « GitHub Actions » (étape 6.2).
7. Lancer le workflow une première fois à la main et vérifier (étape 6.3).
8. Me demander d'adapter le front pour lire `data/*.json` et Open-Meteo (étape 7).

---

## 3. Spotify — guide détaillé pas à pas

### 3.1 Ce que Spotify va nous donner

Spotify propose une API officielle (« Web API ») qui répond à deux questions :

- *Qu'est-ce que j'écoute **en ce moment** ?* → `GET /v1/me/player/currently-playing`
- *Quel est le **dernier titre** que j'ai écouté ?* → `GET /v1/me/player/recently-played?limit=1`

Pour y accéder, il faut prouver que c'est bien **toi** qui autorises la lecture de ton historique. Cela se fait avec OAuth :

1. Tu crées une « application » Spotify (c'est juste un identifiant pour ton projet).
2. Tu autorises cette application **une seule fois** depuis ton navigateur.
3. Spotify te remet un **refresh token** : un mot de passe de longue durée qui permet à l'Action d'obtenir à chaque exécution un access token temporaire (1 h).

### 3.2 ⚠️ Prérequis important : Spotify Premium

D'après l'annonce officielle de Spotify (février 2026) : les applications en « Development Mode » exigent maintenant que **le propriétaire de l'app ait un abonnement Spotify Premium actif**, avec une limite de 5 utilisateurs autorisés et d'un seul Client ID en mode développement par développeur. Si l'abonnement s'arrête, l'app cesse de fonctionner.

- **Tu as Premium** → continue avec cette section 3.
- **Tu n'as pas Premium** → utilise l'**option B (Last.fm)** à la fin de cette section 3 : gratuite, sans OAuth, sans secret.

Source : [Update on Developer Access and Platform Security](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security).

Remarque : les endpoints `currently-playing` et `recently-played` ne figurent pas dans la liste des endpoints supprimés du [guide de migration de février 2026](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), mais Spotify ne publie pas la liste complète sur cette page. Si l'un des deux répond `403` ou `404` à l'étape 5, bascule sur Last.fm.

### 3.3 Créer l'application Spotify

1. Va sur **https://developer.spotify.com/dashboard** et connecte-toi avec ton compte Spotify.
2. Accepte les conditions des développeurs si on te les propose.
3. Clique sur **Create app**.
4. Remplis le formulaire :

| Champ                                             | Valeur à saisir                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| **App name**                                | `Portfolio Last Played` (au choix)                                     |
| **App description**                         | `Affiche mon dernier titre écouté sur mon portfolio`                 |
| **Website**                                 | l'URL de ton futur site, ex. `https://ton-user.github.io` (facultatif) |
| **Redirect URIs**                           | `http://127.0.0.1:8888/callback` puis clique **Add**             |
| **Which API/SDKs are you planning to use?** | coche **Web API**                                                  |

5. Coche la case d'acceptation des conditions, puis **Save**.

**À propos de la Redirect URI** (très important) : Spotify n'accepte plus `localhost`. Il faut soit du HTTPS, soit une adresse de boucle locale écrite avec l'IP : `http://127.0.0.1:PORT`. Elle doit être **identique au caractère près** à celle utilisée à l'étape 3.5 (pas de `/` en plus, même port). Source : [Redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

### 3.4 Récupérer le Client ID et le Client Secret

1. Sur ton app, clique **Settings** (en haut à droite).
2. Tu vois le **Client ID** (une chaîne de 32 caractères). Copie-le.
3. Clique sur **View client secret** : copie le **Client Secret**. Garde-le privé.
4. Descends jusqu'à **User management** et ajoute ton propre email Spotify si tu n'y figures pas déjà (nom + email du compte Spotify). Sans cela, tu peux obtenir une erreur `403` à l'autorisation.

### 3.5 Obtenir le refresh token (une seule fois)

Il faut **Python 3** installé sur ton ordinateur. Vérifie avec `python --version` (ou `python3 --version`) dans un terminal.

1. Crée un fichier `get_spotify_token.py` **en dehors de ton dépôt** (pour ne jamais le publier par erreur) avec ce contenu :

```python
import base64, http.server, json, sys, urllib.parse, urllib.request, webbrowser

CLIENT_ID = input("Client ID : ").strip()
CLIENT_SECRET = input("Client Secret : ").strip()
REDIRECT = "http://127.0.0.1:8888/callback"   # doit être identique à la Redirect URI du dashboard
SCOPE = "user-read-recently-played user-read-currently-playing"

auth_url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode({
    "client_id": CLIENT_ID, "response_type": "code",
    "redirect_uri": REDIRECT, "scope": SCOPE,
})

result = {}

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        result["code"] = q.get("code", [None])[0]
        result["error"] = q.get("error", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write("Autorisation reçue. Tu peux fermer cet onglet.".encode("utf-8"))
    def log_message(self, *args):
        pass

server = http.server.HTTPServer(("127.0.0.1", 8888), Handler)
print("Ouverture du navigateur… connecte-toi à Spotify et clique sur « Accepter ».")
webbrowser.open(auth_url)
server.handle_request()          # attend UNE requête (le retour de Spotify)

if not result.get("code"):
    sys.exit("Échec de l'autorisation : " + str(result.get("error")))

body = urllib.parse.urlencode({
    "grant_type": "authorization_code",
    "code": result["code"],
    "redirect_uri": REDIRECT,
}).encode()
basic = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
req = urllib.request.Request(
    "https://accounts.spotify.com/api/token", data=body,
    headers={"Authorization": "Basic " + basic,
             "Content-Type": "application/x-www-form-urlencoded"})
tokens = json.load(urllib.request.urlopen(req))

print("\n=== REFRESH TOKEN (secret, ne le partage pas) ===")
print(tokens["refresh_token"])
```

2. Ouvre un terminal dans le dossier du fichier et lance : `python get_spotify_token.py` (ou `python3 …`).
3. Colle ton **Client ID**, puis ton **Client Secret** quand le script les demande.
4. Ton navigateur s'ouvre sur Spotify : connecte-toi si besoin, puis clique **Accepter**.
5. La page affiche « Autorisation reçue ». Retourne dans le terminal : il affiche le **refresh token**. Copie-le.
6. Supprime le fichier `get_spotify_token.py` ou garde-le hors du dépôt. Il ne contient pas tes secrets (tu les saisis à chaque fois), mais autant éviter les risques.

Si ça échoue :

| Message                                          | Cause probable                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_REDIRECT_URI`                         | la Redirect URI du dashboard n'est pas exactement `http://127.0.0.1:8888/callback`                                      |
| `INVALID_CLIENT`                               | Client ID ou Client Secret mal copié (espace en trop)                                                                    |
| Page Spotify « User not registered » / `403` | ajoute ton email dans *User management* (3.4)                                                                           |
| `Address already in use`                       | le port 8888 est pris : ferme le programme qui l'utilise, ou change le port **dans le script ET dans le dashboard** |

### 3.6 Enregistrer les secrets dans GitHub

Dans ton dépôt GitHub : **Settings → Secrets and variables → Actions → New repository secret**. Crée ces trois secrets (le nom doit être exact) :

| Nom                       | Valeur                           |
| ------------------------- | -------------------------------- |
| `SPOTIFY_CLIENT_ID`     | ton Client ID                    |
| `SPOTIFY_CLIENT_SECRET` | ton Client Secret                |
| `SPOTIFY_REFRESH_TOKEN` | le refresh token de l'étape 3.5 |

Une fois enregistrés, GitHub ne te les réaffiche plus : seule l'Action y a accès.

### 3.7 Option B — Last.fm (si tu n'as pas Premium)

Last.fm enregistre ce que tu écoutes sur Spotify (« scrobbling ») et propose une API **gratuite**, lisible sans OAuth.

1. Crée un compte sur **https://www.last.fm** (note ton **nom d'utilisateur**).
2. Va dans **Réglages → Applications** (`last.fm/settings/applications`) et **connecte Spotify** (« Connect » à côté de Spotify). Tes écoutes sont désormais enregistrées automatiquement.
3. Crée une clé d'API sur **https://www.last.fm/api/account/create** (nom : `Portfolio`, description libre). Note l'**API key**.
4. Test dans ton navigateur (remplace `NOM` et `CLE`) :
   `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=NOM&api_key=CLE&limit=1&format=json`
   Si tu vois ton dernier titre : c'est bon. Quand un titre est en cours, il porte l'attribut `@attr.nowplaying = "true"`.
5. Ce que tu me donnes : ton **nom d'utilisateur Last.fm** et ton **API key**. Cette clé est en lecture seule sur des données publiques ; l'ajouter à l'Action en secret `LASTFM_API_KEY` reste la bonne pratique.
6. Je remplace alors la fonction `spotify()` du script (étape 5.1) par un appel à Last.fm. Le format de `data/spotify.json` ne change pas, donc le front non plus.

---

## 4. GitHub — activité (grille de contributions, événements, langages)

1. Va sur **https://github.com/settings/tokens** → **Generate new token → Generate new token (classic)**.
2. **Note** : `portfolio-activity`. **Expiration** : 1 an (note la date pour le renouveler).
3. Coche **uniquement** le scope `read:user`. Clique **Generate token** et copie-le immédiatement (il ne sera plus affiché).
4. Dans le dépôt : **Settings → Secrets and variables → Actions → New repository secret** :

| Nom        | Valeur                          |
| ---------- | ------------------------------- |
| `GH_PAT` | le token que tu viens de créer |

5. Pour que tes contributions privées soient aussi comptées : sur ton profil GitHub, *Contribution settings → « Include private contributions on my profile »* (la grille ne montrera que des nombres, jamais les noms de dépôts privés).

Le pseudo GitHub est lu automatiquement depuis le propriétaire du dépôt.

---

## 5. Le « back-end » : script + workflow

### 5.1 `scripts/update-data.mjs`

Ce script tourne dans l'Action (Node 20, aucune dépendance à installer). Il appelle Spotify et GitHub, puis écrit `_site/data/spotify.json` et `_site/data/github.json`. Si une source échoue, l'autre est quand même produite.

```js
import { mkdir, writeFile } from "node:fs/promises";

const OUT = "_site/data";
await mkdir(OUT, { recursive: true });

/* ---------- Spotify ---------- */
async function spotify() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  // 1) refresh token -> access token (valable 1 h)
  const tokRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!tokRes.ok) throw new Error("Spotify token: " + tokRes.status);
  const { access_token } = await tokRes.json();
  const headers = { Authorization: "Bearer " + access_token };

  // 2) titre en cours ? (204 = rien en lecture)
  let item = null, isPlaying = false, playedAt = null;
  const cur = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers });
  if (cur.status === 200) {
    const j = await cur.json();
    if (j.item && j.is_playing) { item = j.item; isPlaying = true; playedAt = new Date().toISOString(); }
  }

  // 3) sinon, dernier titre écouté
  if (!item) {
    const rec = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", { headers });
    if (!rec.ok) throw new Error("Spotify recently-played: " + rec.status);
    const first = (await rec.json()).items?.[0];
    if (first) { item = first.track; playedAt = first.played_at; }
  }
  if (!item) return null;

  const imgs = item.album?.images ?? [];
  return {
    isPlaying,
    title: item.name,
    artist: item.artists.map(a => a.name).join(", "),
    album: item.album?.name ?? "",
    coverUrl: (imgs[1] ?? imgs[0])?.url ?? null,
    url: item.external_urls?.spotify ?? null,
    playedAt,
  };
}

/* ---------- GitHub ---------- */
async function github() {
  const user = process.env.GH_USER;
  const token = process.env.GH_PAT;
  const H = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };

  // grille de contributions (12 derniers mois)
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
    totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const gql = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: user } }),
  }).then(r => r.json());
  if (!gql.data?.user) throw new Error("GitHub GraphQL: " + JSON.stringify(gql.errors ?? gql));
  const cal = gql.data.user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap(w => w.contributionDays.map(d => ({ date: d.date, count: d.contributionCount })));

  // derniers événements publics
  const raw = await fetch(`https://api.github.com/users/${user}/events/public?per_page=30`, { headers: H }).then(r => r.json());
  const events = [];
  for (const e of Array.isArray(raw) ? raw : []) {
    const p = e.payload ?? {};
    let type = null, message = "";
    if (e.type === "PushEvent") {
      const n = p.commits?.length ?? p.size ?? 1;
      type = "push";
      message = `${n} commit${n > 1 ? "s" : ""}` + (p.commits?.[0]?.message ? ` — ${p.commits[0].message.split("\n")[0]}` : "");
    } else if (e.type === "PullRequestEvent") { type = "pr"; message = `Pull request ${p.action === "closed" && p.pull_request?.merged ? "fusionnée" : p.action} — ${p.pull_request?.title ?? ""}`; }
    else if (e.type === "WatchEvent") { type = "star"; message = "A mis une étoile"; }
    else if (e.type === "CreateEvent" && p.ref_type === "branch") { type = "branch"; message = `Nouvelle branche ${p.ref}`; }
    if (type) events.push({ type, repo: e.repo.name, message, at: e.created_at });
    if (events.length === 5) break;
  }

  // langages (par nombre de dépôts, hors forks)
  const repos = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&type=owner`, { headers: H }).then(r => r.json());
  const count = {};
  for (const r of Array.isArray(repos) ? repos : []) if (!r.fork && r.language) count[r.language] = (count[r.language] ?? 0) + 1;
  const total = Object.values(count).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([name, n]) => ({ name, percent: Math.round((n / total) * 100) }));

  return { totalContributions: cal.totalContributions, days, events, languages };
}

/* ---------- exécution ---------- */
for (const [name, fn] of [["spotify", spotify], ["github", github]]) {
  try {
    const data = await fn();
    if (data) await writeFile(`${OUT}/${name}.json`, JSON.stringify(data));
    console.log(`✔ ${name}`);
  } catch (err) {
    console.error(`✘ ${name}: ${err.message}`);   // on continue : l'autre source reste produite
  }
}
```

### 5.2 `.github/workflows/deploy.yml`

```yaml
name: Build & deploy

on:
  push:
    branches: [main]
  schedule:
    - cron: "*/10 * * * *"     # toutes les 10 minutes (GitHub peut retarder un peu)
  workflow_dispatch:           # lancement manuel

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Générer les données (Spotify + GitHub)
        run: node scripts/update-data.mjs
        env:
          SPOTIFY_CLIENT_ID: ${{ secrets.SPOTIFY_CLIENT_ID }}
          SPOTIFY_CLIENT_SECRET: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
          SPOTIFY_REFRESH_TOKEN: ${{ secrets.SPOTIFY_REFRESH_TOKEN }}
          GH_PAT: ${{ secrets.GH_PAT }}
          GH_USER: ${{ github.repository_owner }}

      - name: Assembler le site
        run: cp -r index.html assets _site/

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

      - id: deployment
        uses: actions/deploy-pages@v4
```

Pas de commit automatique : les données sont générées à chaque exécution et publiées directement, donc l'historique du dépôt reste propre.

---

## 6. Mise en ligne sur GitHub Pages

### 6.1 Créer le dépôt

1. Sur GitHub : **New repository**.
   - Nom `ton-user.github.io` → le site sera à `https://ton-user.github.io`.
   - Ou un nom libre (ex. `portfolio`) → le site sera à `https://ton-user.github.io/portfolio/`.
2. Dépôt **public** (requis pour Pages gratuit, et pour que les Actions planifiées soient gratuites en illimité).
3. Structure à pousser :

```
.
├── index.html
├── assets/
│   ├── css/style.css
│   └── js/ (config.js, mock.js, main.js)
├── scripts/
│   └── update-data.mjs
└── .github/
    └── workflows/
        └── deploy.yml
```

4. Pousse sur la branche `main` (commande type) :

```bash
git init
git add .
git commit -m "Portfolio initial"
git branch -M main
git remote add origin https://github.com/TON-USER/NOM-DU-DEPOT.git
git push -u origin main
```

### 6.2 Réglages du dépôt (une seule fois)

1. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. **Settings → Actions → General → Workflow permissions** : « Read repository contents » suffit (le workflow déclare déjà ses permissions).
3. Vérifie que les 4 secrets existent : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `GH_PAT`.

### 6.3 Premier lancement et vérification

1. Onglet **Actions → Build & deploy → Run workflow**.
2. Ouvre l'étape « Générer les données » : tu dois voir `✔ spotify` et `✔ github`.
3. Ouvre ton site, puis `https://TON-SITE/data/spotify.json` : tu dois voir ton dernier titre en JSON.
4. Si une source est en `✘`, lis le message d'erreur (tableau de dépannage ci-dessous).

---

## 7. Adapter le front (✅ déjà fait dans le projet)

Dans le front, il faut :

- passer `useMock` à `false` ;
- remplacer les endpoints par des chemins **relatifs** (sans `/` au début, sinon ça casse sur `ton-user.github.io/portfolio/`) : `data/spotify.json` et `data/github.json` ;
- ajouter `?t=<timestamp>` aux requêtes pour éviter le cache du navigateur ;
- appeler **Open-Meteo** directement depuis la page pour la météo (gratuit, sans clé, sans secret) :
  `https://api.open-meteo.com/v1/forecast?latitude=5.36&longitude=-4.01&current=temperature_2m,weather_code&timezone=Africa%2FAbidjan`
  (coordonnées d'Abidjan ; je convertis `weather_code` en texte : 0 dégagé, 1–2 peu nuageux, 3 couvert, 45–48 brouillard, 51–57 bruine, 61–67 pluie, 80–82 averses, 95–99 orage).

C'est déjà fait dans les fichiers du projet (`assets/js/config.js` et `main.js`). Il te reste à remplacer tes informations dans `config.js`.

---

## 8. Dépannage

| Symptôme                                      | Cause probable                                                                                      | Solution                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `✘ spotify: Spotify token: 400`             | refresh token ou secret invalide                                                                    | refaire l'étape 3.5 et remplacer les secrets                                         |
| `✘ spotify: Spotify token: 401`             | Client ID/Secret erronés                                                                           | recopier depuis le dashboard                                                          |
| `✘ spotify … 403`                          | pas Premium (Development Mode), ou email non ajouté dans *User management*                       | voir 3.2 / 3.4, ou passer à Last.fm (3.7)                                            |
| `currently-playing` renvoie 204              | rien n'est en lecture : normal                                                                      | le script bascule sur le dernier titre écouté                                       |
| `✘ github: GitHub GraphQL: Bad credentials` | `GH_PAT` expiré ou mal copié                                                                    | recréer le token (étape 4)                                                          |
| Le site affiche encore les données d'exemple  | `useMock` encore à `true`, ou chemins `/data/…` absolus                                     | étape 7                                                                              |
| Le site ne s'actualise plus                    | GitHub désactive les workflows planifiés après **60 jours sans activité** dans le dépôt | pousse un petit commit ou réactive dans *Actions* (GitHub t'envoie un email avant) |
| Erreur 404 sur `data/spotify.json`           | première exécution pas encore faite, ou erreur à l'étape « Générer les données »           | relance le workflow et lis les logs                                                   |
| Polices différentes de la maquette            | Switzer n'est pas sur Google Fonts : remplacée par Manrope                                         | normal                                                                                |

---

## 9. Sécurité — à retenir

- Ne **jamais** écrire un secret dans `index.html`, dans un fichier du dépôt, dans un commit, ni dans le chat.
- Si un secret fuite : Spotify → *Settings → Rotate client secret* et révoque l'accès sur `spotify.com/account/apps` ; GitHub → supprime le token sur `github.com/settings/tokens` ; puis mets à jour les secrets du dépôt.
- Le token `GH_PAT` n'a que le scope `read:user` : même volé, il ne peut rien modifier.
- Tout ce qui est dans `_site/` (donc `data/*.json`) est **public**. Ces fichiers ne contiennent que ce que ta page affiche déjà.

---

## 10. Checklist finale

- [ ] Compte Spotify Premium vérifié (sinon : Last.fm)
- [ ] App Spotify créée, Redirect URI `http://127.0.0.1:8888/callback`
- [ ] Refresh token obtenu
- [ ] Token GitHub `read:user` créé
- [ ] 4 secrets ajoutés dans le dépôt
- [ ] `index.html`, `scripts/update-data.mjs`, `.github/workflows/deploy.yml` poussés
- [ ] Pages en mode « GitHub Actions »
- [ ] Workflow lancé à la main : `✔ spotify` et `✔ github`
- [ ] Front adapté (étape 7)
- [ ] Textes, projets, témoignages, liens remplacés par les vrais
