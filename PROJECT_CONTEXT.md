# FormBridge Project Context

## Product Direction

FormBridge is a SaaS/CRM layer over Google Forms.

Core idea:
- User logs in.
- User connects Google account.
- User selects a Google Form.
- FormBridge turns that form into a workspace with requests/responses, analytics, AI assistant, notifications, and exports.

Current product direction:
- Not every form is the same.
- FormBridge uses scenario-based workspaces.
- A form can be used for admissions, HR, surveys, client requests, events, or universal processing.
- The base data model is shared, but UI, statuses, AI prompts, and quick actions should adapt to the selected scenario.

## Current Scenarios

Supported scenarios:
- universal
- admissions
- hr
- survey
- client_requests
- event

## Important UX Principles

- Official, minimal, practical style.
- Main color: #123b2f.
- Avoid emoji icons in UI.
- Use real SVG icons or icon components.
- Avoid "AI-looking" exaggerated UI.
- Prefer clean CRM/workspace layout.
- Header should stay simple:
  - logo
  - language switcher
  - account menu
- Main navigation should be through /forms.
- One form workspace should show only requests/responses for that form.
- A form is "ready/connected" only when delivery is actually ready.
- A created integration record with missing trigger/webhook test is only "setup in progress".
- Setup-in-progress forms must show "continue setup", not "open workspace".
- Guided setup Step 1 explains that FormBridge created a Google Sheet and the user should select that prepared Sheet in Google Forms.
- Step 1 uses screenshots from frontend/public/setup-screenshots.
- Apps Script setup links should use script.google.com/home/projects/{scriptId}/edit and include the connected Google account.
- Guided setup should stay quiet: no "copy setup link" button in the main flow.
- Step 2 is not complete just because Apps Script opened; it is complete only after the installer confirms trigger creation.
- The Apps Script installer calls POST /api/integrations/forms/:id/setup-confirm after creating the trigger.
- Guided setup Step 2 uses screenshots from frontend/public/setup-screenshots/apps-script-*.png.
- Do not show "test event" in the main setup verification UI; keep setup checks focused on Sheet, trigger/auto delivery, and webhook.

## AI Direction

Old AI concept:
- Analyze one selected request.

New AI concept:
- AI assistant per form workspace.
- AI uses only data from the selected form.
- AI should answer questions like:
  - summarize this form
  - what needs attention
  - who should be contacted first
  - survey conclusions
  - best candidates
  - missing data
  - daily/weekly summary

Current main endpoint:
- POST /api/ai/form-chat

Model:
- OPENAI_MODEL=gpt-5-nano-2025-08-07

## Current Deployment Direction

Production domain:
- https://formbridge.nlrk.online

Server app path:
- /var/www/formbridge

Server secrets should live outside the repo:
- /opt/formbridge-secrets/backend.env.production
- /opt/formbridge-secrets/frontend.env.production

Deploy script:
- scripts/deploy_formbridge_server.sh

Only server deploy script should remain in scripts.

Backend port on server:
- PORT=4001

Nginx proxies FormBridge to:
- 127.0.0.1:4001

Never store secrets inside Git.

## Recent Completed Work

Completed:
- Added scenario config backend.
- Added scenario fields to form integrations.
- Added form feedback model/API.
- Added workspace API.
- Added scenario selection UI.
- Added form-level AI chat.
- Removed old request-level AI UI/backend route.
- Updated OpenAI model name to gpt-5-nano-2025-08-07.
- Simplified server deploy script to use /opt/formbridge-secrets only.
- Removed old local deployment scripts from Git.

Recent commits:
- 891b922 Simplify server deploy secrets handling
- 474921c Add scenario workspaces and form AI chat
- 7c7e596 Polish login success toast

## Known Risks / Things To Check

- Server /opt/formbridge-secrets must contain correct production env files.
- Backend production env must use PORT=4001.
- Google OAuth production redirect URIs must be configured for:
  - https://formbridge.nlrk.online/api/auth/google/callback
  - https://formbridge.nlrk.online/api/google/oauth/callback
- AI chat currently uses recent form requests as context.
- Survey scenario still needs a more analytics-focused workspace.
- HR/admissions scenarios need better quick actions later.
- WhatsApp notifications exist as MVP but should later adapt to scenarios.
- Export should later support PDF/Word/Excel reports.

## Recently Completed

### Replace emoji icons with SVG components (2026-05-31)

Files changed:
- `frontend/src/shared/icons.jsx` — created; exports IconGrid, IconAcademic, IconUser, IconChart, IconMessage, IconCalendar, IconGlobe, IconBell, IconSpark, IconCheck, IconAlert, IconExport, IconChevronDown, IconFeedback, IconAccount
- `frontend/src/pages/RequestsPage.jsx` — imported 6 scenario icons; replaced emoji strings in SCENARIO_CARDS with Icon component refs; updated ScenarioSelectBanner render to `<card.Icon size={22} />`

