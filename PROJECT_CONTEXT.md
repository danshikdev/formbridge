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
- Guided setup Step 1 must not create a new Sheet automatically on modal open.
- Guided setup Step 1 supports two cases:
  - If Google Forms already shows "View in Sheets" / "Посмотреть в Таблицах", user opens that existing linked Sheet and pastes its URL into FormBridge.
  - If the form has no Sheet yet, user can ask FormBridge to create a new prepared Sheet.
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
- https://formbridge.shora.site

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

Completed (2026-06-20 11:23 +05):
- Defense prep package created from the finished diploma thesis and existing presentation.
- Presentation narrative improved for defense clarity:
  - problem and relevance
  - product goal and novelty
  - scenario-based CRM model
  - practical value
  - comparison with alternatives
  - future development direction
- Created Kazakh defense cheat sheet with:
  - short slide-by-slide speaking text
  - ultra-short cue prompts
  - fallback spoken phrases if the presenter gets stuck
  - likely defense questions with concise natural answers
- External deliverables saved to:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_2026_final.pptx`
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.docx`
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.txt`
- Checks / commands run:
  - `git status --short`
  - inspected today plan note for “Съесть лягушку”
  - extracted thesis structure/text from `Диплом FormBridge.docx`
  - rendered and visually reviewed updated PPTX slides
  - rendered and visually reviewed cheat sheet DOCX pages
  - checked common thesis/viva defense patterns on the internet to expand the Q&A block
- Files changed in repo:
  - `PROJECT_CONTEXT.md`
- Current risks / notes:
  - presenter should rehearse once aloud and cut any personally awkward phrasing
  - the Q&A block is intentionally broad; some items can be removed after one practice run
- Recommended next steps:
  - rehearse once with the new deck
  - trim 3-5 unnecessary Q&A items after rehearsal
  - optionally prepare a one-page ultra-short paper cue sheet later

Updated (2026-06-20 23:50 +05):
- Defense cheat sheet was rewritten after review because the first version was too short and not tightly connected to the slide flow.
- New cheat sheet structure:
  - follows the presentation slide by slide
  - explains what each slide is for
  - gives fuller spoken wording
  - adds explicit transition lines to the next slide
  - keeps a shorter Q&A block for likely commission questions
- Updated external deliverables:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.docx`
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.txt`
- Checks / commands run:
  - rebuilt DOCX/TXT cheat sheet
  - rendered DOCX pages and visually reviewed layout
- Current risks / notes:
  - this version is stronger for speaking, but it is still helpful to mark 2-3 personal phrasing tweaks after one live rehearsal
- Recommended next steps:
  - rehearse once directly with the presentation and this new cheat sheet side by side
  - if needed, make one more version with even more everyday spoken Kazakh and fewer formal words

Updated (2026-06-21 00:42 +05):
- Defense cheat sheet refined again after review to restore an important practical feature that was missing from the spoken flow:
  - added a dedicated spoken WhatsApp notifications block immediately after slide 9 (reports/export)
  - explained the practical pain point: user may be away from the screen and still needs timely updates
  - documented the 3 WhatsApp modes in the speaking script:
    - every new submission
    - threshold-based alert (example: after 5 requests)
    - daily summary at a selected time
  - clarified that the message can include form info and a quick link back to CRM workspace
- Updated external deliverables:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.docx`
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.txt`
- Checks / commands run:
  - re-checked diploma and code references for WhatsApp notification modes
  - rebuilt DOCX/TXT cheat sheet
  - rendered DOCX pages and visually reviewed updated layout
- Recommended next steps:
  - rehearse the slide 9 → WhatsApp block → slide 10 transition aloud 2-3 times
  - if needed later, add one more vivid spoken example specifically for admissions scenario

Updated (2026-06-21 01:05 +05):
- Defense cheat sheet expanded again after the latest review so the spoken flow now matches the real workspace tabs and demo order more closely.
- Added explicit spoken blocks for:
  - `Аналитика` after the workspace slide
  - `WhatsApp` with all 3 notification modes after reports/export
  - `Ұсыныс` as a separate practical product-improvement tab
- Reworked the slide-by-slide text so the presenter can explain:
  - what pain each module solves
  - what value it gives in practice
  - how the transition between modules sounds in natural speech
- Expanded the Q&A block with direct short answers about analytics, WhatsApp modes, and the feedback tab.
- Updated external deliverables:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.docx`
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.txt`
- Checks / commands run:
  - re-checked workspace tab names and notification modes in code
  - rebuilt DOCX/TXT cheat sheet
  - rendered DOCX pages and visually reviewed layout after the rewrite
- Current risks / notes:
  - the script is now fuller and stronger for explanation, but the presenter should still mark 2-3 sentences that feel most natural personally
  - the Q&A table is intentionally broad; after one rehearsal it can be trimmed if needed
- Recommended next steps:
  - rehearse the sequence `workspace -> analytics -> AI -> reports -> WhatsApp -> feedback`
  - if needed later, prepare an even shorter pocket version from this fuller script

Updated (2026-06-21 10:20 +05):
- Reviewed the current defense deck structure in `FormBridge_Qorghau_2026_slide3_reworked.pptx` to decide what to keep, merge, or remove before the next round of slide edits.
- Key observations:
  - slide 4 (3-step system flow) is a strong structural slide and can absorb the login + quick connection video story
  - slide 5 (`Формалар тізімі`) is a weaker standalone step and is a likely candidate for removal or merge
  - slide 6 (CRM workspace) remains a core demo slide and should stay
  - analytics, WhatsApp, and translations are still better as separate practical slides if time allows
  - conclusion future-direction text still needs cleanup because Word/PDF export already exists
- Checks / commands run:
  - `git status --short`
  - reviewed current slide text extracted from `FormBridge_Qorghau_2026_slide3_reworked.pptx`
  - listed available PPTX versions in the diploma folder
- Current risks / notes:
  - the deck can become too fragmented if every small concept gets its own slide
  - better to spend slide budget on connection demo, CRM, analytics, WhatsApp, and multilingual support than on weaker bridge slides
- Recommended next steps:
  - merge or drop the standalone forms-list demo slide
  - rebuild slide 4 around `login -> connect form -> CRM workspace`
  - then continue refining the rest of the deck one slide at a time

Completed (2026-06-02):
- Workspace tabs redesign — all tabs improved:
  - Аналитика: SVG donut chart + 14-day timeline bar chart. All scenario statuses shown dynamically.
  - WhatsApp: removed collapsible, settings shown directly.
  - Отчеты: replaced dropdown export with visual card grid + summary stats row.
  - AI помощник: chat history persisted in localStorage keyed by formId (survives refresh).
  - Ұсыныс/Предложения: added GET /api/forms/:formId/feedback endpoint + FeedbackPanel loads history on mount.
  - SurveyInsightsPanel removed (duplicate of analytics tab).
  - Fixed React hooks violation in ReportPreviewModal (useMemo after conditional return).
- Files changed:
  - backend/src/controllers/googleFormsController.js — added getFeedback
  - backend/src/routes/googleFormsRoutes.js — added GET /:formId/feedback
  - frontend/src/pages/RequestsPage.jsx — all UI improvements
  - frontend/src/shared/i18n.js — added analyticsLast14Days, filterApplied keys
  - frontend/src/shared/styles/global.css — new CSS for donut, timeline, reports cards

Previous completed:
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
  - https://formbridge.shora.site/api/auth/google/callback
  - https://formbridge.shora.site/api/google/oauth/callback
- AI chat currently uses recent form requests as context.
- Survey scenario still needs a more analytics-focused workspace.
- HR/admissions scenarios need better quick actions later.
- WhatsApp notifications exist as MVP but should later adapt to scenarios.
- WhatsApp phone numbers are normalized to Kazakhstan format (`+7XXXXXXXXXX`) from common inputs such as `8...`, `77...`, or `+7...`.
- WhatsApp daily summary mode is real MVP behavior: user chooses a send time, backend scheduler checks every minute in Asia/Almaty time, and sends today's form request counts once per day.
- Export should later support PDF/Word/Excel reports.

## Recently Completed

### Premium Header Actions Dropdown & Google Form/Sheet Links (2026-05-31)

Files changed:
- `backend/src/controllers/googleFormsController.js` — updated `getWorkspace` API to return `formUrl` and `sheetUrl` inside the `form` object.
- `frontend/src/pages/RequestsPage.jsx` — imported `IconChevronDown` and `IconFeedback`; defined dropdown states and outside-click handling; replaced the individual feedback button with a beautiful, premium Actions Dropdown (`ws-actions-dropdown-container`) next to "My Forms" button; dropdown contains "Open Google Form" (external link using `formUrl`), "Open Google Sheet" (external link using `sheetUrl`), and "Suggest improvement" (opens feedback modal).
- `frontend/src/shared/i18n.js` — added `actionsDropdown`, `openGoogleForm`, and `openGoogleSheet` translation keys in kk, ru, and en locales.
- `frontend/src/shared/styles/global.css` — added premium CSS rules for actions dropdown trigger, rotation animation on chevron, dropdown menu pop animation, z-indexes, and dropdown hover item states (Handoff HSL tailoring).

Checks passed:
- `npm run build` frontend build verified ✓
- `node --check` backend controller syntax verified ✓

## Recently Completed

### Robust, scenario-aware WhatsApp daily summaries (2026-05-31)

Files changed:
- `backend/src/services/notificationScheduler.js` — imported `getScenario`; defined `STATUS_LABELS_KK` and `getStatusLabelKK` to support all 17 system statuses; rewrote `buildDailySummaryMessage` to load all requests from today, group them by status, and output active status counts in order of the active scenario's `statusFlow`; updated `runDailySummaryTick` to check `dailyTime` with `{ [Op.lte]: now.time }` for robust time tracking against scheduler drift or restarts.

Checks passed:
- `node --check` backend scheduler ✓
- `git diff` validated ✓

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

### Guided Google Forms setup modal (superseded by 2-step flow, 2026-05-31)

Files changed:
- Original modal was introduced here, but its old 3-step description is superseded by the current 2-step MVP flow below.
- Do not reintroduce a separate Step 3, copy-link button, placeholder screenshots, or test-event card in the main setup flow.

## Recently Completed

### Polish guided setup to clean 2-step MVP (2026-05-31)

Files changed:
- `frontend/src/components/GuidedSetupModal.jsx` — removed step3 concept; verification folded into step2; opening Apps Script no longer marks step as done; step2 states: locked/ready/prepared/done/failed; `setupComplete = step2Status === "done"`
- `frontend/src/shared/i18n.js` — setupIntro: "3" changed to "2" in kk/ru/en; setupAutoPrepared: changed from "ready/дайын/готов" to "prepared/дайындалды/подготовлен"

Guided setup is now a 2-step UI:
- Step 1: choose the prepared Sheet inside Google Forms
- Step 2: run Apps Script installer (`installFormBridge`) and verify trigger
- No copy-link button in the main setup flow
- No test-event card in the main setup verification
- Step 2 must stay locked until the user clicks "Check" in Step 1 and sees the Sheet verified message.
- Trigger readiness is confirmed via POST `/api/integrations/forms/:id/setup-confirm` callback from Apps Script
- Step 2 is NOT done when Apps Script is opened; only done after trigger verify passes
- Success celebration with checkmark pop + spark animation shown inside Step 2

Checks:
- `npm run build` frontend pass
- `node --check` all backend JS pass
- `rg` confirms zero matches for: step3, "3 steps", copy link, test event in active UI

## Recently Completed

### Remove Apps Script / webhook approach (2026-06-03)

Connection approach changed from Apps Script/webhook to Google Forms API polling only.

Files changed:
- `backend/src/services/googleService.js` — removed `getDriveFile`, `createSpreadsheet`, `createAppsScriptProject`, `updateAppsScriptContent`, `checkAppsScriptApi`, `buildWebhookUrl`; removed unused `dotenv` import
- `backend/src/controllers/integrationsController.js` — removed all Apps Script helpers (`buildInstallerCode`, `buildAppsScriptFiles`, `buildAppsScriptTemplate`, `buildDisabledAppsScriptFiles`, `scriptEditorUrl`, `resolveUsableLinkedSheet`, `escapeForScript`); removed exported controllers (`confirmSetupInstalled`, `checkAppsScriptApiStatus`, `autoSetupIntegration`, `getSetupScript`, `prepareIntegrationSheet`, `attachExistingSheet`, `saveWebhook`, `testIntegration`); simplified `setupGoogleIntegration` (no sheet creation), `deleteIntegration` (no Apps Script cleanup), `verifyIntegrationRecord` (polling-only checklist); removed `scriptProjectId`/`sheetId`/`webhookUrl`/`triggerId` from `publicIntegration`
- `backend/src/routes/integrationsRoutes.js` — removed routes: `POST /forms/:id/setup-confirm`, `GET /forms/:id/setup-script`, `POST /apps-script-api/check`, `POST /forms/:id/auto-setup`, `POST /forms/:id/prepare-sheet`, `PATCH /forms/:id/sheet`, `PATCH /forms/:id/webhook`, `POST /forms/:id/test`
- `frontend/src/pages/IntegrationHealthPage.jsx` — removed legacy Apps Script section (auto-setup, test webhook, setup script buttons and state)

Current connection flow:
1. `POST /api/integrations/forms/setup-google` — creates integration record, reads form title
2. `POST /api/integrations/forms/:id/enable-polling` — connects via Google Forms API, syncs all responses

Checks:
- `node --check` all backend files ✓
- `npm run build` frontend ✓

## Recently Completed

### Add /privacy page (2026-06-03)

Files changed:
- `frontend/src/pages/PrivacyPage.jsx` — new page with Privacy Policy in kk/ru/en; covers data collected, OAuth scopes justification, storage, deletion, contact
- `frontend/src/app/App.jsx` — import + public route `/privacy`
- `frontend/src/shared/styles/global.css` — CSS for `.privacy-sections`, `.privacy-list`, `.privacy-note`, `.privacy-contact`, `.privacy-updated`

Build: `npm run build` ✓

Purpose: Required for Google OAuth Verification (restricted scopes).
URL: https://formbridge.shora.site/privacy

## Recently Completed

### Docker setup for diploma demo (2026-06-15)

Files created:
- `backend/Dockerfile` — Node 20 Debian slim + Chromium deps for whatsapp-web.js; runs `node src/server.js`
- `backend/.dockerignore` — excludes node_modules, .env, whatsapp-session
- `frontend/Dockerfile` — multi-stage: build with node:20-alpine, serve with nginx:stable-alpine
- `frontend/nginx.conf` — SPA routing (try_files → index.html) + gzip
- `frontend/.dockerignore` — excludes node_modules, dist, .env
- `docker-compose.yml` — 3 services: postgres:16-alpine, backend (port 4000), frontend (port 5173)
- `.env.docker.example` — template with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY, JWT_SECRET, ADMIN_EMAILS
- `.gitignore` — added `!.env.docker.example` exception

How to run on a new computer:
1. Install Docker Desktop
2. `git clone <repo>`
3. `cp .env.docker.example .env.docker`
4. Fill in values in `.env.docker` (carry on USB drive)
5. `docker compose up --build`
6. Open http://localhost:5173

Notes:
- DB is auto-created and synced by Sequelize on first start (DB_SYNC_ALTER=true)
- WhatsApp session persists via Docker named volume `whatsapp_session`
- Frontend defaults to `http://localhost:4000` for API (no VITE_API_URL needed)
- Google OAuth redirect URIs in Google Cloud Console must include localhost:4000 variants

