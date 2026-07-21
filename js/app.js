// ============================================================
//  MA SALLE — LOGIQUE DE L'INTERFACE (SaaS premium)
// ============================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let ETAT = {
  user: null, profil: null, athletes: [], paiements: [],
  filtre: "", statut: "tous", tri: "nom",
  photoProfil: null, photoAthlete: null, editId: null,
  payAthlete: null, page: "dash", prix: 1500,
};

// ---------- Icônes SVG ----------
const ICO = {
  users: '<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
  money: '<svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
};

// ---------- Navigation entre les grandes vues ----------
function afficher(vue) {
  $("#view-auth").classList.toggle("hidden", vue !== "auth");
  $("#view-profil").classList.toggle("hidden", vue !== "profil");
  $("#view-dashboard").classList.toggle("hidden", vue !== "dashboard");
  // Le bandeau démo n'apparaît que sur les écrans d'accueil
  $("#demoBar").classList.toggle("hidden", !(MODE_DEMO && (vue === "auth" || vue === "profil")));
}
function message(el, texte, type = "err") { el.className = "msg show " + type; el.innerHTML = texte; }
function cacher(el) { el.className = "msg"; }

// ---------- Notifications toast ----------
function toast(texte, type = "ok") {
  const ic = type === "ok" ? "✅" : type === "err" ? "⚠️" : "ℹ️";
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<div class="ti">${ic}</div><div class="tt">${texte}</div>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 250); }, 3200);
}