Replaced emoji:
- ⊞ (universal) → IconGrid
- 🎓 (admissions) → IconAcademic
- 👤 (hr) → IconUser
- 📊 (survey) → IconChart
- 💬 (client_requests) → IconMessage
- 📅 (event) → IconCalendar

Notes:
- App.jsx already used @heroicons/react (already installed); no new deps added
- All icons use currentColor, inherit color from CSS colorClass
- ✓ in App.jsx toast is a text character, not emoji — left as-is
- Frontend build verified successfully after the icon replacement

## Recently Completed

### Fix AI chat — switch to Chat Completions API (2026-05-31)

Files changed:
- `backend/src/services/openaiService.js` — replaced `client.responses.create` with `client.chat.completions.create`; removed `reasoning`, `max_output_tokens`; fallback model changed to `"gpt-5-nano"`; empty response logs `[formChat] OpenAI returned empty chat completion` without logging prompt/data
- `backend/.env.example` — `OPENAI_MODEL=gpt-5-nano`
- `openai-nano-demo/` — deleted (was untracked, was only a local test reference)

Checks passed:
- `node --check` on all backend JS files ✓
- `npm run build` frontend ✓
- `rg` found zero matches for `responses.create|max_output_tokens|max_completion_tokens|max_tokens|temperature|reasoning` in openaiService.js ✓

Commit: f94c4ed

## Recently Completed

### Admin dashboard + Toast UX (2026-05-31)

Files changed:
- `backend/src/middleware/admin.js` — new: `requireAdmin` checks `process.env.ADMIN_EMAILS` (comma-separated) against `req.user.email`, returns 403 if not match
- `backend/src/routes/adminRoutes.js` — new: GET `/api/admin/overview` (users/forms/requests/feedback/system), GET `/api/admin/feedback` (enriched with user email/name), PATCH `/api/admin/feedback/:id` (status: new/reviewed/done)
- `backend/src/app.js` — registered `adminRoutes` at `/api/admin`
- `backend/.env.example` — added `ADMIN_EMAILS=`
- `frontend/src/app/App.jsx` — toast: added `toastClosing` state, 3s show + exit animation; `IconCheck` SVG instead of text; `/admin` route; "Developer" link in account dropdown
- `frontend/src/pages/AdminPage.jsx` — new: admin dashboard with stat cards, system status, recent users table, feedback table with status update buttons
- `frontend/src/shared/i18n.js` — added 17 admin keys in kk/ru/en
- `frontend/src/shared/styles/global.css` — toast moved to bottom-right (desktop), bottom full-width (mobile); toastIn/toastOut animations; full admin styles

Checks:
- `node --check` on all backend files ✓
- `npm run build` frontend ✓
- `rg` secret scan: only boolean check + user-visible UI text, no values leaked ✓

Commit: aa28875

## Production deploy

Add to `/opt/formbridge-secrets/backend.env.production`:
```
ADMIN_EMAILS=erdana.tursunov@gmail.com,tursunoverdana@gmail.com
```

Server commands:
```
cd /var/www/formbridge
./scripts/deploy_formbridge_server.sh
pm2 flush 7
pm2 logs 7 --lines 30
```

## Recently Completed

### Improve form workspace layout (2026-05-31)

Files changed:
- `frontend/src/pages/RequestsPage.jsx` — replaced `official-page-title` block with new `ws-header-card`; added `today`/`week` to stats useMemo; moved AnalyticsBlock to collapsible `<details>`; wrapped AI + WhatsApp in `ws-bottom-row` grid; added `isOpen` collapse state to `NotificationSettingsBlock` with chevron toggle
- `frontend/src/shared/styles/global.css` — added `ws-header-card`, `ws-header-main`, `ws-title-row`, `ws-goal-text`, `ws-header-actions`, `ws-stats-row`, `ws-stat`, `ws-bottom-row`, `ws-analytics-section`, `ws-analytics-summary`, notif collapsible overrides; mobile responsive rules

What changed:
- Workspace header is now a dedicated card: form title + scenario badge + goal text, with "My Forms" and "Suggest improvement" buttons aligned right
- Compact stats row (total / today / 7 days / new) displayed as 4 mini stat cards inside the header
- AnalyticsBlock (status bars + popular answers) moved to collapsible `<details>` section between workspace and bottom row
- AI chat and WhatsApp notifications placed side-by-side in a 2-column bottom row (AI wider at 1.65fr, WhatsApp at 1fr)
- WhatsApp block collapses by default; toggle with chevron in the header
- Responsive: stats row becomes 2-col on ≤980px; header actions stack on mobile; bottom row stacks on ≤860px

Build: `npm run build` ✓

Commit: daebbbc

