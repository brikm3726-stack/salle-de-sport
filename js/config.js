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
  url: "https://VOTRE-PROJET.supabase.co", // ← colle ton "Project URL"
  anonKey: "VOTRE_CLE_ANON_PUBLIC_ICI",    // ← colle ta clé "anon public"
};

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
