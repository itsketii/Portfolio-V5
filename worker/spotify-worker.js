/**
 * Cloudflare Worker — « Dernière écoute » Spotify en temps réel.
 * Secrets à définir dans Cloudflare (Settings → Variables and Secrets, type « Secret ») :
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 */
const ALLOWED_ORIGINS = [
  "https://itsketii.github.io",   // ← ton site GitHub Pages (sans « / » final)
  "http://127.0.0.1:8000",        // tests locaux (facultatif)
  "http://localhost:8000",
];
const CACHE_SECONDS = 15;          // évite de saturer l'API Spotify

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "86400" } });
    }

    const cache = caches.default;
    const cacheKey = new Request("https://spotify-cache.internal/last-played");
    let cached = await cache.match(cacheKey);
    if (!cached) {
      let body, status = 200;
      try { body = JSON.stringify(await lastPlayed(env)); }
      catch (e) { body = JSON.stringify({ error: String(e.message || e) }); status = 502; }
      cached = new Response(body, { status, headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${status === 200 ? CACHE_SECONDS : 5}`,
      } });
      ctx.waitUntil(cache.put(cacheKey, cached.clone()));
    }
    return new Response(cached.body, { status: cached.status, headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors,
    } });
  },
};

async function lastPlayed(env) {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = env;
  if (!id || !secret || !refresh) throw new Error("Secrets Spotify manquants dans le Worker");

  const tok = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${id}:${secret}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!tok.ok) throw new Error("Spotify token: " + tok.status);
  const headers = { Authorization: "Bearer " + (await tok.json()).access_token };

  let item = null, isPlaying = false, playedAt = null;
  const cur = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers });
  if (cur.status === 200) {
    const j = await cur.json();
    if (j.item && j.is_playing) { item = j.item; isPlaying = true; playedAt = new Date().toISOString(); }
  }
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
