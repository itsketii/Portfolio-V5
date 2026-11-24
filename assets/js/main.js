/* =====================================================================
   Utilitaires
   ===================================================================== */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const store = { get(k){ try{return localStorage.getItem(k)}catch(e){return null} }, set(k,v){ try{localStorage.setItem(k,v)}catch(e){} } };
const rel = iso => { const m=Math.round((Date.now()-new Date(iso))/6e4); if(m<1)return "à l'instant"; if(m<60)return `il y a ${m} min`; const h=Math.round(m/60); if(h<24)return `il y a ${h} h`; return `il y a ${Math.round(h/24)} j`; };
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function getJSON(url){ const r = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), {cache:"no-store"}); if(!r.ok) throw new Error(r.status); return r.json(); }

/* =====================================================================
   Réglages (fond, police, effets)
   ===================================================================== */
const COLORS = ["#372067","#1535f0","#0a0a0a","#1b1b1b","#d3111c","#dd8e0a","#22e83a","#22d3c5","#bf00bf"];
const FONTS = [
  ["Inter","'Inter'"],["Geist","'Geist'"],["Manrope","'Manrope'"],
  ["Bricolage","'Bricolage Grotesque'"],["Archivo Narrow","'Archivo Narrow'"],["Inconsolata","'Inconsolata'"]
];
const DEFAULTS = { bg:"#372067", font:"Inter", finish:"flat", container:1, noise:34, fps:18, scan:39, motion:156, borders:45 };
let S = { ...DEFAULTS };

function lum(hex){
  const [r,g,b] = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v<=.03928 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return .2126*r + .7152*g + .0722*b;
}
const set = (k,v) => document.documentElement.style.setProperty(k,v);

function apply(){
  const dark = lum(S.bg) > .4;                       // fond clair -> texte sombre
  set("--bg", S.bg);
  set("--fg", dark ? "#0a0a0a" : "#ffffff");
  set("--line", `color-mix(in srgb, ${dark?"#000":"#fff"} ${Math.round(S.borders*0.55)}%, transparent)`);
  const f = FONTS.find(x => x[0]===S.font) || FONTS[0];
  set("--font", `${f[1]}, system-ui, sans-serif`);
  document.body.dataset.finish = S.finish;
  document.body.dataset.container = S.container;
  const m = S.motion/100;
  set("--dur",   m>0 ? (.9/m).toFixed(2)+"s" : "0s");
  set("--stag",  m>0 ? (.07/m).toFixed(3)+"s" : "0s");
  set("--drift", m>0 ? (30/m).toFixed(1)+"s" : "100000s");
  set("--spin",  m>0 ? (7/m).toFixed(1)+"s"  : "100000s");
  $("#grain").style.opacity = S.noise/100*.6;
  $("#scan").style.opacity  = S.scan/100;
  startGrain();
  // UI
  $$(".sw").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === S.bg)));
  $$("#fonts .opt").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === S.font)));
  $$("#finish .opt").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === S.finish)));
  $$("#container .opt").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === +S.container)));
  const fmt = { noise:v=>v+"%", fps:v=>v+"fps", scan:v=>v+"%", motion:v=>v+"%", borders:v=>v+"%" };
  for (const k of ["noise","fps","scan","motion","borders"]) {
    const el = $("#r-"+k); el.value = S[k]; el.nextElementSibling.textContent = fmt[k](S[k]);
  }
  cacheFg();
}

/* grain animé */
const grain = $("#grain"), gctx = grain.getContext("2d");
grain.width = grain.height = 360;
let grainTimer;
function startGrain(){
  clearInterval(grainTimer);
  if (S.noise === 0) { gctx.clearRect(0,0,360,360); return; }
  const img = gctx.createImageData(360,360), d = img.data;
  const draw = () => { for (let i=0;i<d.length;i+=4){ const v = Math.random()*255|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; } gctx.putImageData(img,0,0); };
  draw(); grainTimer = setInterval(draw, 1000/S.fps);
}

