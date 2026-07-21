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
//    MOIS-xxxx = 1 mois  |  ANNEE-xxxx = 1 an  |  VIE-xxxx = à vie
//  Tu donnes UN code au coach selon la formule qu'il a payée (vérifiée WhatsApp).
//  Une fois utilisé, le code est "brûlé" et ne remarche plus (même ailleurs).
const ACTIVATION_CODES = [
  // MENSUEL (1 mois) — 40 codes
  "MOIS-TA6X", "MOIS-7G8U", "MOIS-VYHL", "MOIS-WMMH", "MOIS-NFFR",
  "MOIS-TETM", "MOIS-U6NC", "MOIS-WT6E", "MOIS-FVYD", "MOIS-2WH9",
  "MOIS-QS23", "MOIS-UWBW", "MOIS-E9H4", "MOIS-DEYL", "MOIS-8R6V",
  "MOIS-775N", "MOIS-5GV5", "MOIS-3VC2", "MOIS-N9NZ", "MOIS-RDY2",
  "MOIS-QTLF", "MOIS-VF7C", "MOIS-9HSH", "MOIS-BP7Z", "MOIS-2PVS",
  "MOIS-MWQU", "MOIS-FRH5", "MOIS-ZGJ3", "MOIS-TNQB", "MOIS-MYTH",
  "MOIS-GSXV", "MOIS-3UYV", "MOIS-4ES8", "MOIS-VHN7", "MOIS-B895",
  "MOIS-P5G2", "MOIS-8EBX", "MOIS-RDH2", "MOIS-YCUB", "MOIS-Y8UY",
  // ANNUEL (1 an) — 30 codes
  "ANNEE-CPSV", "ANNEE-7ZT4", "ANNEE-RA7R", "ANNEE-A3HJ", "ANNEE-SW5V",
  "ANNEE-CZ8A", "ANNEE-DHT6", "ANNEE-Z2KR", "ANNEE-DQ6K", "ANNEE-XQQY",
  "ANNEE-XKKH", "ANNEE-YNKY", "ANNEE-3ZWD", "ANNEE-HRET", "ANNEE-5NX8",
  "ANNEE-HJWU", "ANNEE-VUJD", "ANNEE-C9HT", "ANNEE-F6VX", "ANNEE-KWER",
  "ANNEE-WT44", "ANNEE-2WWD", "ANNEE-VT3H", "ANNEE-ECBP", "ANNEE-GBRR",
  "ANNEE-LAQ7", "ANNEE-LZ3A", "ANNEE-H3LD", "ANNEE-6VHK", "ANNEE-TMQ7",
  // A VIE (illimité) — 30 codes
  "VIE-FUT6", "VIE-VL8M", "VIE-GP73", "VIE-Q7XX", "VIE-NJ37",
  "VIE-UJ73", "VIE-HNQH", "VIE-E3TS", "VIE-HWCR", "VIE-E8D4",
  "VIE-QUP4", "VIE-CMMT", "VIE-PC48", "VIE-5TUN", "VIE-WAPY",
  "VIE-HCT9", "VIE-N9M9", "VIE-FH9F", "VIE-GVSE", "VIE-QVXD",
  "VIE-GCFG", "VIE-3Z82", "VIE-MG3A", "VIE-JZQA", "VIE-75E2",
  "VIE-V6VV", "VIE-VUHS", "VIE-T44D", "VIE-ERJ6", "VIE-RZB8",
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
