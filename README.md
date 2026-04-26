# RepairPro

<!-- INSTALL-START -->
## Install and run

These instructions install and run `repairpro` from a fresh clone.

### Clone
```bash
git clone https://github.com/808cadger/repairpro.git
cd repairpro
```

### Web app
```bash
npm install
npm run serve
```

### Android build/open
```bash
npm run cap:sync
npm run cap:android
```

### Desktop app
```bash
npm run electron
npm run electron:dist
```

### Python/API service
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Notes
- Use Node.js 22 or newer for the current package set.
- Android builds require Android Studio, a configured SDK, and Java 21 when Gradle is used.
- Create any required `.env` file from `.env.example` before starting backend services.

### AI/API setup
- If the app has AI features, add the required provider key in the app settings or local `.env` file.
- Browser-only apps store user-provided API keys on the local device unless a backend endpoint is configured.

### License
- Apache License 2.0. See [`LICENSE`](./LICENSE).
<!-- INSTALL-END -->


> AI auto repair suite — damage scan, VIN decode, part identification, cost estimation, shop management, and finance tracking. Merged and upgraded from AutoIQ + RepairIQ + AutoRepairIQ Pro.

[**PWA →**](https://cadger808.codeberg.page/repairpro) · [**Download APK / Desktop →**](https://codeberg.org/cadger808/repairpro/releases) · [Codeberg](https://codeberg.org/cadger808/repairpro)

---

## For Recruiters

**Role fit:** AI Engineer · Mobile Developer · Full-Stack Engineer

| Skill | What I built |
|-------|-------------|
| **Agentic AI pipeline** | 4-stage sequential Claude Sonnet 4.6 chain: Vision → Parts Map → Pricing → Decision — fires on photo submit |
| **Computer Vision** | Claude Opus 4.6 Vision identifies vehicle parts and damage from camera photos with collision repair terminology |
| **VIN decode** | NHTSA public API integration — decodes any VIN and auto-fills vehicle form, no API key required |
| **FastAPI backend** | Python async API with SQLAlchemy + PostgreSQL — estimates, jobs, finance, shop management |
| **Multi-platform** | PWA + Android APK (Capacitor) + Linux desktop (Electron) from one codebase |
| **CI/CD** | Forgejo Actions — automated APK build + PWA deploy + Electron packaging |

**Engineering highlights:**
- Safety net on Decision agent: human review flag enforced programmatically for edge cases Claude might miss (cost > $5K, poor photo quality, prior repair indicators)
- VIN decode uses NHTSA's free government endpoint — AbortController timeout, XSS-safe
- Part identifier fires automatically on photo capture via `setScanPhoto()` hook
- CSP-hardened: only NHTSA + Overpass + Anthropic external connects allowed

**Contact:** cadger808@gmail.com · [codeberg.org/cadger808](https://codeberg.org/cadger808) · [linkedin.com/in/christopher-cadger](https://linkedin.com/in/christopher-cadger)

---

## What it does

| Tab | Feature |
|-----|---------|
| 🚗 **Garage** | Vehicle list, maintenance log, scan from garage |
| 📸 **Scan** | VIN decode → camera → 4-agent AI pipeline → itemized estimate |
| 🔧 **Estimate** | AI text estimate or 50+ repair lookup table |
| 📋 **Jobs** | Work order lifecycle: estimate → in-progress → done → invoiced |
| 💰 **Finance** | Expenses, invoices, CSV export |
| ⚙️ **Settings** | Shop info, hourly rate, API key |

**Scan pipeline:** Vision Agent → Parts Map Agent → Pricing Agent → Decision Agent

---

## Install

| Method | Steps |
|--------|-------|
| **PWA** | Open link → "Add to Home Screen" — works on Android, iOS, desktop |
| **Android APK** | [Download](https://codeberg.org/cadger808/repairpro/releases) → open file on device |
| **ADB** | `adb install -r app-debug.apk` |
| **Linux desktop** | Download `.AppImage` or `.rpm` from Releases |

---

## Dev quick start

```bash
git clone https://codeberg.org/cadger808/repairpro.git
cd repairpro && npm install

npx serve www                  # browser dev
npx cap sync android && cd android && ./gradlew assembleDebug  # APK
npm run electron:dist          # Electron
```

Backend:
```bash
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Tech stack

| Layer | Tech |
|-------|------|
| UI | Vanilla HTML/CSS/JS |
| AI | Claude Sonnet 4.6 (pipeline) · Claude Opus 4.6 (Vision ID) |
| Mobile | Capacitor → Android APK |
| Desktop | Electron (AppImage / RPM) |
| Backend | Python FastAPI + SQLAlchemy + PostgreSQL |
| VIN | NHTSA public API (no key needed) |
| Shop finder | OpenStreetMap Overpass API |
| CI/CD | Forgejo Actions |

---

*Merged from: AutoIQ · RepairIQ · AutoRepairIQ Pro — Aloha from Pearl City, Hawaii*

---

© 2026 cadger808 — All rights reserved.