Operational requirement:
- Google Cloud Console → Authorized redirect URIs must have:
  - `http://localhost:4000/api/auth/google/callback`
  - `http://localhost:4000/api/google/oauth/callback`

## Next Planned Tasks

- Deploy to production (add /privacy to OAuth consent screen in Google Cloud Console)
- Submit for Google OAuth verification after deploying
- Consider PDF/Word export report

Updated (2026-06-21 08:48 +0500):
- Defense presentation title slide was refined visually without changing the overall deck style.
- Changed only slide 1 of the defense deck:
  - kept the official title-slide structure
  - added a calm horizontal 3-block scheme to explain the product idea immediately:
    - Google Forms
    - FormBridge
    - Жауаптарды басқару жүйесі
  - kept screenshots off the title slide because interface visuals remain on later slides
  - preserved the rest of the presentation unchanged
- New external deliverable created:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_2026_slide1_update.pptx`
- Checks / commands run:
  - inspected source PPTX slide structure and rendered title slide preview
  - created template-following starter deck from the existing presentation
  - rebuilt slide 1 and rendered final preview for visual QA
  - ran template fidelity check on the final PPTX
- Current risks / notes:
  - the updated deck is a separate copy; the original final presentation remains untouched
  - if needed later, only minor text micro-adjustments should be considered, not layout changes
- Recommended next steps:
  - open the new PPTX once in PowerPoint/Keynote and quickly verify local font rendering on the presentation laptop
  - use this updated copy as the defense deck if the title-slide balance feels right in fullscreen mode

Updated (2026-06-21 09:37 +0500):
- Defense presentation problem slide was redesigned using real evidence screenshots instead of abstract-only cards.
- Changed only slide 2 of the defense deck:
  - kept the slide in the same clean official deck style
  - used attached Google Forms and Google Sheets screenshots as proof of the problem
  - reframed the slide around 4 short pain points:
    - `Бақылау ыңғайсыз`
    - `Жылдам әрекет ету қиын`
    - `Статус жоқ`
    - `Талдау бірден көрінбейді`
  - added a short concluding statement that Google Forms is convenient for collecting responses but insufficient for full management
- New external deliverable created:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_2026_slide2_update.pptx`
- Checks / commands run:
  - re-read `AGENTS.md`, `PROJECT_CONTEXT.md`, and `git status --short`
  - inspected current PPTX structure and slide 2 layout
  - rendered source slide 2 and reviewed attached screenshots
  - created template-following starter deck from the existing presentation
  - rebuilt slide 2 and rendered final preview for visual QA
  - ran template fidelity check on the final PPTX
