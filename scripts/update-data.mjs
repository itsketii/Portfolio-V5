import { mkdir, writeFile } from "node:fs/promises";

const OUT = "_site/data";
await mkdir(OUT, { recursive: true });

/* ---------- Spotify ---------- */
async function spotify() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  const missing = [
    ["SPOTIFY_CLIENT_ID", id],
    ["SPOTIFY_CLIENT_SECRET", secret],
    ["SPOTIFY_REFRESH_TOKEN", refresh],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Spotify secrets missing: ${missing.join(", ")}`);

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
    await writeFile(`${OUT}/${name}.json`, JSON.stringify(data));
    console.log(`✔ ${name}`);
  } catch (err) {
    console.error(`✘ ${name}: ${err.message}`);   // on continue : l'autre source reste produite
    if (name === "spotify") {
      await writeFile(`${OUT}/${name}.json`, JSON.stringify({ error: err.message }));
    }
  }
}
