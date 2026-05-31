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

## Next Planned Task

- Consider adapting scenario card icon colors via CSS colorClass
- Survey scenario analytics workspace improvements