- Current risks / notes:
  - the updated deck is a separate copy; the original final presentation remains untouched
  - screenshots are intentionally used only as problem evidence on this slide and not as FormBridge comparison UI
- Recommended next steps:
  - open the new PPTX once in fullscreen and check whether the title-to-images spacing feels comfortable on the presentation laptop
  - if needed later, only fine-tune wording on the short pain labels, not the overall slide structure

Updated (2026-06-21 09:55 +0500):
- Defense presentation slide 3 (`goal and solution`) was redesigned into a clearer flow diagram.
- Changed only slide 3 of the defense deck:
  - kept the dark branded style of the original slide
  - replaced the previous slogan-like layout with a clear visual chain:
    - `Google Forms жауаптары`
    - `FormBridge`
    - `Басқарылатын жұмыс процесі`
  - added short supporting accents below the scheme:
    - `Статус`
    - `Бақылау`
    - `Аналитика`
    - `AI`
    - `WhatsApp`
    - `Есептер`
  - kept the slide concise so it works as a bridge from the problem slide to the product walkthrough
- New external deliverable created:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_2026_slide3_update.pptx`
- Checks / commands run:
  - re-read `AGENTS.md`, `PROJECT_CONTEXT.md`, and `git status --short`
  - re-read the presentations skill instructions
  - inspected the current PPTX structure and slide 3 layout
  - created a template-following starter deck from the existing presentation
  - rebuilt slide 3 and rendered final preview for visual QA
  - ran template fidelity check on the final PPTX
- Current risks / notes:
  - in the defense materials folder, the file available as the source during this update was `FormBridge_Qorghau_2026.pptx`; the previously referenced `FormBridge_Qorghau_2026_final.pptx` was not present at the time of editing
  - the updated deck is a separate copy; the source presentation remains untouched
- Recommended next steps:
  - open the new PPTX once in fullscreen and confirm the center contrast feels strong enough on the presentation laptop
  - if needed later, only fine-tune the final sentence wording, not the main diagram structure

Updated (2026-06-21 10:27 +0500):
- Defense presentation slide 3 was fully reworked again because the previous version still felt too abstract.
- Changed only slide 3 of the defense deck:
  - replaced the source-to-workflow scheme with a more direct 3-part comparison:
    - `Google Forms`
    - `FormBridge`
    - `Жауаптарды басқару жүйесі`
  - showed the left block as concrete limitations:
    - `Статус жоқ`
    - `Бақылау шектеулі`
    - `Талдау қиын`
    - `Жылдам әрекет жоқ`
  - showed the right block as the practical result:
    - `Статус жүргізу`
    - `Бақылау`
    - `Аналитика`
    - `Жылдам әрекет`
  - removed the bottom module pills so the main comparison reads immediately in 2-3 seconds
  - kept the slide in the same dark, calm, official style as the deck
- New external deliverable created:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_2026_slide3_reworked.pptx`
- Files changed:
  - `PROJECT_CONTEXT.md`
  - temporary presentation build files under `/private/tmp/codex-presentations/formbridge-slide3-update/tmp`
