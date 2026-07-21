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
  "MS-7K2P9", "MS-4X8M3", "MS-9QW5R", "MS-2N6TB", "MS-5HJ7L",
  "MS-8ZP3C", "MS-3RF6V", "MS-6BK9D", "MS-1TY4W", "MS-0LM8S",
  "MS-QX72A", "MS-KP39E", "MS-VT56N", "MS-RB84H", "MS-JD27U",
  "MS-WF63Y", "MS-ZC91G", "MS-NM48K", "MS-HP35Q", "MS-LS70X",
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
