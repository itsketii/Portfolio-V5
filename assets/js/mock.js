/* ---- données simulées (remplacées par ton back-end plus tard) ---- */
const MOCK_TRACKS = [
  {
    title: "Midnight Drive",
    artist: "Neon Harbor",
    album: "After Hours",
    hue: 8,
  },
  {
    title: "Soft Static",
    artist: "Lune & Co.",
    album: "Paper Moons",
    hue: 200,
  },
  {
    title: "Golden Hour",
    artist: "The Sundays Out",
    album: "Open Windows",
    hue: 38,
  },
  {
    title: "Afrobeat Sunrise",
    artist: "Kofi Wave",
    album: "Abidjan Nights",
    hue: 130,
  },
  {
    title: "Last Train Home",
    artist: "Paper Tigers",
    album: "Quiet Lines",
    hue: 285,
  },
];
let mockIdx = 0;
function mockSpotify() {
  const t = MOCK_TRACKS[mockIdx++ % MOCK_TRACKS.length];
  return {
    ...t,
    isPlaying: mockIdx % 2 === 1,
    coverUrl: null,
    url: "https://open.spotify.com/",
    playedAt: new Date(Date.now() - 12 * 60000).toISOString(),
  };
}
function mockGithub() {
  let s = 20240;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const days = [],
    today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (52 * 7 + today.getDay()));
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const wk = d.getDay() % 6 === 0;
    const r = rnd();
    const burst = Math.sin(d.getTime() / 864e5 / 9) > 0.35 ? 1.8 : 1;
    let c = r < (wk ? 0.62 : 0.25) ? 0 : Math.floor(rnd() * 7 * burst);
    days.push({ date: d.toISOString().slice(0, 10), count: c });
  }
  const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
  return {
    totalContributions: days.reduce((a, b) => a + b.count, 0),
    days,
    events: [
      {
        type: "push",
        repo: "itsketii/portfolio",
        message: "3 commits — ajoute la section GitHub",
        at: ago(2),
      },
      {
        type: "pr",
        repo: "itsketii/carnet-contacts",
        message: "Pull request fusionnée — recherche par nom",
        at: ago(20),
      },
      {
        type: "star",
        repo: "django/django",
        message: "A mis une étoile",
        at: ago(50),
      },
      {
        type: "push",
        repo: "itsketii/boutique",
        message: "1 commit — corrige le calcul du panier",
        at: ago(76),
      },
      {
        type: "branch",
        repo: "itsketii/dashboard-rh",
        message: "Nouvelle branche feature/export-csv",
        at: ago(130),
      },
    ],
    languages: [
      { name: "Python", percent: 46 },
      { name: "JavaScript", percent: 28 },
      { name: "HTML/CSS", percent: 19 },
      { name: "Autre", percent: 7 },
    ],
  };
}
