// ============================================================
//  MA SALLE — COUCHE DE DONNÉES
//  Utilise Supabase si configuré, sinon un "mode démo" local
//  (les données restent dans ce navigateur).
// ============================================================

let sb = null;
if (SUPABASE_READY && window.supabase) {
  sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}
const MODE_DEMO = !sb;

// ------------------------------------------------------------
//  OUTILS DATES
// ------------------------------------------------------------
function ajouterJours(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}
function joursRestants(dateFin) {
  const diff = new Date(dateFin) - new Date(aujourdhui());
  return Math.round(diff / 86400000);
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ------------------------------------------------------------
//  LOGIQUE DE L'ABONNEMENT + FIDÉLITÉ
//  6 mois consécutifs → +15 jours offerts sur le 7e mois.
// ------------------------------------------------------------
function calculerRenouvellement(athlete, datePaiement) {
  const R = REGLES;
  let consecutif = true;

  if (athlete && athlete.date_prochain_paiement) {
    const limite = ajouterJours(athlete.date_prochain_paiement, R.graceJours);
    consecutif = datePaiement <= limite; // renouvelé à temps ?
  }

  const mois = consecutif ? (athlete?.mois_consecutifs || 0) + 1 : 1;

  // Bonus au 7e, 13e, 19e... mois (après chaque cycle de 6 mois)
  const bonus = mois > R.cycleBonus && (mois - 1) % R.cycleBonus === 0;
  const jours = R.dureeJours + (bonus ? R.bonusJours : 0);

  return {
    date_paiement: datePaiement,
    date_prochain_paiement: ajouterJours(datePaiement, jours),
    mois_consecutifs: mois,
    bonus_actif: bonus,
    jours_ajoutes: jours,
  };
}

// Combien de mois avant le prochain bonus
function moisAvantBonus(mois) {
  const reste = REGLES.cycleBonus - (mois % REGLES.cycleBonus);
  return reste === 0 ? REGLES.cycleBonus : reste;
}

// ------------------------------------------------------------
//  STOCKAGE LOCAL (mode démo)
// ------------------------------------------------------------
const LS = {
  get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
};
const KEY_SESSION = "masalle_session";
const KEY_COACHES = "masalle_coaches";
const KEY_ATHLETES = "masalle_athletes";
const KEY_PAIEMENTS = "masalle_paiements";
const KEY_PRIX = "masalle_prix";

function uid() { return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

// ------------------------------------------------------------
//  RÉGLAGES LOCAUX (prix de l'abonnement mensuel par coach)
//  Gardé côté navigateur pour ne pas dépendre du schéma Supabase.
// ------------------------------------------------------------
const Settings = {
  getPrix(coachId) {
    const all = LS.get(KEY_PRIX, {});
    const v = all[coachId];
    return (typeof v === "number" && v > 0) ? v : 1500; // prix par défaut (DA)
  },
  setPrix(coachId, val) {
    const all = LS.get(KEY_PRIX, {});
    all[coachId] = parseInt(val) || 0;
    LS.set(KEY_PRIX, all);
  },
};

// ------------------------------------------------------------
//  ESSAI GRATUIT + ACTIVATION (72h puis blocage si non payé)
//  Stocké par coach dans le navigateur : { debut, actif }.
// ------------------------------------------------------------
const KEY_ESSAI = "masalle_essai";
const KEY_CODES = "masalle_codes_utilises";
const Abonnement = {
  _all() { return LS.get(KEY_ESSAI, {}); },
  // Démarre l'essai la 1re fois (idempotent : ne réinitialise jamais).
  start(coachId) {
    const all = this._all();
    if (!all[coachId]) {
      all[coachId] = { debut: new Date().toISOString(), actif: false };
      LS.set(KEY_ESSAI, all);
    }
    return all[coachId];
  },
  get(coachId) { return this._all()[coachId] || null; },

  // Nombre de jours d'abonnement selon le plan (null = à vie / illimité).
  dureePlan(plan) {
    if (plan === "mensuel") return 30;
    if (plan === "annuel") return 365;
    return null; // avie
  },
  // Déduit le plan à partir du préfixe du code.
  planDuCode(code) {
    const c = (code || "").toUpperCase();
    if (c.startsWith("MS-M-")) return "mensuel";
    if (c.startsWith("MS-A-")) return "annuel";
    if (c.startsWith("MS-V-")) return "avie";
    return null;
  },

  // Active l'abonnement du coach avec une date d'expiration selon le plan.
  activer(coachId, plan = "avie") {
    const all = this._all();
    const duree = this.dureePlan(plan);
    const now = Date.now();
    all[coachId] = {
      debut: all[coachId]?.debut || new Date().toISOString(),
      actif: true,
      plan,
      activeLe: new Date(now).toISOString(),
      expireLe: duree ? new Date(now + duree * 86400000).toISOString() : null,
    };
    LS.set(KEY_ESSAI, all);
  },

  // Abonnement actuellement valide ? (à vie = toujours ; sinon avant expiration)
  estActif(coachId) {
    const i = this.get(coachId);
    if (!i?.actif) return false;
    if (!i.expireLe) return true;
    return Date.now() < new Date(i.expireLe).getTime();
  },
  // ms avant expiration de l'abonnement payant (null si à vie ou pas d'abo).
  msAvantExpiration(coachId) {
    const i = this.get(coachId);
    if (!i?.actif || !i.expireLe) return null;
    return new Date(i.expireLe).getTime() - Date.now();
  },

  // --- Essai gratuit (avant tout abonnement) ---
  finTimestamp(coachId) {
    const info = this.get(coachId);
    if (!info) return null;
    return new Date(info.debut).getTime() + ESSAI_HEURES * 3600 * 1000;
  },
  msRestant(coachId) {
    const fin = this.finTimestamp(coachId);
    return fin == null ? null : fin - Date.now();
  },

  // Compte bloqué ? (abo expiré, ou essai terminé sans abonnement)
  estBloque(coachId) {
    const i = this.get(coachId);
    if (i?.actif) {
      if (!i.expireLe) return false;                 // à vie
      return Date.now() >= new Date(i.expireLe).getTime(); // abo expiré
    }
    const ms = this.msRestant(coachId);              // essai
    return ms != null && ms <= 0;
  },

  // Tente d'utiliser un code d'activation (USAGE UNIQUE).
  //  Retour : { ok:true, plan } | { ok:false, raison:"invalide"|"deja" }
  async utiliserCode(coachId, codeRaw) {
    const code = (codeRaw || "").trim().toUpperCase();
    const pool = ACTIVATION_CODES.map((c) => c.trim().toUpperCase());
    const plan = this.planDuCode(code);
    if (!pool.includes(code) || !plan) return { ok: false, raison: "invalide" };

    // 1) Supabase : usage unique GLOBAL (une ligne = un code brûlé)
    if (sb) {
      try {
        const { error } = await sb.from("codes_utilises").insert({ code, coach_id: coachId });
        if (!error) { this.activer(coachId, plan); return { ok: true, plan }; }
        if (error.code === "23505") return { ok: false, raison: "deja" }; // clé déjà présente
        // table absente / autre erreur → on retombe sur le repli local
      } catch (e) { /* repli local */ }
    }

    // 2) Repli local (mode démo ou Supabase indisponible)
    const used = LS.get(KEY_CODES, {});
    if (used[code]) return { ok: false, raison: "deja" };
    used[code] = { coach_id: coachId, le: new Date().toISOString() };
    LS.set(KEY_CODES, used);
    this.activer(coachId, plan);
    return { ok: true, plan };
  },
};

// ------------------------------------------------------------
//  HISTORIQUE DES PAIEMENTS (miroir local, marche dans les 2 modes)
// ------------------------------------------------------------
const Paiements = {
  _log(coachId, rec) {
    const all = LS.get(KEY_PAIEMENTS, {});
    all[coachId] = all[coachId] || [];
    all[coachId].unshift({ id: uid(), ...rec });
    LS.set(KEY_PAIEMENTS, all);
  },
  list(coachId) {
    const all = LS.get(KEY_PAIEMENTS, {});
    return (all[coachId] || []).slice().sort((a, b) =>
      (b.date_paiement || "").localeCompare(a.date_paiement || ""));
  },
};

// ============================================================
//  AUTHENTIFICATION
// ============================================================
const Auth = {
  async user() {
    if (MODE_DEMO) return LS.get(KEY_SESSION, null);
    const { data } = await sb.auth.getUser();
    return data.user;
  },

  async signInGoogle() {
    if (MODE_DEMO) {
      throw new Error("La connexion Google nécessite Supabase. Configure-le (voir README) ou utilise le mode démo ci-dessous.");
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href.split("#")[0] },
    });
    if (error) throw error;
  },

  async signUpEmail(email, password) {
    if (MODE_DEMO) return Auth._demoLogin(email);
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.href.split("#")[0] },
    });
    if (error) throw error;
    return data;
  },

  async signInEmail(email, password) {
    if (MODE_DEMO) return Auth._demoLogin(email);
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Connexion factice pour le mode démo
  _demoLogin(email) {
    const session = { id: "demo-" + btoa(email).slice(0, 12), email, demo: true };
    LS.set(KEY_SESSION, session);
    return { user: session };
  },

  async signOut() {
    if (MODE_DEMO) { localStorage.removeItem(KEY_SESSION); return; }
    await sb.auth.signOut();
  },
};