- Checks / commands run:
  - re-read `AGENTS.md`, `PROJECT_CONTEXT.md`, and `git status --short`
  - re-used the presentation template-following workflow
  - rendered source and final slide previews for visual QA
  - ran template plan validation
  - ran deck inspection and template fidelity check on the final PPTX
- Current risks / notes:
  - the source file available during this edit was still `FormBridge_Qorghau_2026.pptx`; the user-requested `FormBridge_Qorghau_2026_final.pptx` was not present in the folder at edit time
  - the final deck is saved as a separate copy and does not overwrite the original presentation
- Recommended next steps:
  - open the reworked PPTX once in fullscreen on the defense laptop and confirm that the center card contrast looks comfortable from a distance
  - if needed later, only micro-adjust line breaks or font sizes, not the overall comparison logic

Updated (2026-06-21 11:06 +0500):
- Defense presentation flow after slide 4 was refined for the live demo part of the defense.
- Changed the working defense deck by inserting 2 new slides immediately after `Жүйе қалай жұмыс істейді`:
  - slide 5: `Google арқылы кіру`
  - slide 6: `Форманы жылдам қосу`
- Built both new slides from the existing demo-slide layout so they stay in the same deck style:
  - large central video-ready placeholder zone
  - short supporting thought
  - minimal accents without adding heavy technical text
