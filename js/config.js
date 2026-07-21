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
//  Le PRÉFIXE décide de la durée d'abonnement du coach :
//    MS-M-xxxx = 1 mois  |  MS-A-xxxx = 1 an  |  MS-V-xxxx = à vie
//  Tu donnes UN code au coach selon la formule qu'il a payée (vérifiée WhatsApp).
//  Une fois utilisé, le code est "brûlé" et ne remarche plus (même ailleurs).
const ACTIVATION_CODES = [
  // MENSUEL (1 mois) — 40 codes
  "MS-M-JTFL", "MS-M-9BQL", "MS-M-4VA2", "MS-M-CSCK", "MS-M-Z96Q",
  "MS-M-M7YC", "MS-M-LRH9", "MS-M-2STJ", "MS-M-B776", "MS-M-MRGK",
  "MS-M-TGCY", "MS-M-DLJQ", "MS-M-SPE6", "MS-M-RXT5", "MS-M-RW36",
  "MS-M-T495", "MS-M-H667", "MS-M-R3EH", "MS-M-HVGH", "MS-M-7GDG",
  "MS-M-BP5J", "MS-M-5JZC", "MS-M-GM8R", "MS-M-SCSN", "MS-M-PGB3",
  "MS-M-BVA2", "MS-M-LNUL", "MS-M-KJ8B", "MS-M-WU4N", "MS-M-N5VJ",
  "MS-M-ZXR5", "MS-M-DXYQ", "MS-M-3RPP", "MS-M-HHVR", "MS-M-2GQ2",
  "MS-M-BJCA", "MS-M-R59G", "MS-M-SNQC", "MS-M-9YMP", "MS-M-GLQZ",
  // ANNUEL (1 an) — 30 codes
  "MS-A-Y5BC", "MS-A-EKJA", "MS-A-NQCU", "MS-A-ZXDC", "MS-A-96PY",
  "MS-A-CT5F", "MS-A-MA9Y", "MS-A-S58P", "MS-A-Z6NL", "MS-A-JWN9",
  "MS-A-76F4", "MS-A-5YEJ", "MS-A-GMXW", "MS-A-CMQ7", "MS-A-MQE4",
  "MS-A-9HS7", "MS-A-TWEB", "MS-A-8VFX", "MS-A-BP74", "MS-A-P7QD",
  "MS-A-VV4V", "MS-A-L9PK", "MS-A-2FLB", "MS-A-28LS", "MS-A-V7VV",
  "MS-A-VHTR", "MS-A-YS8A", "MS-A-98JC", "MS-A-GGS3", "MS-A-XFDN",
  // A VIE (illimité) — 30 codes
  "MS-V-EBLV", "MS-V-2ZA7", "MS-V-L22Y", "MS-V-3TE8", "MS-V-Q4NL",
  "MS-V-4YWF", "MS-V-DF5H", "MS-V-A9GQ", "MS-V-FRBC", "MS-V-78CK",
  "MS-V-DEUX", "MS-V-YHK8", "MS-V-PA3U", "MS-V-CMTD", "MS-V-HQ2N",
  "MS-V-Q7N8", "MS-V-S7Q9", "MS-V-HUS4", "MS-V-DMRA", "MS-V-TJJX",
  "MS-V-VZN8", "MS-V-AURZ", "MS-V-QR3Q", "MS-V-FMWZ", "MS-V-LTR9",
  "MS-V-4JRC", "MS-V-QQ82", "MS-V-R7YC", "MS-V-3B2S", "MS-V-9Y7A",
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
