/* =====================================================================
   CONFIG — tout ce qu'il faut modifier est ici
   ===================================================================== */
const CONFIG = {
  name: "Kouadio Ketsia",
  role: "DéveloppeuseFull-Stack",
  location: "Grand-Bassam, CI",
  timezone: "Africa/Abidjan",
  githubUser: "itsketii",
  email: "ketsia.kouadio@iit.ci",
  linkedinUrl: "https://www.linkedin.com/in/ketsia-marie-aude-kouadio-75bb42415/",
  spotifyProfileUrl: "https://open.spotify.com/user/31vzizvh2i5xak4ngcbkct7t4ime?si=e7b8787a9ac94f00",

  coords: { lat: 5.212884, lon: -3.743226 }, // Grand-Bassam

  /* Données simulées si le fichier est ouvert directement (file://), vraies données une fois en ligne.
     Pour forcer : true = toujours simulées, false = toujours réelles. */
  useMock: false,

  /* Fichiers générés par la GitHub Action (chemins RELATIFS, sans « / » au début) */
  data: {
    spotify: "data/spotify.json", // { isPlaying, title, artist, album, coverUrl, url, playedAt }
    github: "data/github.json", // { totalContributions, days:[{date,count}], events:[{type,repo,message,at}], languages:[{name,percent}] }
  },
  /* URL de ton Cloudflare Worker (temps réel). Laisse "" tant qu'il n'est pas créé :
     le site utilisera alors data/spotify.json (mis à jour seulement quand le workflow tourne). */
  spotifyApi: "https://spotify-last-played.ketsia-kouadio.workers.dev",
  pollSpotifyMs: 30000,
  pollGithubMs: 600000,
};

const PROJECTS = [
  { name: "Outil de web scraping", meta: "Python · SQLite", url: "#https://github.com/itsketii/Projet-1-WEB-SCRAPING" },
  { name: "Application décisionnelle d'analyse comparative", meta: "Python", url: "#https://github.com/itsketii/Projet-2-ANALYSE-COMPARATIVE" },
  { name: "Application bureau de gestion universitaire", meta: "C# · SQL Server · Windows form", url: "#https://github.com/itsketii/GestionUniversite" },
  { name: "Application bureau de gestion de tresorerie", meta: "C# · MySQL · Windows form", url: "#" },
  { name: "Blog : IIT Underground", meta: "Python · JS · CSS · HTML5", url: "https://github.com/itsketii/mini-application-django" },
  { name: "Application mobile : Orient CI", meta: "Flutter · Dart · FireBase · JS", url: "https://github.com/itsketii/OrientCI" },
  { name: " Mini-Bibliothèque", meta: "Python · JS · CSS · HTML5", url: "#https://github.com/itsketii/mini-bibliotheque" },
];

const TESTIMONIALS = [
  {
    text: "Ketsia est l'une des meilleures développeuses avec qui j'ai travaillé. Elle livre des projets propres, bien structurés, et sait expliquer ses choix techniques à des profils non techniques. Elle pose les bonnes questions avant d'écrire la première ligne de code.",
    name: "Prénom Nom",
    role: "Responsable produit",
    brand: "ENTREPRISE_",
  },
  {
    text: "Calme sous pression, rigoureux, et toujours attentif à l'expérience des utilisateurs finaux. Chaque revue de code avec lui nous a fait progresser en tant qu'équipe.",
    name: "Prénom Nom",
    role: "Lead développeur",
    brand: "STUDIO·X",
  },
  {
    text: "Il a repris un projet complexe et en a fait quelque chose de simple et de fiable en quelques semaines. Une collaboration fluide du début à la fin, que je recommande sans hésiter.",
    name: "Prénom Nom",
    role: "Directrice technique",
    brand: "Acme",
  },
  {
    text: "Autonome, curieuse et très à l'écoute. Elle a une vraie capacité à transformer une idée floue en une application qui fonctionne et que les gens aiment utiliser.",
    name: "Prénom Nom",
    role: "Fondateur",
    brand: "Nova",
  },
];
