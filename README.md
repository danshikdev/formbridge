# FormBridge

FormBridge is a SaaS-style CRM layer for Google Forms submissions.

Current target flow:

```text
Login -> Connect Google -> Select Form -> Verify Setup -> Done
```

The existing confirmed ingestion path is still supported:

```text
Google Form -> linked Sheet -> Apps Script onSheetFormSubmit -> webhook -> Express -> PostgreSQL -> React CRM
```

## What is implemented

- React/Vite frontend and Express/Sequelize/PostgreSQL backend.
- JWT auth: register, login, me.
- Google Forms webhook ingestion: `POST /api/forms/webhook/google`.
- Webhook secret validation with `x-formbridge-secret`.
- Deduplication by `responseId`.
- Requests CRM page with filters, details, and status flow: `new`, `in_progress`, `done`, `test`.
- Integrations wizard with manual fallback.
- Google OAuth-ready flow:
  - `GET /api/google/oauth/status`
  - `POST /api/google/oauth/start`
  - `GET /api/google/oauth/callback`
  - `GET /api/google/forms`
- Integration automation scaffold:
  - select Google Form
  - create/check integration record
  - create response spreadsheet via Sheets API
  - generate/store webhook URL and secret
  - verify setup checklist
- Integrations Health page:
  - connected/broken/needs_trigger state
  - last event time
  - last error reason
  - run test
  - verify setup
- Ingestion observability with `integration_events` logs.

## Run backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend defaults to `http://localhost:4000`.

Important local env values:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:4000
FORMBRIDGE_WEBHOOK_SECRET=formbridge_dev_secret_2026
DB_SYNC_ALTER=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google/oauth/callback
GOOGLE_OAUTH_SUCCESS_URL=http://localhost:5173/connect?google=connected
GOOGLE_OAUTH_ERROR_URL=http://localhost:5173/connect?google=error
```

For ngrok or another public tunnel, update `PUBLIC_BASE_URL` to the current public backend URL. The ngrok URL changing is expected and affects webhook verification.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend defaults to `http://localhost:5173` and calls backend at `http://localhost:4000`.

## Google Cloud setup needed next

Create or reuse a Google Cloud project, then enable:

- Google Drive API
- Google Sheets API
- Google Forms API
- Apps Script API

Create an OAuth Client and add this redirect URI:

```text
http://localhost:4000/api/google/oauth/callback
```

Then fill:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Important note about full auto trigger install

The backend now has the OAuth and integration automation foundation. The remaining Google-specific step is finalizing Apps Script project/trigger installation after OAuth credentials are available and APIs are enabled. Until then, the previously confirmed Apps Script + linked Sheet ingestion flow remains as the reliable fallback.