- Reordered the next preserved slides to match the requested defense sequence:
  - slide 7: `Формалар тізімі`
  - slide 8: `Сценарийлер`
  - slide 9: `CRM жұмыс кеңістігі`
- New external deliverable saved to:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_2026_slide3_reworked.pptx`
- Files changed:
  - `PROJECT_CONTEXT.md`
  - temporary presentation build files under `/private/tmp/codex-presentations/formbridge-video-slides/tmp`
- Checks / commands run:
  - re-read `AGENTS.md`, `PROJECT_CONTEXT.md`, and `git status --short`
  - re-read the presentations skill instructions and template-following reference
  - inspected the current PPTX structure and rendered slide previews
  - created and validated a template-following starter deck
  - rebuilt the final PPTX and visually checked exported slides 5-9
  - re-inspected the exported PPTX to confirm final render order and appearance
- Current risks / notes:
  - the explicit save path requested by the user was `FormBridge_Qorghau_2026_slide3_reworked.pptx`, while the currently available source deck in the folder remained `FormBridge_Qorghau_2026.pptx`
  - the new video slides intentionally contain placeholders only; the user still needs to insert the real videos manually later
- Recommended next steps:
  - open the updated deck once in PowerPoint/Keynote and insert the real login/connect demo videos into slides 5 and 6
  - if needed later, tighten the bottom captions even further after one full-screen rehearsal

Updated (2026-06-21 11:33 +05):
- Defense presentation completely restructured from 14 to 18 slides.
- Final slide order:
  1. Титульный слайд (FormBridge)
  2. Мәселе (Problem)
  3. Мақсат және шешім (Goal/Solution)
  4. Жүйе қалай жұмыс істейді (How it works)
  5. Google арқылы кіру (Demo — video placeholder)
  6. Форманы жылдам қосу (Demo — video placeholder)
  7. Бір форма = бір workspace (NEW — key product logic)
  8. Сценарийлер (6 scenario cards)
  9. CRM жұмыс кеңістігі (Demo — screenshot placeholder)
  10. Аналитика (NEW — analytics module with 4 features)
  11. AI көмекші (repositioned from old slide 10)
  12. WhatsApp хабарламалары (NEW — 3 notification modes)
  13. Есептер / Экспорт (repositioned)
  14. Көптілділік (NEW — KZ/RU/EN multilingual)
  15. Архитектура және технологиялар (repositioned)
  16. Неге дәл FormBridge? (Comparison table)
  17. Болашақ даму (NEW — realistic future roadmap)
  18. Қорытынды (updated features list)
- Changes made:
  - Dropped old slide 7 "Формалар тізімі", replaced with "Бір форма = бір workspace"
  - Added Analytics as its own dedicated slide after CRM workspace
  - Added WhatsApp as a dedicated slide with 3 modes explained
  - Added multilingual slide showing KZ/RU/EN support
  - Added separate future development slide (was only a row in conclusion)
  - Updated conclusion's features row to include Analytics, WhatsApp, and Multilingual
  - Changed conclusion's "Болашақ даму" row to "Техникалық іске асыру" (tech stack summary)
- External deliverable:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdана/FormBridge_Qorghau_2026.pptx` (overwritten in place; backup is `FormBridge_Qorghau_2026_backup.pptx`)
- Slides needing manual media insertion:
  - Slide 5: insert video of Google OAuth login
  - Slide 6: insert video of form connection flow
  - Slide 9: insert screenshot of CRM requests table
  - Slide 10: insert screenshot of Analytics tab
  - Slide 11: insert screenshot of AI assistant chat
  - Slide 12: insert screenshot of WhatsApp settings tab
  - Slide 14: insert screenshot of language switcher (KZ/RU/EN)