// ============================================================
//  PROFIL DU COACH
// ============================================================
const Profile = {
  async get(userId) {
    if (MODE_DEMO) {
      const coaches = LS.get(KEY_COACHES, {});
      return coaches[userId] || null;
    }
    const { data, error } = await sb.from("coaches").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async save(userId, infos) {
    if (MODE_DEMO) {
      const coaches = LS.get(KEY_COACHES, {});
      coaches[userId] = { id: userId, ...(coaches[userId] || {}), ...infos, profil_complet: true };
      LS.set(KEY_COACHES, coaches);
      return coaches[userId];
    }
    const payload = { id: userId, ...infos, profil_complet: true };
    const { data, error } = await sb.from("coaches").upsert(payload).select().single();
    if (error) throw error;
    return data;
  },
};

// ============================================================
//  ATHLÈTES
// ============================================================
const Athletes = {
  async list(coachId) {
    if (MODE_DEMO) {
      const all = LS.get(KEY_ATHLETES, {});
      return (all[coachId] || []).slice().sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
    }
    const { data, error } = await sb.from("athletes").select("*").eq("coach_id", coachId).order("nom");
    if (error) throw error;
    return data;
  },

  async add(coachId, infos) {
    // jours_ajoutes sert seulement à l'affichage → pas une colonne en base
    const { jours_ajoutes, ...calc } = calculerRenouvellement(null, infos.date_paiement || aujourdhui());
    const athlete = {
      coach_id: coachId,
      nom: infos.nom, prenom: infos.prenom,
      telephone: infos.telephone || null,
      photo_url: infos.photo_url || null,
      ...calc,
    };
    let created;
    if (MODE_DEMO) {
      const all = LS.get(KEY_ATHLETES, {});
      all[coachId] = all[coachId] || [];
      athlete.id = uid();
      athlete.cree_le = new Date().toISOString();
      all[coachId].push(athlete);
      LS.set(KEY_ATHLETES, all);
      created = athlete;
    } else {
      const { data, error } = await sb.from("athletes").insert(athlete).select().single();
      if (error) throw error;
      created = data;
    }
    // Journalise le 1er paiement (inscription)
    Paiements._log(coachId, {
      athlete_id: created.id,
      athlete_nom: `${infos.nom} ${infos.prenom}`,
      date_paiement: calc.date_paiement,
      date_fin: calc.date_prochain_paiement,
      montant: Settings.getPrix(coachId),
      mois_consecutifs: calc.mois_consecutifs,
      bonus_applique: !!calc.bonus_actif,
    });
    return created;
  },

  async update(coachId, id, infos) {
    if (MODE_DEMO) {
      const all = LS.get(KEY_ATHLETES, {});
      const arr = all[coachId] || [];
      const i = arr.findIndex((a) => a.id === id);
      if (i >= 0) { arr[i] = { ...arr[i], ...infos }; LS.set(KEY_ATHLETES, all); return arr[i]; }
      return null;
    }
    const { data, error } = await sb.from("athletes").update(infos).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(coachId, id) {
    if (MODE_DEMO) {
      const all = LS.get(KEY_ATHLETES, {});
      all[coachId] = (all[coachId] || []).filter((a) => a.id !== id);
      LS.set(KEY_ATHLETES, all);
      return;
    }
    const { error } = await sb.from("athletes").delete().eq("id", id);
    if (error) throw error;
  },

  // Enregistre un nouveau paiement (renouvellement) et applique la fidélité
  async recordPayment(coachId, athlete, datePaiement) {
    const calc = calculerRenouvellement(athlete, datePaiement);
    // on ne sauvegarde pas jours_ajoutes (pas une colonne en base)
    const { jours_ajoutes, ...calcDb } = calc;
    await this.update(coachId, athlete.id, calcDb);

    if (!MODE_DEMO) {
      await sb.from("paiements").insert({
        athlete_id: athlete.id, coach_id: coachId,
        date_paiement: calc.date_paiement, date_fin: calc.date_prochain_paiement,
        mois_consecutifs: calc.mois_consecutifs, bonus_applique: calc.bonus_actif,
      });
    }
    // Miroir local pour la page Paiements (les 2 modes)
    Paiements._log(coachId, {
      athlete_id: athlete.id,
      athlete_nom: `${athlete.nom} ${athlete.prenom}`,
      date_paiement: calc.date_paiement,
      date_fin: calc.date_prochain_paiement,
      montant: Settings.getPrix(coachId),
      mois_consecutifs: calc.mois_consecutifs,
      bonus_applique: !!calc.bonus_actif,
    });
    return calc;
  },
};

// ============================================================
//  PHOTOS
// ============================================================
const Photos = {
  // Retourne une URL utilisable (upload Supabase, sinon data-URL locale)
  async upload(file, dossier) {
    if (!file) return null;
    if (MODE_DEMO || !sb) return await this._toDataURL(file);
    try {
      const nom = `${dossier}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await sb.storage.from("photos").upload(nom, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from("photos").getPublicUrl(nom);
      return data.publicUrl;
    } catch (e) {
      console.warn("Upload cloud échoué, photo gardée en local :", e.message);
      return await this._toDataURL(file);
    }
  },
  _toDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  },
};
