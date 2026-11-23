/* =====================================================================
   CONFIG — tout ce qu'il faut modifier est ici
   ===================================================================== */
const CONFIG = {
  name: "Kouadio Ketsia",
  role: "DéveloppeuseFull-Stack",
  location: "Abidjan, CI",
  timezone: "Africa/Abidjan",
  githubUser: "itsketii",

  coords: { lat: 5.214247, lon:  -3.780940 }, // pour la météo (Abidjan)

  /* Données simulées si le fichier est ouvert directement (file://), vraies données une fois en ligne.
     Pour forcer : true = toujours simulées, false = toujours réelles. */
  useMock: false,

  /* Fichiers générés par la GitHub Action (chemins RELATIFS, sans « / » au début) */
  data: {
    spotify: "data/spotify.json", // { isPlaying, title, artist, album, coverUrl, url, playedAt }
    github: "data/github.json", // { totalContributions, days:[{date,count}], events:[{type,repo,message,at}], languages:[{name,percent}] }
  },
  pollSpotifyMs: 60000,
};

const PROJECTS = [
  { name: "Carnet de contacts", meta: "Django · SQLite", url: "#" },
  { name: "Boutique en ligne", meta: "Django · Stripe", url: "#" },
  { name: "Tableau de bord RH", meta: "Django REST · Chart.js", url: "#" },
  { name: "Gestion de stock", meta: null, archived: true },
  { name: "Blog personnel", meta: null, archived: true },
  { name: "Application mobile", meta: null, archived: true },
  { name: "Site associatif", meta: null, archived: true },
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