- Recommended next steps:
  - open the new 18-slide deck in PowerPoint and visually review all slides
  - insert the real screenshots/videos into the placeholder slides
  - rehearse the defense following the new slide order

Updated (2026-06-21 14:24 +0500):
- The defense deck inside `/Users/erdanatursunov/Documents/Диплом лист/Erdana/powerpoint/FormBridge_Qorghau_2026.pptx` was updated in template-following mode by changing only slide 18 (`Болашақ даму` / roadmap).
- What changed on slide 18:
  - kept the existing real screenshot of the in-progress FormBridge form builder
  - reframed the slide from a generic roadmap into a clearer message about FormBridge moving toward its own form builder
  - changed the main title to `Өз форма конструкторы`
  - added a short right-side strategic line about reducing dependence on Google Forms
  - rewrote the right-side support block to show:
    - current progress: drag-and-drop, adding elements, existing field types
    - next improvements: deeper analytics, stronger scenarios, better reports
- Files changed:
  - `PROJECT_CONTEXT.md`
  - temporary presentation build files under `/private/tmp/codex-presentations/formbridge-plan-slide/tmp`
- Commands / checks run:
  - re-read `AGENTS.md`, `PROJECT_CONTEXT.md`, and `git status --short`
  - inspected all slides in the new PPTX and extracted slide texts to find the exact roadmap slide
  - ran template plan validation and starter-deck preparation
  - rebuilt only slide 18 and rendered final preview for visual QA
  - ran template fidelity check on the final PPTX
