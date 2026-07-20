// ============================================================
//  MA SALLE — LOGIQUE DE L'INTERFACE
// ============================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let ETAT = { user: null, profil: null, athletes: [], filtre: "", photoProfil: null, photoAthlete: null, editId: null, payAthlete: null };

// ---------- Navigation entre les vues ----------
function afficher(vue) {
  ["auth", "profil", "dashboard"].forEach((v) =>
    $("#view-" + v).classList.toggle("hidden", v !== vue)
  );
}
function message(el, texte, type = "err") {
  el.className = "msg show " + type;
  el.textContent = texte;
}
function cacher(el) { el.className = "msg"; }

// ============================================================
//  DÉMARRAGE
// ============================================================
async function init() {
  if (MODE_DEMO) $("#demoBar").classList.remove("hidden");

  // Après un retour de connexion Google, Supabase place la session dans l'URL
  if (sb) {
    sb.auth.onAuthStateChange(() => router());
  }
  await router();
  brancherEvenements();
}

// Décide quelle vue montrer selon l'état de connexion
async function router() {
  const user = await Auth.user();
  ETAT.user = user;

  if (!user) { renderTop(); afficher("auth"); return; }

  const profil = await Profile.get(user.id);
  ETAT.profil = profil;

  if (!profil || !profil.profil_complet) {
    renderTop();
    prefillProfil(user, profil);
    afficher("profil");
    return;
  }

  renderTop();
  await chargerAthletes();
  afficher("dashboard");
}

// ---------- Barre du haut (coach connecté) ----------
function renderTop() {
  const zone = $("#topRight");
  if (!ETAT.user || !ETAT.profil?.profil_complet) { zone.innerHTML = ""; return; }
  const p = ETAT.profil;
  const nom = [p.prenom, p.nom].filter(Boolean).join(" ") || ETAT.user.email;
  const av = p.avatar_url
    ? `<img src="${p.avatar_url}" alt="">`
    : `<span class="ph">${(p.prenom || "C")[0].toUpperCase()}</span>`;
  zone.innerHTML = `
    <button class="btn btn-sub btn-sm" id="btnSub">⭐ Abonnement</button>
    <div class="coach-chip">${av}<span>${nom}</span></div>
    <button class="btn btn-ghost btn-sm" id="btnLogout">Déconnexion</button>`;
  $("#btnSub").onclick = ouvrirAbonnement;
  $("#btnLogout").onclick = async () => { await Auth.signOut(); location.reload(); };
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
          "✅ Compte créé ! Un email de confirmation a été envoyé sur " + email + ". Clique sur le lien puis reviens te connecter.",
          "ok");
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
  if (profil?.avatar_url) setPhotoBox($("#profilPhotoBox"), profil.avatar_url);
}

function brancherProfil() {
  $("#profilPhoto").onchange = (e) => {
    const f = e.target.files[0];
    ETAT.photoProfil = f;
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
        nombre_athletes: parseInt($("#pNb").value) || 0,
        avatar_url: avatar,
      });
      await router();
    } catch (err) {
      message($("#profilMsg"), err.message, "err");
    } finally {
      btn.disabled = false; btn.textContent = "Ouvrir mon espace 🚀";
    }
  };
}

function setPhotoBox(box, url) {
  box.innerHTML = `<img src="${url}" alt="">`;
}

// ============================================================
//  TABLEAU DE BORD
// ============================================================
async function chargerAthletes() {
  ETAT.athletes = await Athletes.list(ETAT.user.id);
  const p = ETAT.profil;
  $("#dashTitle").innerHTML = p.nom_salle
    ? `${p.nom_salle} — mes <em>athlètes</em>`
    : `Mes <em>athlètes</em>`;
  renderStats();
  renderListe();
}

function statutAbo(a) {
  const j = joursRestants(a.date_prochain_paiement);
  if (j < 0) return { cls: "exp", txt: "Expiré", jours: j };
  if (j <= 5) return { cls: "warn", txt: `Bientôt (${j}j)`, jours: j };
  return { cls: "ok", txt: `Actif (${j}j)`, jours: j };
}