## Recently Completed

### Polish official frontend UI (2026-05-31)

Files changed:
- `frontend/src/shared/styles/global.css` — 345 additions, 29 deletions

Changes:
- Consolidated two duplicate `:root` blocks into one clean design token
  system with `--brand`, `--surface-muted`, `--shadow-card`, `--radius-card`,
  `--radius-control`, `--success`, `--warning`
- Removed blue radial gradient from `body` background (was leftover from
  old blue accent theme)
- Added CSS badge classes for all scenario-specific statuses: hired, rejected,
  shortlisted, interview, documents_needed, accepted, contacted, urgent,
  waiting_client, closed, confirmed, waiting_payment, cancelled, attended,
  registered, no_show, completed, archived, in_review
- Added `:focus-visible` ring (green, `rgba(18,59,47,0.14)`) for all
  interactive elements — buttons, dropdowns, selects, scenario cards
- Added `cursor:pointer` / `cursor:not-allowed` consistency rules
- Fixed admin table row border color from bluish `#f1f5f9` → brand `#edf1ee`
- Fixed admin badge `border-radius` to `999px` pill for consistency
- Added admin table row hover highlight
- Mobile: topbar gets smaller border-radius + tighter padding at ≤600px
- Mobile: lang switcher hidden at ≤420px to prevent overflow
- Mobile: admin stat-grid 2-col, ws-stats-row 2-col, scenario-cards 1-col
- `a.primary-btn` declared as `inline-flex` for `<Link>` compatibility
- Normalized `select` appearance across browsers

Checks:
- `npm run build` ✓
- `rg` — no emoji in JSX/CSS, only KK/RU translations and comment decorators ✓
- `git diff --stat` — only `global.css` changed ✓

Commit: 69d8bfa

## Recently Completed

### Flexible request date filter (2026-05-31)

Files changed:
- `frontend/src/pages/RequestsPage.jsx` — replaced `DATE_FILTERS = ["all","today","week"]` with 6 options `["all","today","yesterday","last7","last30","custom"]`; `isWithinDateRange` now accepts `(dateStr, range, from, to)` with yesterday/last7/last30/custom logic using startOfDay/endOfDay; added `dateFrom`/`dateTo` state; `filteredItems` memo updated to pass from/to; toolbar now shows `.toolbar-date-group` with conditional date inputs when custom is selected
- `frontend/src/shared/i18n.js` — added 6 new keys in kk/ru/en: `dateFilterYesterday`, `dateFilterLast7`, `dateFilterLast30`, `dateFilterCustom`, `dateFrom`, `dateTo`
- `frontend/src/shared/styles/global.css` — added `.toolbar-date-group`, `.toolbar-date-custom`, `.toolbar-date-input-label`, `.toolbar-date-sep`; updated toolbar grid last column to `minmax(180px, auto)`

How to test:
1. Open any form workspace `/forms/:formId/requests`
2. Click the date dropdown — 6 options should appear
3. Select "Yesterday" / "Last 7 days" / "Last 30 days" — table filters accordingly
4. Select "Custom range" — two date inputs (From / To) appear below the select
5. Enter a date range — table filters to only those dates
6. Clear both inputs with "All" selected — all rows shown

Build: `npm run build` ✓
Commit: f41c9c4

## Recently Completed

### Enhance scenario workspace UX (2026-05-31)

Files changed:
- `frontend/src/pages/RequestsPage.jsx` — +182 lines
- `frontend/src/shared/i18n.js` — +75 keys (kk/ru/en)
- `frontend/src/shared/styles/global.css` — +210 lines

#### Part 1 — Scenario-aware quick actions
- Added `SCENARIO_QUICK_ACTIONS` map (per scenario: admissions/hr/client_requests/event/universal; survey = empty)
- Added `QuickActionsBlock` component: compact buttons under detail-status-row; active status highlighted/disabled; hidden for survey
- Added `actionLabel` helper

#### Part 2 — Needs attention stat
- Added `ATTENTION_STATUSES` map per scenario
- `stats.attention` computed in useMemo
- 4th ws-stat shows "Needs attention / Требуют внимания / Назар қажет" (for non-survey)
- Highlighted in amber (`ws-stat--attention`) when count > 0
- For survey: 4th stat stays as "Новые"

#### Part 3 — Survey insights panel
- Added `SurveyInsightsPanel` component: total/today/last7 stats + popular answers (from loaded items)
- Shown above toolbar when `scenario === "survey"` and items.length > 0
- Table count label: "Ответы/Responses" for survey

#### Part 4 — Admissions polish
- Added `admissionsAiHint` box inside details panel (left-border card style)
- Shown only when `scenario === "admissions"`
- QuickActionsBlock visible and prominent for admissions