- Current risks / notes:
  - some paragraph-level bold styling inherited from the original text box remains in the right-side list, but the slide is visually clean and consistent enough for defense use
  - the source PPTX was overwritten in place only after visual QA and fidelity validation passed
- Recommended next steps:
  - open the updated deck once in PowerPoint/Keynote and quickly verify local font rendering on the defense laptop
  - if needed later, only micro-tune line breaks in the right-side list, not the slide structure

Updated (2026-06-21 14:39 +0500):
- The defense cheat sheet DOCX was updated to match the new slide order and the current presentation logic.
- Updated external document:
  - `/Users/erdanatursunov/Documents/Диплом лист/Erdana/FormBridge_Qorghau_Shpаrgalka_2026.docx`
- What changed:
  - rewrote the slide-by-slide speaking text from the old 12-slide flow to the current 19-slide defense structure
  - preserved the existing useful pattern:
    - `Не үшін бұл слайд`
    - `Айтатын мәтін`
    - `Келесі слайдқа өту`
  - aligned the speaking flow with the current deck sections:
    - Google login
    - fast form connection
    - one form = one workspace
    - analytics
    - WhatsApp
    - multilingual support
    - roles system
    - own form builder / future direction
  - refreshed the short commission Q&A table so it matches the new deck and roadmap
