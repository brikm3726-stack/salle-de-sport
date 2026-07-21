// ============================================================
//  MA SALLE — CONFIGURATION
// ============================================================
//  Pour activer les VRAIS comptes (Google Gmail + sauvegarde
//  dans le cloud), suis le fichier README.md.
//
//  1. Va sur https://supabase.com  → crée un compte gratuit
//  2. Crée un nouveau projet (New project)
//  3. Menu "Project Settings" → "API"
//  4. Colle l'URL et la clé "anon public" ci-dessous
//
//  TANT QUE tu ne fais pas ça, le site marche quand même en
//  "MODE DÉMO" : les données sont gardées dans ce navigateur.
// ------------------------------------------------------------

const SUPABASE_CONFIG = {
  url: "https://maorlngzpldhzssoujqu.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hb3Jsbmd6cGxkaHpzc291anF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjMxOTMsImV4cCI6MjEwMDEzOTE5M30.Z93FHGeeWL0w8CJ0BAcMQLFF_-Jp5Wxjpl6QxgYvEDw",
};

// ---- Numéro WhatsApp qui reçoit les preuves de paiement ----
//  Format international SANS le "+" ni espaces (ex : 213792779320).
const WHATSAPP_PREUVE = "213792779320";

// ---- Essai gratuit + activation ----
//  Durée de l'essai gratuit (en heures) après l'inscription.
const ESSAI_HEURES = 72;

//  POOL DE CODES D'ACTIVATION — chaque code ne marche QU'UNE SEULE FOIS.
//  Tu donnes UN code à chaque coach qui a payé (vérifié via WhatsApp).
//  Une fois utilisé, le code est "brûlé" et ne remarche plus (même ailleurs).
//  Ajoute-en autant que tu veux (garde cette liste confidentielle).
const ACTIVATION_CODES = [
  "MS-2RP9F", "MS-3B5P7", "MS-2MKSR", "MS-4VFG4", "MS-MTQRB",
  "MS-9BXAW", "MS-2EMLL", "MS-3PV9G", "MS-LZ9KF", "MS-TJZPP",
  "MS-C967P", "MS-SRQPC", "MS-5UQ3Q", "MS-TEC52", "MS-Q8TC9",
  "MS-DXQZW", "MS-8VBUV", "MS-3GKAR", "MS-TLKAR", "MS-R6FQM",
  "MS-QBWRR", "MS-HYV93", "MS-ASDMH", "MS-W8ZFY", "MS-RSEGB",
  "MS-9JYQB", "MS-GXSEJ", "MS-Q3HSA", "MS-SCRDX", "MS-695Q8",
  "MS-GNDWL", "MS-HE4HC", "MS-U4PCE", "MS-PSZ85", "MS-533S3",
  "MS-B4WFA", "MS-V3QKD", "MS-3Y5VE", "MS-443FH", "MS-KCH36",
  "MS-C2SKM", "MS-4UXED", "MS-DSPDT", "MS-JBM5G", "MS-PWGQE",
  "MS-EUR7Y", "MS-Q7NTR", "MS-XNPJG", "MS-UPVGD", "MS-QNZ6G",
  "MS-FK8JL", "MS-39RA5", "MS-Y98TY", "MS-AJJ3Z", "MS-K7ZM7",
  "MS-F6U2Z", "MS-Q9DJS", "MS-A3MZY", "MS-CK2AB", "MS-WMELL",
  "MS-VHRLR", "MS-V5CNL", "MS-RLKF7", "MS-YGPRD", "MS-H44FE",
  "MS-BX5V7", "MS-KXAT3", "MS-XCFT6", "MS-M82DH", "MS-527UB",
  "MS-Q3VDA", "MS-QL576", "MS-TN2XZ", "MS-EGYDW", "MS-PP8XU",
  "MS-XQV26", "MS-UQUW9", "MS-K5XGC", "MS-NR929", "MS-BK3X6",
  "MS-Q2KQQ", "MS-Y5NQ4", "MS-R2R3Y", "MS-XZNWF", "MS-GZA3H",
  "MS-XWKHN", "MS-RYKX7", "MS-KXS4B", "MS-WP6AB", "MS-DN297",
  "MS-Q7NUR", "MS-2L3XN", "MS-6UWNY", "MS-N3Y26", "MS-QYYXV",
  "MS-VUHN4", "MS-66S9V", "MS-U3GRL", "MS-N6NKV", "MS-UEAPJ",
];

// ---- Réglages de l'abonnement ----
const REGLES = {
  dureeJours: 30,   // durée d'un abonnement (1 mois)
  bonusJours: 15,   // bonus offert
  cycleBonus: 6,    // après 6 mois consécutifs → bonus sur le 7e
  graceJours: 7,    // marge de retard tolérée pour rester "consécutif"
};

// Ne touche pas à cette ligne :
const SUPABASE_READY =
  SUPABASE_CONFIG.url.startsWith("https://") &&
  !SUPABASE_CONFIG.url.includes("VOTRE-PROJET") &&
  !SUPABASE_CONFIG.anonKey.includes("VOTRE_CLE");