/* nuanciers */
function buildSwatches(box, withPlus){
  box.innerHTML = COLORS.map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-label="Fond ${c}" aria-pressed="false"></button>`).join("");
  if (withPlus) box.insertAdjacentHTML("beforeend", `<label class="plus" title="Couleur personnalisée">+<input type="color" id="custom" value="${S.bg}"></label>`);
}
buildSwatches($("#sws-panel"), true);
buildSwatches($("#sws-card"), false);
$$(".sw").forEach(b => b.addEventListener("click", () => { S.bg = b.dataset.c; apply(); }));
$("#custom").addEventListener("input", e => { S.bg = e.target.value; apply(); });

$("#fonts").innerHTML = FONTS.map(([n,f]) => `<button class="opt" data-v="${n}" style="font-family:${f}" aria-pressed="false">${n}</button>`).join("");
$$("#fonts .opt").forEach(b => b.addEventListener("click", () => { S.font = b.dataset.v; apply(); }));
$$("#finish .opt").forEach(b => b.addEventListener("click", () => { S.finish = b.dataset.v; apply(); }));
$$("#container .opt").forEach(b => b.addEventListener("click", () => { S.container = +b.dataset.v; apply(); }));
for (const k of ["noise","fps","scan","motion","borders"]) $("#r-"+k).addEventListener("input", e => { S[k] = +e.target.value; apply(); });

/* panneau */
const setPanel = open => { document.body.classList.toggle("panel-open", open); $("#toggle").setAttribute("aria-expanded", String(open)); };
$("#toggle").addEventListener("click", e => { e.stopPropagation(); setPanel(!document.body.classList.contains("panel-open")); });
$("#more").addEventListener("click", e => { e.stopPropagation(); setPanel(true); });
document.addEventListener("click", e => { if (!e.target.closest("#panel") && !e.target.closest("#toggle")) setPanel(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape") setPanel(false); });

/* toast */
let toastT;
function toast(msg){ $("#toast-t").textContent = msg; $("#toast").classList.add("show"); clearTimeout(toastT); toastT = setTimeout(()=>$("#toast").classList.remove("show"), 1800); }

/* actions */
$("#b-save").addEventListener("click", () => { store.set("portfolio-settings", JSON.stringify(S)); toast("Réglages enregistrés"); });
$("#b-reset").addEventListener("click", () => { S = { ...DEFAULTS }; apply(); toast("Réglages réinitialisés"); });
$("#b-shuffle").addEventListener("click", () => {
  const pick = a => a[Math.random()*a.length|0];
  S = { bg:pick(COLORS), font:pick(FONTS)[0], finish:pick(["flat","frosted"]), container:pick([0,1,2]),
        noise:Math.random()*60|0, fps:1+Math.random()*20|0, scan:Math.random()*40|0, motion:50+Math.random()*120|0, borders:10+Math.random()*60|0 };
  apply();
});
$("#b-share").addEventListener("click", async () => {
  const url = location.href.split("#")[0] + "#s=" + btoa(JSON.stringify(S));
  try { await navigator.clipboard.writeText(url); toast("Lien copié"); } catch(e){ prompt("Copie ce lien :", url); }
});
(function load(){
  try { const h = location.hash.match(/#s=(.+)/); if (h) { S = { ...DEFAULTS, ...JSON.parse(atob(h[1])) }; return; } } catch(e){}
  try { const v = store.get("portfolio-settings"); if (v) S = { ...DEFAULTS, ...JSON.parse(v) }; } catch(e){}
})();

/* =====================================================================
   Contenu statique
   ===================================================================== */
$("#p-name").textContent = CONFIG.name; $("#p-role").textContent = CONFIG.role;
$("#avatar").textContent = CONFIG.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
$("#loc").textContent = CONFIG.location; $("#yr").textContent = new Date().getFullYear();
$("#gh-link").href = `https://github.com/${CONFIG.githubUser}`;
$("#email-link").href = `mailto:${CONFIG.email}`;
$("#linkedin-link").href = CONFIG.linkedinUrl;

$("#work").innerHTML = PROJECTS.map(p =>
  `<li><span><b>${esc(p.name)}</b>${p.meta?`<small>${esc(p.meta)}</small>`:""}</span>${p.archived?'<span class="arch">Archivé</span>':`<a href="${esc(p.url)}" target="_blank" rel="noopener">Voir le site ↗</a>`}</li>`).join("");

/* témoignages */
let qi = 0;
function showQuote(i){
  const q = TESTIMONIALS[i];
  $("#q-text").textContent = q.text; $("#q-name").textContent = q.name; $("#q-role").textContent = q.role; $("#q-brand").textContent = q.brand;
  $("#q-count").textContent = String(i+1).padStart(2,"0") + " / " + String(TESTIMONIALS.length).padStart(2,"0");
}
function goQuote(d){
  const box = $("#quote"); box.classList.add("out");
  setTimeout(() => { qi = (qi + d + TESTIMONIALS.length) % TESTIMONIALS.length; showQuote(qi); box.classList.remove("out"); }, 300);
}
$("#q-prev").addEventListener("click", () => goQuote(-1));
$("#q-next").addEventListener("click", () => goQuote(1));
showQuote(0);

/* =====================================================================
   Heure + météo
   ===================================================================== */
const fmtTime = new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:CONFIG.timezone});
const tick = () => { $("#clock").textContent = fmtTime.format(new Date()); };
tick(); setInterval(tick, 1000);
function WMO(c){
  if (c === 0) return "Ciel dégagé";
  if (c <= 2)  return "Peu nuageux";
  if (c === 3) return "Couvert";
  if (c <= 48) return "Brouillard";
  if (c <= 57) return "Bruine";
  if (c <= 67) return "Pluie";
  if (c <= 77) return "Neige";
  if (c <= 82) return "Averses";
  return "Orage";
}
async function loadWeather(){
  let w = { temp:29, label:"Partiellement nuageux" };
  if (!CONFIG.useMock) {
    try {   // Open-Meteo : gratuit, sans clé, autorise les appels depuis le navigateur
      const { lat, lon } = CONFIG.coords;
      const j = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(CONFIG.timezone)}`);
      w = { temp: Math.round(j.current.temperature_2m), label: WMO(j.current.weather_code) };
    } catch(e){ $("#wx").textContent = ""; return; }
  }
  $("#wx").textContent = `${w.temp}°C · ${w.label}`;
}

/* =====================================================================
   Spotify — dernier titre écouté
   ===================================================================== */
function coverArt(t){
  if (t.coverUrl) return `<img src="${esc(t.coverUrl)}" alt="">`;
  const h = t.hue ?? 10;
  return `<div style="width:100%;height:100%;background:
    radial-gradient(circle at 30% 75%,hsl(${h+20} 90% 62%) 0 18%,transparent 19%),
    radial-gradient(circle at 70% 70%,hsl(${h} 85% 50%) 0 25%,transparent 26%),
    linear-gradient(170deg,hsl(${h+210} 45% 22%) 0 55%,hsl(${h} 75% 45%) 55%)"></div>`;
}
async function fetchSpotify(){
  if (CONFIG.spotifyApi) { try { return await getJSON(CONFIG.spotifyApi); } catch(e){} }   // temps réel (Worker)
  return getJSON(CONFIG.data.spotify);                                                      // secours : fichier statique
}
async function loadSpotify(){
  let t;
  try { t = CONFIG.useMock ? mockSpotify() : await fetchSpotify(); } catch(e){ t = null; }
  $("#np").href = CONFIG.spotifyProfileUrl;
  if (t?.error) {
    $("#np-title").textContent = "Erreur Spotify";
    $("#np-artist").textContent = t.error;
    $("#np-status").textContent = "Configuration";
    $("#np-dot").classList.add("off");
    return;
  }
  if (!t || !t.title) { $("#np-title").textContent = "Rien d'écouté récemment"; $("#np-artist").innerHTML = "&nbsp;"; return; }
  $("#np-cover").innerHTML = coverArt(t);
  $("#np-title").textContent = t.title; $("#np-artist").textContent = t.artist;
  $("#np-status").textContent = t.isPlaying ? "En écoute" : rel(t.playedAt);
  $("#np-dot").classList.toggle("off", !t.isPlaying);
  $("#np-vinyl").style.setProperty("--vc", `hsl(${t.hue ?? 10} 70% 45%)`);
  $("#np-vinyl").style.animationPlayState = t.isPlaying ? "running" : "paused";
}
loadSpotify(); setInterval(loadSpotify, CONFIG.useMock ? 20000 : CONFIG.pollSpotifyMs);

/* forme d'onde en arrière-plan */
const wave = $("#wave"), wctx = wave.getContext("2d"); let fgCache = "255,255,255";
function cacheFg(){ fgCache = lum(S.bg) > .4 ? "0,0,0" : "255,255,255"; }
function sizeWave(){ const r = wave.getBoundingClientRect(), dpr = Math.min(devicePixelRatio||1,2); wave.width = r.width*dpr; wave.height = r.height*dpr; wctx.setTransform(dpr,0,0,dpr,0,0); }
sizeWave(); addEventListener("resize", sizeWave);
let wt = 0, last = performance.now();
(function frame(now){
  const dt = (now-last)/1000; last = now; wt += dt*(S.motion/100);
  const w = wave.clientWidth, h = wave.clientHeight, n = Math.floor(w/4);
  wctx.clearRect(0,0,w,h); wctx.fillStyle = `rgba(${fgCache},.13)`;
  for (let i=0;i<n;i++){
    const a = Math.abs(Math.sin(i*.31 + wt*2.1) * Math.sin(i*.093 - wt*1.3)) * .6 + Math.abs(Math.sin(i*.9 + wt*3.7))*.22;
    const bh = Math.max(3, a * h*.62);
    wctx.fillRect(i*4, h-bh, 1.4, bh);
  }
  requestAnimationFrame(frame);
})(last);

/* =====================================================================
   GitHub — activité
   ===================================================================== */
const EVENT_ICON = { push:"i-commit", pr:"i-pr", star:"i-star", branch:"i-branch" };
async function loadGithub(){
  let g;
  try { g = CONFIG.useMock ? mockGithub() : await getJSON(CONFIG.data.github); } catch(e){ return; }
  const days = g.days, max = Math.max(1, ...days.map(d=>d.count));
  const lvl = c => c===0 ? 0 : Math.min(4, Math.ceil(c/max*4));
  // décale pour que la 1re colonne commence un dimanche
  const pad = new Date(days[0].date+"T00:00").getDay();
  $("#heat").innerHTML = "<i style='visibility:hidden'></i>".repeat(pad) + days.map(d =>
    `<i data-l="${lvl(d.count)}" title="${d.count} contribution${d.count>1?"s":""} le ${new Date(d.date+"T00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}"></i>`).join("");
  // mois
  const mo = []; let lastM = -1;
  days.forEach((d,i) => { const dt = new Date(d.date+"T00:00"); if (dt.getMonth()!==lastM && dt.getDate()<=7) { lastM = dt.getMonth(); mo.push([Math.floor((i+pad)/7)+1, dt.toLocaleDateString("fr-FR",{month:"short"})]); } });
  $("#months").innerHTML = mo.filter(m=>m[0]<=51).map(([c,l]) => `<span style="grid-column:${c}">${l.replace(".","")}</span>`).join("");
  // stats
  let streak = 0; for (let i=days.length-1;i>=0;i--){ if (days[i].count>0) streak++; else if (i===days.length-1) continue; else break; }
  $("#st-total").textContent  = (g.totalContributions ?? days.reduce((a,b)=>a+b.count,0)).toLocaleString("fr-FR");
  $("#st-streak").textContent = streak + " j";
  $("#st-best").textContent   = max;
  // événements
  $("#events").innerHTML = (g.events||[]).slice(0,5).map(e =>
    `<li><svg class="i"><use href="#${EVENT_ICON[e.type]||"i-commit"}"/></svg><div><b>${esc(e.repo)}</b><span>${esc(e.message)}</span><time>${rel(e.at)}</time></div></li>`).join("");
  // langages
  const L = g.languages || [];
  $("#langs").innerHTML = L.map((l,i) => `<i style="width:${l.percent}%;opacity:${1-i*.22}"></i>`).join("");
  $("#lang-l").innerHTML = L.map((l,i) => `<span style="--o:${1-i*.22}">${esc(l.name)} ${l.percent}%</span>`).join("");
}
loadGithub(); loadWeather();
setInterval(loadGithub, CONFIG.pollGithubMs);

/* =====================================================================
   Apparition (flou -> net) au chargement et au scroll
   ===================================================================== */
apply();
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold:.05 });
$$("[data-r]").forEach(el => io.observe(el));
