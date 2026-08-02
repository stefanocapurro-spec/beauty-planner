# 💄 Beauty Planner

Applicazione PWA per estetiste — gestione appuntamenti, listino prezzi e pagamenti con **cifratura end-to-end** AES-256-GCM.

Backend: **Supabase**.

\---

## ✨ Funzionalità

|Sezione|Funzioni|
|-|-|
|**Agenda**|Appuntamenti con ricerca, filtri, promemoria WhatsApp|
|**Listino**|20 prestazioni precaricate + aggiunta manuale con emoji picker|
|**Pagamenti**|Pagato / rimandato / anticipo, credito residuo, riepilogo mensile|
|**Impostazioni**|4 palette femminili × chiaro / scuro / sistema|
|**Superadmin**|Reset dati con conferma obbligatoria|

\---

## 🔒 Cifratura

* Ogni campo sensibile è cifrato **nel browser** prima di inviarlo ad Appwrite
* Algoritmo: **AES-256-GCM** (Web Crypto API nativa — zero dipendenze extra)
* Chiave derivata con **PBKDF2** da `password + userId`: non salvata, non trasmessa
* Appwrite riceve e archivia **solo testo cifrato in base64**

\---

## 🚀 Setup completo (tutto gratuito)

### Requisiti PC

* **Node.js 20+** → [nodejs.org](https://nodejs.org) (versione LTS)
* **Git** → [git-scm.com](https://git-scm.com)
* Account **GitHub** gratuito → [github.com](https://github.com)
* Account **Appwrite Cloud** gratuito → [cloud.appwrite.io](https://cloud.appwrite.io)

> ✉️ \*\*Le email\*\* (conferma account, reset password) vengono inviate gratuitamente dal sistema integrato di Appwrite da `noreply@appwrite.io`. Non serve configurare nulla.

\---

### Passo 1 — Estrai e installa

```bash
cd beauty-planner
npm install
```

\---

### Passo 2 — Crea il progetto Appwrite

1. Vai su [cloud.appwrite.io](https://cloud.appwrite.io) → **Create project**
2. Scegli un nome (es. `beauty-planner`) e clicca **Create**
3. Annota il **Project ID** che trovi in **Settings → Overview**

\---

### Passo 3 — Aggiungi le piattaforme web

In Appwrite Console → **Overview → Add a platform → Web**:

**Prima piattaforma (sviluppo locale):**

* Type: **React**
* Hostname: `localhost`
* Clicca **Create platform**

**Seconda piattaforma (produzione):**

* Torna su **Overview → Add a platform → Web**
* Type: **React**
* Hostname: `TUO-UTENTE.github.io`
* Clicca **Create platform**

> Appwrite usa l'hostname per bloccare le richieste da domini non autorizzati (CORS).

\---

### Passo 4 — Crea l'API Key per il setup

Appwrite Console → **Settings → API Keys → Create API Key**

* Nome: `setup`
* Expiration: **Never**
* Seleziona **tutti gli scope** della sezione Databases (sia quelli attivi che quelli contrassegnati come Deprecated)
* Clicca **Create** e copia la chiave generata

\---

### Passo 5 — Crea il file `.env`

```bash
cp .env.example .env
```

Apri `.env` e compila **solo questi campi** per ora:

```env
VITE\_APPWRITE\_PROJECT\_ID=il-tuo-project-id
APPWRITE\_PROJECT\_ID=il-tuo-project-id
APPWRITE\_API\_KEY=standard\_abc123...
VITE\_SUPERADMIN\_EMAIL=latua@email.com
```

I valori si scrivono **senza virgolette**.

\---

### Passo 6 — Esegui il setup automatico

```bash
node setup-appwrite.mjs
```

Lo script crea database, 3 collezioni, tutti gli attributi e gli indici, poi stampa i valori da aggiungere al `.env`. Esempio output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Setup completato! Copia nel file .env:

VITE\_APPWRITE\_ENDPOINT=https://cloud.appwrite.io/v1
VITE\_APPWRITE\_PROJECT\_ID=6507c9a8...
VITE\_APPWRITE\_DATABASE\_ID=6a0a024d...
VITE\_APPWRITE\_COL\_SERVICES=6a0a0250...
VITE\_APPWRITE\_COL\_APPOINTMENTS=6a0a0251...
VITE\_APPWRITE\_COL\_PAYMENTS=6a0a0252...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Incolla questi valori nel file `.env`.

\---

### Passo 7 — Testa in locale

```bash
npm run dev
```

Apri `http://localhost:5173`, registrati con la tua email e verifica che tutto funzioni. Appwrite invierà automaticamente l'email di conferma account da `noreply@appwrite.io`.

\---

### Passo 8 — Pubblica su GitHub

```bash
git init
git add .
git commit -m "Beauty Planner — primo deploy"
```

Vai su [github.com](https://github.com) → **New repository**:

* Nome: `beauty-planner`
* Visibilità: **Public** (necessaria per GitHub Pages gratuito)
* **Non** spuntare "Initialize with README"

```bash
git remote add origin https://github.com/TUO-UTENTE/beauty-planner.git
git branch -M main
git push -u origin main
```

\---

### Passo 9 — Configura GitHub Pages e i Secrets

**Settings → Pages → Source → GitHub Actions**

**Settings → Secrets and variables → Actions → New repository secret**

Aggiungi questi secret uno alla volta (stessi valori del `.env`):

|Nome secret|Valore|
|-|-|
|`VITE\_APPWRITE\_ENDPOINT`|`https://cloud.appwrite.io/v1`|
|`VITE\_APPWRITE\_PROJECT\_ID`|il tuo Project ID|
|`VITE\_APPWRITE\_DATABASE\_ID`|dall'output dello script|
|`VITE\_APPWRITE\_COL\_SERVICES`|dall'output dello script|
|`VITE\_APPWRITE\_COL\_APPOINTMENTS`|dall'output dello script|
|`VITE\_APPWRITE\_COL\_PAYMENTS`|dall'output dello script|
|`VITE\_SUPERADMIN\_EMAIL`|la tua email|
|`VITE\_BASE\_PATH`|`/beauty-planner/`|

Dopo aver aggiunto tutti i secret, fai un push su `main` per avviare il deploy:

```bash
git add .
git commit -m "configura secrets"
git push
```

Il workflow parte automaticamente — dopo \~2 minuti l'app è online su:
**`https://TUO-UTENTE.github.io/beauty-planner`**

\---

### Passo 10 — Configura i redirect email in Appwrite

Questo passaggio permette ai link nelle email (verifica account, reset password) di rimandare alla tua app.

Appwrite Console → **Auth → Security**:

* **Custom domains** → aggiungi `https://TUO-UTENTE.github.io`

Appwrite Console → **Auth → Templates**:

* Apri il template **Email Verification** → aggiorna l'URL con `https://TUO-UTENTE.github.io/beauty-planner`
* Apri il template **Password Recovery** → stesso URL

\---

## 📱 Installazione come PWA

**Android (Chrome):** compare automaticamente un banner → tocca *Installa*

**iPhone (Safari):** tocca 📤 *Condividi* → *Aggiungi a schermata Home*

\---

## ♻️ Aggiornamenti futuri

Per ogni modifica basta:

```bash
git add .
git commit -m "descrizione modifica"
git push
```

GitHub Actions costruisce e pubblica automaticamente.

\---

## 📁 Struttura progetto

```
beauty-planner/
├── .env.example                Template variabili d'ambiente
├── .github/workflows/
│   └── deploy.yml              CI/CD → GitHub Pages
├── public/
│   ├── icons/                  Icone PWA (192px, 512px)
│   ├── apple-touch-icon.png    Icona iOS
│   └── favicon.svg
└── src/
    ├── components/
    │   ├── ui/                 Modal, Button, Badge, Spinner, EmptyState
    │   ├── auth/               Login, registrazione, reset password
    │   ├── appointments/       Agenda — vista, card, modale
    │   ├── services/           Listino prezzi
    │   ├── payments/           Storico pagamenti
    │   ├── settings/           Tema e account
    │   ├── admin/              Pannello superadmin
    │   └── layout/             BottomNav, OfflineBanner, SplashScreen
    ├── hooks/
    │   ├── useAuth.jsx         Autenticazione Appwrite
    │   ├── useAppointments.js  CRUD appuntamenti (cifrati)
    │   ├── useServices.js      CRUD prestazioni (cifrate)
    │   ├── usePayments.js      CRUD pagamenti (cifrati)
    │   └── useTheme.js         Palette colori + modalità schermo
    ├── lib/
    │   ├── appwrite.js         Client Appwrite + costanti collezioni
    │   ├── crypto.js           AES-256-GCM + PBKDF2
    │   └── whatsapp.js         Deep-link promemoria WhatsApp
    ├── data/
    │   └── services.js         20 prestazioni default
    └── styles/
        ├── themes.js           4 palette × light/dark
        └── index.css           CSS custom properties + utility
```

