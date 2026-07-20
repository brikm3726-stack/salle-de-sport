# 🏋️ Ma Salle — Gestion des athlètes

Application web pour un coach de sport : enregistrer les athlètes, suivre leurs
abonnements du mois, et offrir automatiquement **+15 jours** après **6 mois
consécutifs** (bonus fidélité sur le 7ᵉ mois).

Chaque coach crée son propre compte (Google Gmail ou email) et ne voit **que ses
athlètes**.

---

## ✅ Ce que le site fait

- **Comptes coachs** : inscription en ligne avec Google Gmail **ou** email + mot
  de passe (avec email de confirmation).
- **Profil coach** : après l'inscription, un formulaire s'affiche pour remplir
  photo de profil, nom, prénom, nom de la salle et nombre d'athlètes.
- **Fiche athlète** : photo, nom + prénom, **date du paiement** → **date du
  prochain paiement**, statut (actif / bientôt / expiré).
- **Fidélité automatique** : 6 mois consécutifs payés → le 7ᵉ mois reçoit
  **+15 jours** offerts (répété à chaque cycle : mois 7, 13, 19…).
- **Sauvegarde cloud** : toutes les données sont enregistrées dans Supabase.

---

## 🚀 Essayer tout de suite (Mode démo)

Ouvre simplement **`index.html`** dans ton navigateur.

Sans configuration, le site tourne en **mode démo** : tu peux créer un compte
(email + mot de passe), remplir ton profil et gérer des athlètes. Les données
sont gardées dans **ce navigateur** (pratique pour tester).

> ⚠️ En mode démo, le bouton **Google** et la vraie sauvegarde cloud ne sont pas
> actifs. Pour ça, configure Supabase ci-dessous.

---

## ☁️ Activer les vrais comptes (Google + sauvegarde cloud)

### 1) Créer la base de données Supabase (gratuit)

1. Va sur **https://supabase.com** → crée un compte → **New project**.
2. Menu de gauche → **SQL Editor** → **New query**.
3. Copie **tout** le fichier `supabase-schema.sql`, colle-le, puis **Run**.
   → Ça crée les tables (coachs, athlètes, paiements), la sécurité et le
   dossier des photos.
4. Menu **Storage** → vérifie que le bucket **`photos`** existe et est **Public**.

### 2) Brancher le site à Supabase

1. Menu **Project Settings → API**.
2. Copie le **Project URL** et la clé **anon public**.
3. Ouvre `js/config.js` et colle-les :

```js
const SUPABASE_CONFIG = {
  url: "https://xxxx.supabase.co",   // ← ton Project URL
  anonKey: "eyJhbGciOi...",           // ← ta clé anon public
};
```

### 3) Activer la connexion Google Gmail

1. Dans Supabase : **Authentication → Providers → Google** → active-le.
2. Il te demande un **Client ID** et **Client Secret** Google :
   - Va sur **https://console.cloud.google.com** → crée un projet.
   - **APIs & Services → Credentials → Create credentials → OAuth client ID**
     → type **Web application**.
   - Dans **Authorized redirect URIs**, colle l'URL donnée par Supabase
     (elle ressemble à `https://xxxx.supabase.co/auth/v1/callback`).
   - Copie le **Client ID** et **Client Secret** → colle-les dans Supabase.
3. Dans Supabase : **Authentication → URL Configuration** → mets l'adresse de
   ton site dans **Site URL** (ex : `http://localhost` en test, ou l'URL de ton
   hébergement en ligne).

### 4) Email de confirmation

Pour l'inscription par email, Supabase envoie **automatiquement** un email de
confirmation. (Pour l'envoyer depuis ta propre adresse Gmail, configure un SMTP
dans **Authentication → Emails**.)

---

## 🌐 Mettre le site en ligne

Le site est en HTML/CSS/JS : héberge le dossier tel quel sur **Netlify**,
**Vercel** ou **GitHub Pages** (glisser-déposer le dossier). Pense à mettre
l'URL en ligne dans **Site URL** de Supabase (étape 3.3).

---

## 📁 Structure

```
sport salle 1/
├── index.html              → la page (connexion, profil, tableau de bord)
├── css/styles.css          → thème gym
├── js/config.js            → tes clés Supabase + règles d'abonnement
├── js/db.js                → base de données + logique fidélité
├── js/app.js               → interface
├── supabase-schema.sql     → à exécuter dans Supabase
└── README.md               → ce fichier
```

## ⚙️ Régler les durées

Dans `js/config.js`, section `REGLES` :

```js
const REGLES = {
  dureeJours: 30,   // durée d'un abonnement (1 mois)
  bonusJours: 15,   // bonus offert
  cycleBonus: 6,    // après 6 mois consécutifs → bonus
  graceJours: 7,    // retard toléré pour rester "consécutif"
};
```