- Files changed:
  - `PROJECT_CONTEXT.md`
  - temporary DOCX build files under `/private/tmp`
- Commands / checks run:
  - re-read `AGENTS.md`, `PROJECT_CONTEXT.md`, and `git status --short`
  - extracted current DOCX text and reviewed the current PPTX slide order
  - rebuilt the DOCX content in a writable temp path
  - rendered the updated DOCX to PNG pages and visually reviewed all pages
- Current risks / notes:
  - the updated cheat sheet is longer than the old version because it now follows the full 19-slide deck
  - page 7 still has some free space after the Q&A table, but the document is visually clean and readable
- Recommended next steps:
  - read the new cheat sheet aloud once together with the current presentation
  - if needed later, trim only a few personal phrases for speaking comfort rather than changing the structure again

Updated (2026-06-21 14:45 +0500):
- Verified how demo videos are stored inside the current defense presentation:
  - checked `/Users/erdanatursunov/Documents/Диплом лист/Erdana/powerpoint/FormBridge_Qorghau_2026.pptx` as a PPTX package
  - slides 5 and 6 use embedded local media, not external video links
  - found internal files:
    - `ppt/media/media1.mov` for slide 5
    - `ppt/media/media2.mov` for slide 6
  - no `TargetMode="External"` relationships were found in the PPTX
- Commands / checks run:
  - inspected `ppt/media/*`
  - inspected `ppt/slides/_rels/slide5.xml.rels`
  - inspected `ppt/slides/_rels/slide6.xml.rels`
  - scanned all `.rels` files for external targets
- Current risks / notes:
  - the videos are embedded in the PPTX, so they should travel with the presentation file itself
  - playback on the defense laptop can still depend on local PowerPoint/Keynote codec support for `.mov`

Updated (2026-06-21 20:51 +0500):
- Workspace settings statuses were upgraded to support multilingual labels per custom status.
- What changed:
  - `WorkspaceSettingsTab` now lets the user fill status names for `KK`, `RU`, and `EN` in a compact grid
  - custom status rendering in the workspace now picks the label for the current UI language with fallback for older saved records
  - backend status saving now accepts and normalizes `translations` for custom statuses while staying compatible with older `label`-only entries
  - request status updates now allow custom status keys saved in the workspace settings, so added statuses are usable in the real request flow
- Files changed:
  - `frontend/src/components/WorkspaceSettingsTab.jsx`
  - `frontend/src/pages/RequestsPage.jsx`
  - `frontend/src/shared/statuses.js`
  - `frontend/src/shared/styles/global.css`
  - `frontend/src/shared/i18n.js`
  - `backend/src/controllers/integrationsController.js`
  - `backend/src/controllers/googleFormsController.js`
  - `PROJECT_CONTEXT.md`
- Commands / checks run:
  - `git status --short`
  - `npm run build` in `frontend`
  - `node --check src/controllers/integrationsController.js`
  - `node --check src/controllers/googleFormsController.js`
- Current risks / notes:
  - existing custom statuses without explicit translations will still display through fallback labels until the user fills language-specific values
  - unrelated local changes already existed in `frontend/src/components/GuidedSetupModal.jsx`, `AGENTS.md`, and `.serena/memories/`; they were left untouched
- Recommended next steps:
  - open the workspace settings screen and verify the new `KK / RU / EN` layout with real demo data
  - if needed later, extend the same translation-aware status labels into WhatsApp/backend-generated human text