#### Part 5 — WhatsApp block clarity
- Collapsed state now shows: On/Off status pill + masked phone (if enabled)
- Added `whatsapp-demo-helper` text at bottom of expanded body
- Translated in all 3 languages

#### CSS added
- `.quick-action-row`, `.quick-action-btn`, `.quick-action-btn--active`
- `.survey-insights-card`, `.survey-insight-stat`, `.survey-insights-q`
- `.whatsapp-status-pill--on/off`, `.notif-phone-masked`, `.whatsapp-demo-helper`
- `.admissions-ai-hint`
- `.ws-stat--attention`

#### Checks
- `npm run build` frontend ✓
- No emoji found in JSX/CSS ✓
- `git diff --stat`: 3 files, +455 lines ✓

#### How to test manually
1. Open a form workspace with **admissions** scenario
2. Click any submission row → details panel opens
3. See quick action buttons (Contacted / Documents needed / Accept / Reject)
4. Click a button → status updates, button becomes active/disabled
5. Switch to **survey** scenario → survey insights panel appears above table; quick actions hidden
6. Check **WhatsApp** block collapsed → shows "On" / "Off" pill
7. Expand WhatsApp block → demo helper text appears at bottom
8. Check 4th stat: shows "Needs attention" for CRM scenarios, "New" for survey

## Recently Completed

### Guided Google Forms setup modal (2026-05-31)

Files changed:
- `frontend/src/components/GuidedSetupModal.jsx` — new component; 3-step guided setup modal
- `frontend/src/pages/MyFormsPage.jsx` — imports modal; "Connect" button replaces "Add to FormBridge"; connected forms show "Open workspace" link; modal state passed with formId/formTitle/googleEmail
- `frontend/src/shared/i18n.js` — 44 new keys in kk/ru/en (connectForm, openWorkspace, connectGoogleForm, setupIntro, all step/instruction/screenshot keys)
- `frontend/src/shared/styles/global.css` — 480+ lines added for setup modal styles

#### Modal UX flow:
1. User clicks "Connect" on any unconnected Google Form
2. Modal opens → silently calls `POST /api/integrations/forms/setup-google` (creates integration + tries to create Google Sheet)
3. **Step 1** — if `sheetId` returned → "Sheet linked"; else shows "Open Google Form" + "Check again"
4. **Step 2** — unlocked when Step 1 is "found"; "Prepare setup" calls `POST /api/integrations/forms/:id/auto-setup` → returns `scriptUrl`; "Open Google setup" opens Apps Script with AccountChooser URL; locked state if Step 1 not done
5. **Step 3** — unlocked when Step 2 prepared/opened; "Verify connection" calls `POST /api/integrations/forms/:id/verify`; shows checklist cards (Sheet/AutoDelivery/Webhook/Test); shows "Connection ready" + "Open workspace" on success

#### What is real vs placeholder:
- **Real**: all 3 endpoints (`setup-google`, `auto-setup`, `verify`), account-aware AccountChooser URLs, step locking logic, integration state derivation
- **Placeholder**: 9 screenshot slots (dashed border, "Add screenshot later" text) — visually rendered but no actual images

#### Screenshot placeholders locations:
- Step 1 accordion: "Screenshot: Responses tab", "Screenshot: Link to Sheets button", "Screenshot: Create spreadsheet"
- Step 2 accordion: "Screenshot: select installFormBridge", "Screenshot: Run button", "Screenshot: Allow permissions"

#### How to test with a new Google account:
1. Log in to FormBridge, connect Google account via `/forms`
2. Click "Connect" on any form
3. Modal opens; it auto-calls `setup-google` — if Google Drive API works, Step 1 should show "Sheet linked" immediately
4. If Step 1 missing: open the Google Form, go to Responses → Link to Sheets → Create new spreadsheet, then "Check again"
5. Step 2: click "Prepare setup" — requires Google Apps Script API enabled; returns scriptUrl
6. Click "Open Google setup" → opens Apps Script with your Google account; run `installFormBridge`
7. Return to modal, click "Verify connection"

#### CSS classes added:
`.setup-modal-backdrop`, `.setup-modal`, `.setup-header`, `.setup-step`, `.setup-step-locked`, `.setup-step--done`, `.setup-status-pill`, `.pill-ok/missing/checking/locked`, `.setup-actions`, `.setup-btn-primary/secondary`, `.setup-accordion`, `.setup-screenshot-grid`, `.setup-screenshot-placeholder`, `.setup-check-grid`, `.setup-check-item`, `.setup-ready-banner`, `.setup-reason-list`

Build: `npm run build` ✓
No emoji found ✓
Commit: bd77f23

## Next Planned Tasks

- Add actual screenshots to GuidedSetupModal placeholders
- Check production deploy with updated CSS
- Consider PDF/Word export report
- Consider adapting scenario card icon colors via CSS colorClass