function renderStats() {
  const A = ETAT.athletes;
  const actifs = A.filter((a) => joursRestants(a.date_prochain_paiement) >= 0).length;
  const expires = A.length - actifs;
  const bonus = A.filter((a) => a.bonus_actif).length;
  $("#stats").innerHTML = `
    <div class="stat accent"><div class="n">${A.length}</div><div class="l">Athlètes</div></div>
    <div class="stat green"><div class="n">${actifs}</div><div class="l">Abonnements actifs</div></div>
    <div class="stat red"><div class="n">${expires}</div><div class="l">Expirés</div></div>
    <div class="stat gold"><div class="n">${bonus}</div><div class="l">Bonus fidélité 🎁</div></div>`;
}

function renderListe() {
  const q = ETAT.filtre.toLowerCase();
  const liste = ETAT.athletes.filter((a) =>
    (a.nom + " " + a.prenom).toLowerCase().includes(q)
  );

  if (!liste.length) {
    $("#listZone").innerHTML = `<div class="card empty">
      <div class="em">🏋️</div>
      <p>${ETAT.athletes.length ? "Aucun athlète trouvé." : "Aucun athlète pour l'instant. Ajoute ton premier athlète !"}</p>
    </div>`;
    return;
  }

  const lignes = liste.map((a) => {
    const st = statutAbo(a);
    const photo = a.photo_url
      ? `<img src="${a.photo_url}" alt="">`
      : `<span class="ph">👤</span>`;
    const cycle = REGLES.cycleBonus;
    const pos = ((a.mois_consecutifs - 1) % cycle) + 1; // position dans le cycle
    const dots = Array.from({ length: cycle }, (_, i) =>
      `<span class="dot ${i < pos ? "on" : ""}"></span>`).join("");
    const restant = moisAvantBonus(a.mois_consecutifs);
    const bonusBadge = a.bonus_actif
      ? `<span class="badge bonus">🎁 +${REGLES.bonusJours}j offerts</span>` : "";

    return `<tr>
      <td><div class="ath">${photo}<div><b>${a.nom} ${a.prenom}</b>
        <small>${a.telephone || ""}</small></div></div></td>
      <td>${formatDate(a.date_paiement)}</td>
      <td><b>${formatDate(a.date_prochain_paiement)}</b></td>
      <td><span class="badge ${st.cls}">${st.txt}</span></td>
      <td><div class="streak">${dots}<small>${a.mois_consecutifs} mois • bonus dans ${restant}</small></div>${bonusBadge}</td>
      <td><div class="actions">
        <button class="icon-btn" title="Paiement" data-pay="${a.id}">💳</button>
        <button class="icon-btn" title="Modifier" data-edit="${a.id}">✏️</button>
        <button class="icon-btn" title="Supprimer" data-del="${a.id}">🗑️</button>
      </div></td>
    </tr>`;
  }).join("");

  $("#listZone").innerHTML = `<div class="table-wrap"><table>
    <thead><tr>
      <th>Athlète</th><th>Date paiement</th><th>Prochain paiement</th>
      <th>Statut</th><th>Fidélité</th><th></th>
    </tr></thead>
    <tbody>${lignes}</tbody>
  </table></div>`;

  // Actions par ligne
  $$("[data-pay]").forEach((b) => b.onclick = () => ouvrirPaiement(b.dataset.pay));
  $$("[data-edit]").forEach((b) => b.onclick = () => ouvrirModale(b.dataset.edit));
  $$("[data-del]").forEach((b) => b.onclick = () => supprimer(b.dataset.del));
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
  $("#btnAdd").onclick = () => ouvrirModale();
  $("#modalClose").onclick = fermerModale;
  $("#overlay").onclick = (e) => { if (e.target.id === "overlay") fermerModale(); };

  $("#aPhoto").onchange = (e) => {
    const f = e.target.files[0]; ETAT.photoAthlete = f;
    if (f) setPhotoBox($("#aPhotoBox"), URL.createObjectURL(f));
  };

  $("#athleteForm").onsubmit = async (e) => {
    e.preventDefault();
    cacher($("#athleteMsg"));
    const btn = $("#athleteSubmit"); btn.disabled = true; btn.textContent = "...";
    try {
      let photo = null;
      const existant = ETAT.editId ? ETAT.athletes.find((x) => x.id === ETAT.editId) : null;
      photo = existant?.photo_url || null;
      if (ETAT.photoAthlete) photo = await Photos.upload(ETAT.photoAthlete, "athletes");

      const infos = {
        nom: $("#aNom").value.trim(),
        prenom: $("#aPrenom").value.trim(),
        telephone: $("#aTel").value.trim(),
        photo_url: photo,
        date_paiement: $("#aDate").value,
      };

      if (ETAT.editId) {
        // On garde l'abonnement, on met juste à jour les infos + photo
        await Athletes.update(ETAT.user.id, ETAT.editId, {
          nom: infos.nom, prenom: infos.prenom, telephone: infos.telephone, photo_url: photo,
        });
      } else {
        await Athletes.add(ETAT.user.id, infos);
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

async function supprimer(id) {
  const a = ETAT.athletes.find((x) => x.id === id);
  if (!confirm(`Supprimer ${a.nom} ${a.prenom} ?`)) return;
  await Athletes.remove(ETAT.user.id, id);
  await chargerAthletes();
}

// ============================================================
//  MODALE PAIEMENT (renouvellement + fidélité)
// ============================================================
function ouvrirPaiement(id) {
  const a = ETAT.athletes.find((x) => x.id === id);
  ETAT.payAthlete = a;
  $("#payWho").textContent = `${a.nom} ${a.prenom}`;
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
  message($("#payPreview"), "", "info");
  $("#payPreview").innerHTML = txt;
  $("#payPreview").className = "msg show " + (calc.bonus_actif ? "ok" : "info");
}

function brancherPaiement() {
  $("#payClose").onclick = fermerPaiement;
  $("#overlayPay").onclick = (e) => { if (e.target.id === "overlayPay") fermerPaiement(); };
  $("#payDate").onchange = majApercuPaiement;
  $("#payConfirm").onclick = async () => {
    const btn = $("#payConfirm"); btn.disabled = true; btn.textContent = "...";
    try {
      await Athletes.recordPayment(ETAT.user.id, ETAT.payAthlete, $("#payDate").value || aujourdhui());
      fermerPaiement();
      await chargerAthletes();
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false; btn.textContent = "Confirmer le paiement";
    }
  };
}

// ============================================================
//  MODALE ABONNEMENT (le coach paie l'app)
// ============================================================
let planChoisi = "annuel";
let methodeChoisie = "Baridi Mob";

function ouvrirAbonnement() {
  $("#overlaySub").classList.remove("hidden");
}
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

  // Choix du moyen de paiement
  $$("#overlaySub .pay-method").forEach((m) => {
    m.onclick = () => {
      methodeChoisie = m.dataset.method;
      $$("#overlaySub .pay-method").forEach((x) => x.classList.toggle("on", x === m));
    };
  });

  $("#copyRip").onclick = async (e) => {
    e.stopPropagation(); // ne pas déclencher la sélection de la carte
    const rip = $("#rip").textContent.trim();
    try { await navigator.clipboard.writeText(rip); } catch {}
    $("#copyRip").textContent = "✅";
    setTimeout(() => ($("#copyRip").textContent = "📋"), 1500);
  };

  $("#subConfirm").onclick = () => {
    const prix = planChoisi === "annuel" ? "19000 DA / an" : "1200 DA / mois";
    message($("#subMsg"),
      `✅ Formule ${planChoisi} (${prix}) — paiement par ${methodeChoisie}. Envoie la capture de ton paiement pour activer ton compte.`,
      "ok");
  };
}

// ============================================================
//  BRANCHEMENTS
// ============================================================
function brancherEvenements() {
  brancherAuth();
  brancherProfil();
  brancherModale();
  brancherPaiement();
  brancherAbonnement();
  $("#search").oninput = (e) => { ETAT.filtre = e.target.value; renderListe(); };
}

// GO !
init();