// ---------- Formatage ----------
function formatMoney(n) { return (n || 0).toLocaleString("fr-FR") + " DA"; }
function moisKey(d) { return (d || "").slice(0, 7); }
function nomMois(key) {
  const [y, m] = key.split("-");
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}
function dernier6Mois() {
  const out = []; const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

// ============================================================
//  DÉMARRAGE
// ============================================================
async function init() {
  afficherErreurUrl();
  if (sb) sb.auth.onAuthStateChange(() => router());
  await router();
  brancherEvenements();
}

function afficherErreurUrl() {
  const p = new URLSearchParams(
    (location.hash || "").replace(/^#/, "") + "&" + (location.search || "").replace(/^\?/, "")
  );
  const err = p.get("error_description") || p.get("error");
  if (err) {
    afficher("auth");
    message($("#authMsg"), "⚠️ Connexion Google : " + decodeURIComponent(err).replace(/\+/g, " "), "err");
  }
}

async function router() {
  try {
    const user = await Auth.user();
    ETAT.user = user;
    if (!user) { renderTop(); afficher("auth"); return; }

    const profil = await Profile.get(user.id);
    ETAT.profil = profil;

    if (!profil || !profil.profil_complet) {
      renderTop(); prefillProfil(user, profil); afficher("profil"); return;
    }

    ETAT.prix = Settings.getPrix(user.id);
    renderTop();
    afficher("dashboard");
    await chargerAthletes();
  } catch (e) {
    console.error("Erreur router:", e);
    afficher("auth");
    message($("#authMsg"), "⚠️ Erreur : " + (e.message || e), "err");
  }
}

// ---------- Sidebar coach ----------
function renderTop() {
  const zone = $("#sideCoach");
  if (!zone) return;
  if (!ETAT.user || !ETAT.profil?.profil_complet) { zone.innerHTML = ""; return; }
  const p = ETAT.profil;
  const nom = [p.prenom, p.nom].filter(Boolean).join(" ") || ETAT.user.email;
  const av = p.avatar_url
    ? `<img src="${p.avatar_url}" alt="">`
    : `<span class="ph">${(p.prenom || "C")[0].toUpperCase()}</span>`;
  zone.innerHTML = `${av}<div class="who"><b>${nom}</b><small>${p.nom_salle || "Coach"}</small></div>`;
}

// ============================================================
//  ÉCRAN DE CONNEXION
// ============================================================
let modeInscription = false;

function brancherAuth() {
  $("#tabLogin").onclick = () => setAuthTab(false);
  $("#tabSignup").onclick = () => setAuthTab(true);

  $("#btnGoogle").onclick = async () => {
    cacher($("#authMsg"));
    try { await Auth.signInGoogle(); }
    catch (e) { message($("#authMsg"), e.message, "info"); }
  };

  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    cacher($("#authMsg"));
    const email = $("#authEmail").value.trim();
    const pass = $("#authPass").value;
    const btn = $("#authSubmit");
    btn.disabled = true; btn.textContent = "Patiente...";
    try {
      if (modeInscription) {
        await Auth.signUpEmail(email, pass);
        if (MODE_DEMO) { await router(); }
        else message($("#authMsg"),
          "✅ Compte créé ! Un email de confirmation a été envoyé sur " + email + ". Clique sur le lien puis reviens te connecter.", "ok");
      } else {
        await Auth.signInEmail(email, pass);
        await router();
      }
    } catch (err) {
      message($("#authMsg"), traduireErreur(err.message), "err");
    } finally {
      btn.disabled = false;
      btn.textContent = modeInscription ? "Créer mon compte" : "Se connecter";
    }
  };
}

function setAuthTab(inscription) {
  modeInscription = inscription;
  $("#tabLogin").classList.toggle("on", !inscription);
  $("#tabSignup").classList.toggle("on", inscription);
  $("#authSubmit").textContent = inscription ? "Créer mon compte" : "Se connecter";
  cacher($("#authMsg"));
}

function traduireErreur(m = "") {
  if (/Invalid login/i.test(m)) return "Email ou mot de passe incorrect.";
  if (/already registered/i.test(m)) return "Cet email a déjà un compte. Connecte-toi.";
  if (/Email not confirmed/i.test(m)) return "Confirme d'abord ton email (vérifie ta boîte Gmail).";
  return m;
}

// ============================================================
//  ÉCRAN PROFIL
// ============================================================
function prefillProfil(user, profil) {
  if (profil?.prenom) $("#pPrenom").value = profil.prenom;
  if (profil?.nom) $("#pNom").value = profil.nom;
  if (profil?.nom_salle) $("#pSalle").value = profil.nom_salle;
  if (profil?.telephone) $("#pTel").value = profil.telephone;
  if (profil?.avatar_url) setPhotoBox($("#profilPhotoBox"), profil.avatar_url);
  $("#pPrix").value = Settings.getPrix(user.id);
}

function brancherProfil() {
  $("#profilPhoto").onchange = (e) => {
    const f = e.target.files[0]; ETAT.photoProfil = f;
    if (f) setPhotoBox($("#profilPhotoBox"), URL.createObjectURL(f));
  };

  $("#profilForm").onsubmit = async (e) => {
    e.preventDefault();
    cacher($("#profilMsg"));
    const btn = e.submitter; btn.disabled = true; btn.textContent = "Enregistrement...";
    try {
      let avatar = ETAT.profil?.avatar_url || null;
      if (ETAT.photoProfil) avatar = await Photos.upload(ETAT.photoProfil, "coachs");
      await Profile.save(ETAT.user.id, {
        nom: $("#pNom").value.trim(),
        prenom: $("#pPrenom").value.trim(),
        nom_salle: $("#pSalle").value.trim(),
        telephone: $("#pTel").value.trim(),
        avatar_url: avatar,
      });
      const prix = parseInt($("#pPrix").value);
      if (prix > 0) Settings.setPrix(ETAT.user.id, prix);
      await router();
      toast("Bienvenue dans ton espace ! 🚀");
    } catch (err) {
      message($("#profilMsg"), err.message, "err");
    } finally {
      btn.disabled = false; btn.textContent = "Ouvrir mon espace 🚀";
    }
  };
}

function setPhotoBox(box, url) { box.innerHTML = `<img src="${url}" alt="">`; }

// ============================================================
//  CHARGEMENT DES DONNÉES
// ============================================================
function statutAbo(a) {
  const j = joursRestants(a.date_prochain_paiement);
  if (j < 0) return { cls: "exp", txt: "Expiré", jours: j };
  if (j <= 5) return { cls: "warn", txt: `Bientôt (${j}j)`, jours: j };
  return { cls: "ok", txt: `Actif (${j}j)`, jours: j };
}

async function chargerAthletes() {
  $("#listZone").innerHTML = `<div class="skeleton">${"<div class='sk-card'></div>".repeat(6)}</div>`;
  ETAT.athletes = await Athletes.list(ETAT.user.id);
  ETAT.paiements = Paiements.list(ETAT.user.id);
  renderDashboard();
  renderListe();
  renderPayments();
  setPage(ETAT.page);
}

// ============================================================
//  NAVIGATION ENTRE PAGES
// ============================================================
const TITRES = {
  dash: ["Tableau de bord", "Vue d'ensemble de ta salle"],
  athletes: ["Athlètes", "Gère les membres de ta salle"],
  payments: ["Paiements", "Revenus et historique"],
};

function setPage(page) {
  ETAT.page = page;
  ["dash", "athletes", "payments"].forEach((p) =>
    $("#page-" + p).classList.toggle("hidden", p !== page));
  $$("#sideNav .nav-item").forEach((b) => b.classList.toggle("on", b.dataset.page === page));
  $$("#mobileNav .mnav[data-page]").forEach((b) => b.classList.toggle("on", b.dataset.page === page));
  $("#pageTitle").textContent = TITRES[page][0];
  $("#pageSub").textContent = TITRES[page][1];

  // Bouton d'action contextuel (topbar)
  const act = $("#topbarActions");
  if (page === "athletes" || page === "dash") {
    act.innerHTML = `<button class="btn btn-primary" id="btnAdd">＋ Nouvel athlète</button>`;
    $("#btnAdd").onclick = () => ouvrirModale();
  } else {
    act.innerHTML = `<button class="btn btn-ghost" id="btnPrix2">⚙️ Prix mensuel</button>`;
    $("#btnPrix2").onclick = ouvrirPrix;
  }
}

// ============================================================
//  PAGE : TABLEAU DE BORD
// ============================================================
function carteStat(couleur, ico, n, label, small = false) {
  return `<div class="stat c-${couleur}">
    <div class="ico">${ico}</div>
    <div class="n${small ? " small" : ""}">${n}</div>
    <div class="l">${label}</div>
  </div>`;
}

function renderStats() {
  const A = ETAT.athletes;
  const actifs = A.filter((a) => statutAbo(a).cls === "ok").length;
  const bientot = A.filter((a) => statutAbo(a).cls === "warn").length;
  const expires = A.filter((a) => statutAbo(a).cls === "exp").length;
  const moisEnCours = moisKey(aujourdhui());
  const revMois = ETAT.paiements.filter((p) => moisKey(p.date_paiement) === moisEnCours)
    .reduce((s, p) => s + (p.montant || 0), 0);

  $("#stats").innerHTML = `
    ${carteStat("accent", ICO.users, A.length, "Total athlètes")}
    ${carteStat("green", ICO.check, actifs, "Abonnements actifs")}
    ${carteStat("gold", ICO.clock, bientot, "Bientôt expirés")}
    ${carteStat("red", ICO.warn, expires, "Expirés")}
    ${carteStat("blue", ICO.money, formatMoney(revMois), "Revenus du mois", true)}`;
}

function renderDashboard() {
  renderStats();
  renderRevChart("#revChart", "#revTotal");
  renderDonut();
  renderAlertes();
  renderRecents();
}

function revenusParMois() {
  const keys = dernier6Mois();
  const map = {}; keys.forEach((k) => (map[k] = 0));
  ETAT.paiements.forEach((p) => {
    const k = moisKey(p.date_paiement);
    if (k in map) map[k] += p.montant || 0;
  });
  return keys.map((k) => ({ key: k, label: nomMois(k), value: map[k] }));
}

function renderRevChart(sel, totalSel) {
  const data = revenusParMois();
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (totalSel) $(totalSel).textContent = formatMoney(total);
  $(sel).innerHTML = data.map((d) => {
    const h = Math.round((d.value / max) * 100);
    return `<div class="rev-bar">
      <div class="bar" style="height:${d.value ? Math.max(h, 4) : 2}%">
        <span class="val">${formatMoney(d.value)}</span>
      </div>
      <div class="lbl">${d.label}</div>
    </div>`;
  }).join("");
}

function renderDonut() {
  const A = ETAT.athletes;
  const ok = A.filter((a) => statutAbo(a).cls === "ok").length;
  const warn = A.filter((a) => statutAbo(a).cls === "warn").length;
  const exp = A.filter((a) => statutAbo(a).cls === "exp").length;
  const tot = A.length || 1;
  const gOk = "#25d07d", gWarn = "#ffc93c", gExp = "#ff5468";
  const p1 = (ok / tot) * 100, p2 = ((ok + warn) / tot) * 100;
  const grad = A.length
    ? `conic-gradient(${gOk} 0 ${p1}%, ${gWarn} ${p1}% ${p2}%, ${gExp} ${p2}% 100%)`
    : `conic-gradient(var(--line2) 0 100%)`;
  $("#donut").innerHTML = `
    <div class="donut" style="background:${grad}">
      <div class="center"><b>${A.length}</b><small>athlètes</small></div>
    </div>
    <div class="legend">
      <div class="li"><i style="background:${gOk}"></i>Actifs <span>${ok}</span></div>
      <div class="li"><i style="background:${gWarn}"></i>Bientôt <span>${warn}</span></div>
      <div class="li"><i style="background:${gExp}"></i>Expirés <span>${exp}</span></div>
    </div>`;
}

function ligneAlerte(cls, ico, titre, sub) {
  return `<div class="alert-row ${cls}"><div class="ai">${ico}</div>
    <div class="at"><b>${titre}</b><small>${sub}</small></div></div>`;
}

function renderAlertes() {
  const A = ETAT.athletes;
  const expires = A.filter((a) => statutAbo(a).cls === "exp");
  const bientot = A.filter((a) => statutAbo(a).cls === "warn");
  const bonus = A.filter((a) => a.bonus_actif);
  let rows = "";
  if (expires.length)
    rows += ligneAlerte("exp", "🔴", `${expires.length} abonnement(s) expiré(s)`,
      expires.slice(0, 3).map((a) => a.nom + " " + a.prenom).join(", "));
  if (bientot.length)
    rows += ligneAlerte("warn", "⏰", `${bientot.length} expire(nt) bientôt`,
      bientot.slice(0, 3).map((a) => `${a.nom} (${statutAbo(a).jours}j)`).join(", "));
  if (bonus.length)
    rows += ligneAlerte("ok", "🎁", `${bonus.length} athlète(s) en bonus fidélité`,
      bonus.slice(0, 3).map((a) => a.nom + " " + a.prenom).join(", "));
  if (!rows)
    rows = ligneAlerte("ok", "✅", "Tout est en ordre", "Aucune alerte pour le moment.");
  $("#alertsZone").innerHTML = rows;
}

function renderRecents() {
  const recents = [...ETAT.athletes]
    .sort((a, b) => (b.cree_le || "").localeCompare(a.cree_le || "")).slice(0, 5);
  if (!recents.length) {
    $("#recentAthletes").innerHTML = `<p style="color:var(--muted);font-size:13.5px;padding:8px 6px">Aucun athlète pour l'instant.</p>`;
    return;
  }
  $("#recentAthletes").innerHTML = recents.map((a) => {
    const st = statutAbo(a);
    const photo = a.photo_url ? `<img src="${a.photo_url}" alt="">` : `<span class="ph">👤</span>`;
    return `<div class="recent-item">${photo}
      <div class="ri"><b>${a.nom} ${a.prenom}</b><small>${a.telephone || "—"}</small></div>
      <span class="badge ${st.cls}"><span class="dotb"></span>${st.txt}</span></div>`;
  }).join("");
}

// ============================================================
//  PAGE : ATHLÈTES (cartes + recherche/filtre/tri)
// ============================================================
function listeFiltree() {
  const q = ETAT.filtre.toLowerCase();
  let l = ETAT.athletes.filter((a) =>
    (a.nom + " " + a.prenom + " " + (a.telephone || "")).toLowerCase().includes(q));
  if (ETAT.statut !== "tous") l = l.filter((a) => statutAbo(a).cls === ETAT.statut);
  const tri = ETAT.tri;
  l.sort((a, b) => {
    if (tri === "expire") return joursRestants(a.date_prochain_paiement) - joursRestants(b.date_prochain_paiement);
    if (tri === "recent") return (b.cree_le || "").localeCompare(a.cree_le || "");
    if (tri === "fidelite") return (b.mois_consecutifs || 0) - (a.mois_consecutifs || 0);
    return (a.nom || "").localeCompare(b.nom || "");
  });
  return l;
}

function renderListe() {
  const liste = listeFiltree();
  if (!liste.length) {
    const vide = ETAT.athletes.length;
    $("#listZone").innerHTML = `<div class="card empty">
      <div class="em">🏋️</div>
      <p>${vide ? "Aucun athlète ne correspond à ta recherche." : "Aucun athlète pour l'instant. Ajoute ton premier athlète pour démarrer !"}</p>
      ${vide ? "" : `<button class="btn btn-primary" onclick="ouvrirModale()">＋ Ajouter un athlète</button>`}
    </div>`;
    return;
  }

  const cycle = REGLES.cycleBonus;
  const cartes = liste.map((a) => {
    const st = statutAbo(a);
    const photo = a.photo_url ? `<img src="${a.photo_url}" alt="">` : `<span class="ph">👤</span>`;
    const pos = ((a.mois_consecutifs - 1) % cycle) + 1;
    const dots = Array.from({ length: cycle }, (_, i) => `<span class="dot ${i < pos ? "on" : ""}"></span>`).join("");
    const restant = moisAvantBonus(a.mois_consecutifs);
    const bonusBadge = a.bonus_actif ? `<span class="badge bonus">🎁 +${REGLES.bonusJours}j</span>` : "";

    return `<div class="ath-card st-${st.cls}">
      <div class="ath-top">
        ${photo}
        <div class="ath-id">
          <b>${a.nom} ${a.prenom}</b>
          <small>📞 ${a.telephone || "—"}</small>
        </div>
        <span class="badge ${st.cls}"><span class="dotb"></span>${st.txt}</span>
      </div>
      <div class="ath-meta">
        <div class="m"><div class="k">Paiement</div><div class="v">${formatDate(a.date_paiement)}</div></div>
        <div class="m"><div class="k">Expire le</div><div class="v">${formatDate(a.date_prochain_paiement)}</div></div>
      </div>
      <div class="streak">${dots} ${bonusBadge}</div>
      <div class="streak-txt">${a.mois_consecutifs} mois consécutifs • bonus dans ${restant} mois</div>
      <div class="ath-foot">
        <button class="btn btn-primary btn-sm" data-pay="${a.id}">💳 Paiement</button>
        <div class="actions">
          <button class="icon-btn" title="Modifier" data-edit="${a.id}">✏️</button>
          <button class="icon-btn" title="Supprimer" data-del="${a.id}">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join("");

  $("#listZone").innerHTML = `<div class="ath-grid">${cartes}</div>`;
  $$("[data-pay]").forEach((b) => b.onclick = () => ouvrirPaiement(b.dataset.pay));
  $$("[data-edit]").forEach((b) => b.onclick = () => ouvrirModale(b.dataset.edit));
  $$("[data-del]").forEach((b) => b.onclick = () => demanderSuppression(b.dataset.del));
}

// ============================================================
//  PAGE : PAIEMENTS
// ============================================================
function renderPayments() {
  const P = ETAT.paiements;
  const moisEnCours = moisKey(aujourdhui());
  const revTotal = P.reduce((s, p) => s + (p.montant || 0), 0);
  const revMois = P.filter((p) => moisKey(p.date_paiement) === moisEnCours).reduce((s, p) => s + (p.montant || 0), 0);
  const nbMois = P.filter((p) => moisKey(p.date_paiement) === moisEnCours).length;

  $("#payStats").innerHTML = `
    ${carteStat("green", ICO.money, formatMoney(revMois), "Revenus du mois", true)}
    ${carteStat("accent", ICO.money, formatMoney(revTotal), "Revenus total", true)}
    ${carteStat("blue", ICO.check, nbMois, "Paiements ce mois")}`;

  renderRevChart("#payChart", null);

  if (!P.length) {
    $("#payHistory").innerHTML = `<div class="empty" style="padding:40px 20px">
      <div class="em">💳</div><p>Aucun paiement enregistré pour l'instant.</p></div>`;
    return;
  }
  const rows = P.slice(0, 40).map((p) => `
    <div class="pay-row">
      <div class="pay-av">💳</div>
      <div class="pw">
        <b>${p.athlete_nom || "Athlète"}</b>
        <small>${formatDate(p.date_paiement)} • ${p.mois_consecutifs || 1}ᵉ mois${p.bonus_applique ? " • 🎁 bonus" : ""}</small>
      </div>
      <div class="pay-amt">+${formatMoney(p.montant)}<small>jusqu'au ${formatDate(p.date_fin)}</small></div>
    </div>`).join("");
  $("#payHistory").innerHTML = `<div class="pay-list">${rows}</div>`;
}

// ============================================================
//  MODALE AJOUT / MODIFICATION
// ============================================================
function ouvrirModale(id = null) {
  ETAT.editId = id;
  ETAT.photoAthlete = null;
  const f = $("#athleteForm"); f.reset();
  cacher($("#athleteMsg"));
  $("#aPhotoBox").innerHTML = "📷";
  $("#aDate").value = aujourdhui();

  if (id) {
    const a = ETAT.athletes.find((x) => x.id === id);
    $("#modalTitle").textContent = "Modifier l'athlète";
    $("#aNom").value = a.nom; $("#aPrenom").value = a.prenom;
    $("#aTel").value = a.telephone || ""; $("#aDate").value = a.date_paiement;
    if (a.photo_url) setPhotoBox($("#aPhotoBox"), a.photo_url);
  } else {
    $("#modalTitle").textContent = "Nouvel athlète";
  }
  $("#overlay").classList.remove("hidden");
}
function fermerModale() { $("#overlay").classList.add("hidden"); }

function brancherModale() {
  $("#modalClose").onclick = fermerModale;
  $("#overlay").onclick = (e) => { if (e.target.id === "overlay") fermerModale(); };

  $("#aPhoto").onchange = (e) => {
    const f = e.target.files[0]; ETAT.photoAthlete = f;
    if (f) setPhotoBox($("#aPhotoBox"), URL.createObjectURL(f));
  };

  $("#athleteForm").onsubmit = async (e) => {
    e.preventDefault();
    cacher($("#athleteMsg"));
    const btn = $("#athleteSubmit"); btn.disabled = true; btn.textContent = "Enregistrement...";
    try {
      const existant = ETAT.editId ? ETAT.athletes.find((x) => x.id === ETAT.editId) : null;
      let photo = existant?.photo_url || null;
      if (ETAT.photoAthlete) photo = await Photos.upload(ETAT.photoAthlete, "athletes");

      const infos = {
        nom: $("#aNom").value.trim(),
        prenom: $("#aPrenom").value.trim(),
        telephone: $("#aTel").value.trim(),
        photo_url: photo,
        date_paiement: $("#aDate").value,
      };

      if (ETAT.editId) {
        await Athletes.update(ETAT.user.id, ETAT.editId, {
          nom: infos.nom, prenom: infos.prenom, telephone: infos.telephone, photo_url: photo,
        });
        toast("Athlète mis à jour ✅");
      } else {
        await Athletes.add(ETAT.user.id, infos);
        toast("Nouvel athlète ajouté 💪");
      }
      fermerModale();
      await chargerAthletes();
    } catch (err) {
      message($("#athleteMsg"), err.message, "err");
    } finally {
      btn.disabled = false; btn.textContent = "Enregistrer";
    }
  };
}

// ---------- Confirmation de suppression ----------
let suppressionId = null;
function demanderSuppression(id) {
  const a = ETAT.athletes.find((x) => x.id === id);
  suppressionId = id;
  $("#confirmText").innerHTML = `Veux-tu vraiment supprimer <b>${a.nom} ${a.prenom}</b> ? Cette action est définitive.`;
  $("#overlayConfirm").classList.remove("hidden");
}
function brancherConfirm() {
  const fermer = () => $("#overlayConfirm").classList.add("hidden");
  $("#confirmCancel").onclick = fermer;
  $("#overlayConfirm").onclick = (e) => { if (e.target.id === "overlayConfirm") fermer(); };
  $("#confirmOk").onclick = async () => {
    const btn = $("#confirmOk"); btn.disabled = true; btn.textContent = "Suppression...";
    try {
      await Athletes.remove(ETAT.user.id, suppressionId);
      fermer();
      await chargerAthletes();
      toast("Athlète supprimé", "info");
    } catch (err) { toast(err.message, "err"); }
    finally { btn.disabled = false; btn.textContent = "Supprimer"; }
  };
}

// ============================================================
//  MODALE PAIEMENT (renouvellement + fidélité)
// ============================================================
function ouvrirPaiement(id) {
  const a = ETAT.athletes.find((x) => x.id === id);
  ETAT.payAthlete = a;
  $("#payWho").innerHTML = `Athlète : <b>${a.nom} ${a.prenom}</b>`;
  $("#payDate").value = aujourdhui();
  majApercuPaiement();
  $("#overlayPay").classList.remove("hidden");
}
function fermerPaiement() { $("#overlayPay").classList.add("hidden"); }

function majApercuPaiement() {
  const a = ETAT.payAthlete;
  const calc = calculerRenouvellement(a, $("#payDate").value || aujourdhui());
  let txt = `Nouvel abonnement jusqu'au <b>${formatDate(calc.date_prochain_paiement)}</b> `
    + `(${calc.jours_ajoutes} jours) — ${calc.mois_consecutifs}ᵉ mois consécutif.`;
  if (calc.bonus_actif) txt += `<br>🎁 <b>Bonus fidélité : +${REGLES.bonusJours} jours offerts !</b>`;
  $("#payPreview").innerHTML = txt;
  $("#payPreview").className = "msg show " + (calc.bonus_actif ? "ok" : "info");
}

function brancherPaiement() {
  $("#payClose").onclick = fermerPaiement;
  $("#overlayPay").onclick = (e) => { if (e.target.id === "overlayPay") fermerPaiement(); };
  $("#payDate").onchange = majApercuPaiement;
  $("#payConfirm").onclick = async () => {
    const btn = $("#payConfirm"); btn.disabled = true; btn.textContent = "Enregistrement...";
    try {
      const calc = await Athletes.recordPayment(ETAT.user.id, ETAT.payAthlete, $("#payDate").value || aujourdhui());
      fermerPaiement();
      await chargerAthletes();
      toast(calc.bonus_actif ? "Paiement + bonus fidélité 🎁" : "Paiement enregistré 💳");
    } catch (err) {
      toast(err.message, "err");
    } finally {
      btn.disabled = false; btn.textContent = "Confirmer le paiement";
    }
  };
}

// ============================================================
//  MODALE PRIX MENSUEL
// ============================================================
function ouvrirPrix() {
  $("#prixInput").value = Settings.getPrix(ETAT.user.id);
  $("#overlayPrix").classList.remove("hidden");
}
function brancherPrix() {
  const fermer = () => $("#overlayPrix").classList.add("hidden");
  $("#prixClose").onclick = fermer;
  $("#overlayPrix").onclick = (e) => { if (e.target.id === "overlayPrix") fermer(); };
  $("#btnPrix").onclick = ouvrirPrix;
  $("#prixSave").onclick = () => {
    const v = parseInt($("#prixInput").value);
    if (!v || v <= 0) { toast("Entre un prix valide", "err"); return; }
    Settings.setPrix(ETAT.user.id, v);
    ETAT.prix = v;
    fermer();
    renderDashboard();
    renderPayments();
    toast("Prix mensuel mis à jour ⚙️");
  };
}

// ============================================================
//  MODALE ABONNEMENT (le coach paie l'app)
// ============================================================
let planChoisi = "annuel";
let methodeChoisie = "Baridi Mob";

function ouvrirAbonnement() { $("#overlaySub").classList.remove("hidden"); }
function fermerAbonnement() { $("#overlaySub").classList.add("hidden"); }

function brancherAbonnement() {
  $("#subClose").onclick = fermerAbonnement;
  $("#overlaySub").onclick = (e) => { if (e.target.id === "overlaySub") fermerAbonnement(); };

  $$("#overlaySub .plan").forEach((p) => {
    p.onclick = () => {
      planChoisi = p.dataset.plan;
      $$("#overlaySub .plan").forEach((x) => x.classList.toggle("on", x === p));
    };
  });

  $$("#overlaySub .pay-method").forEach((m) => {
    m.onclick = () => {
      methodeChoisie = m.dataset.method;
      $$("#overlaySub .pay-method").forEach((x) => x.classList.toggle("on", x === m));
    };
  });

  $("#copyRip").onclick = async (e) => {
    e.stopPropagation();
    const rip = $("#rip").textContent.trim();
    try { await navigator.clipboard.writeText(rip); } catch {}
    $("#copyRip").textContent = "✅";
    setTimeout(() => ($("#copyRip").textContent = "📋"), 1500);
    toast("RIP copié 📋", "info");
  };

  $("#subConfirm").onclick = () => {
    const prix = planChoisi === "annuel" ? "19000 DA / an" : "1200 DA / mois";
    message($("#subMsg"),
      `✅ Formule ${planChoisi} (${prix}) — paiement par ${methodeChoisie}. Envoie la capture de ton paiement pour activer ton compte.`,
      "ok");
  };
}

// ============================================================
//  BRANCHEMENTS GLOBAUX
// ============================================================
function brancherNav() {
  $$("#sideNav .nav-item").forEach((b) => b.onclick = () => setPage(b.dataset.page));
  $$("#mobileNav .mnav[data-page]").forEach((b) => b.onclick = () => setPage(b.dataset.page));
  $$("[data-goto]").forEach((b) => b.onclick = () => setPage(b.dataset.goto));
  $("#mobAdd").onclick = () => ouvrirModale();
  $("#mobSub").onclick = ouvrirAbonnement;
  $("#btnSub").onclick = ouvrirAbonnement;
  $("#btnLogout").onclick = async () => { await Auth.signOut(); location.reload(); };
}

function brancherEvenements() {
  brancherAuth();
  brancherProfil();
  brancherModale();
  brancherConfirm();
  brancherPaiement();
  brancherPrix();
  brancherAbonnement();
  brancherNav();
  $("#search").oninput = (e) => { ETAT.filtre = e.target.value; renderListe(); };
  $("#sortSelect").onchange = (e) => { ETAT.tri = e.target.value; renderListe(); };
  $$("#filterChips .chip").forEach((c) => c.onclick = () => {
    ETAT.statut = c.dataset.filter;
    $$("#filterChips .chip").forEach((x) => x.classList.toggle("on", x === c));
    renderListe();
  });
}

// GO !
init();
