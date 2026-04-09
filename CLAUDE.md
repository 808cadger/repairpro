# CLAUDE.md — AutoRepairIQ Pro

> Inherits all global rules from `~/CLAUDE.md`. This file adds AutoRepairIQ Pro specifics.

---

## App Identity

- **Repo**: `github.com/808cadger/autorepairiq-pro`
- **Package**: `com.autorepairiq.pro`
- **PWA URL**: `https://808cadger.github.io/autorepairiq-pro`
- **Purpose**: Unified AI auto repair — damage scan + cost estimation + shop management + finance
- **Merged from**: AutoIQ (vision pipeline) + RepairIQ (shop estimates/jobs)
- **Color**: `#f59e0b` (amber), background `#0b0d14`, accent blue `#3b82f6`

---

## AI Models

| Use | Model |
|-----|-------|
| Damage scan (vision) | `claude-sonnet-4-6` |
| Cost estimation | `claude-sonnet-4-6` |
| Chatbot widget | `claude-haiku-4-5` |

---

## Architecture — 6 Tabs

| Tab | Source | Function |
|-----|--------|----------|
| Garage | NEW | Vehicle list + maintenance log + mileage reminders |
| Scan | AutoIQ | Photo → Vision → Parts → Pricing → Decision pipeline |
| Estimate | RepairIQ | AI text + lookup table → labor + parts cost |
| Jobs | RepairIQ | Status lifecycle: estimate → in-progress → done → invoiced |
| Finance | NEW | Expenses, invoices, QuickBooks CSV export |
| Settings | Both | Shop info, API key, hourly rate, demo mode |

---

## Backend

- `backend/main.py` — all routes (single file until >600 lines)
- `backend/models.py` — Vehicle, Estimate, RepairJob, Shop, Expense, MaintenanceLog
- `backend/config.py` — Pydantic Settings
- Auth: single bearer token (`API_TOKEN`) — MVP
- DB: SQLite via SQLAlchemy (migrate to PostgreSQL when multi-user)

### Env vars

```
ANTHROPIC_API_KEY=
DB_PATH=./autorepairiq.db
API_TOKEN=
CORS_ORIGINS=capacitor://localhost,http://localhost,http://localhost:8080
IMAGE_UPLOAD_DIR=./uploads
```

---

## Frontend

- `www/index.html` — tabbed SPA; all views toggled with classes
- `www/api-client.js` — Claude API (circuit breaker + retry) → `ClaudeAPI`
- `www/avatar-widget.js` — floating Jedi chatbot (context-aware)
- `www/scan.js` — camera capture → base64 → vision pipeline
- `www/estimate.js` — lookup tables + AI text estimate
- `www/finance.js` — expense tracking + CSV export
- `www/sw.js` — service worker for PWA offline

### Repair Lookup Data
Built-in `repairs` object in estimate.js: Engine, Brakes, Transmission, Suspension, Electrical, AC/Heating, Exhaust, Tires, Oil/Fluids — with indie parts ranges and labor hours.

---

## Pipeline (Scan Tab)

Sequential 4-agent chain:
1. **Vision Agent** — Claude analyzes damage photos → part, type, severity
2. **Parts Map Agent** — maps damage to repair line items (OEM vs aftermarket)
3. **Pricing Agent** — cost estimate: parts + labor + paint (low/mid/high)
4. **Decision Agent** — confidence score, human review flag, executive summary

---

## Hawaii Localization

- Default labor rate: $110/hr (Hawaii indie shop average)
- Shop lookup: Overpass API → Aiea/Honolulu/Pearl City mechanics
- R2R: Hawaii Right to Repair context in chatbot system prompts
- State data: HI labor rate ranges in estimate.js

---

## Deploy Checklist

- [ ] `npm install && npx cap sync android`
- [ ] `cd android && ./gradlew assembleDebug`
- [ ] `adb install -r app-debug.apk` on device `51101JEBF11597`
- [ ] Backend: `uvicorn backend.main:app --reload`
- [ ] Health: `curl http://localhost:8000/health`
- [ ] Scan flow end-to-end
- [ ] Estimate flow (AI + lookup)
- [ ] PWA Lighthouse ≥ 90
- [ ] No secrets in `www/`

---

## Commands

```bash
npm install && npx cap sync android && cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

---

## Assumptions

- `// #ASSUMPTION: Static bearer token — replace with JWT before public launch`
- `// #ASSUMPTION: Single-device MVP; no multi-user data isolation yet`
- `// #ASSUMPTION: SQLite for MVP; PostgreSQL when scaling`
- `// #ASSUMPTION: Lookup repair data is current; TODO: cache + refresh alerts`
- `// #ASSUMPTION: Hawaii labor rates $110-150/hr for indie shops`

---

## Prohibited

- No hardcoded API keys in `www/` or committed files
- No `print()` in backend — use `logging`
- No Bootstrap/Tailwind
- No new npm packages without bundle size check
- No splitting backend into routers until >600 lines
