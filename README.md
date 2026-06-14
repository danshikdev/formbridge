# FormBridge

FormBridge is a scenario-based CRM layer for Google Forms. It pulls your form responses via the Google Forms API and gives you a workspace with request management, analytics, AI assistant, and WhatsApp notifications.

One Google Form = one workspace. Each workspace can run in a scenario: **universal**, **admissions**, **hr**, **survey**, **client_requests**, or **event**.

---

## Requirements

- Node.js 18+
- PostgreSQL 14+
- A Google Cloud project with OAuth 2.0 credentials
- An OpenAI API key (only needed for the AI assistant feature)

---

## 1. Clone the repository

```bash
git clone https://github.com/your-username/FormBridge.git
cd FormBridge
```

---

## 2. Set up Google Cloud Console

FormBridge uses Google OAuth to let users connect their Google account and read their Forms responses. Without this step, login and form sync will not work.

### 2a. Create a project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)

### 2b. Enable APIs

Inside your project go to **APIs & Services → Library** and enable:

- **Google Forms API**
- **Google Drive API**
- **Google Sheets API**

### 2c. Configure OAuth consent screen

Go to **APIs & Services → OAuth consent screen**:

- User type: **External**
- App name: `FormBridge` (or any name)
- Support email: your email
- Scopes — add these manually:
  - `https://www.googleapis.com/auth/forms.body.readonly`
  - `https://www.googleapis.com/auth/forms.responses.readonly`
  - `https://www.googleapis.com/auth/drive.metadata.readonly`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
- Under **Test users** — add your own Google account while the app is in testing mode

### 2d. Create OAuth 2.0 credentials

Go to **APIs & Services → Credentials → Create credentials → OAuth 2.0 Client ID**:

- Application type: **Web application**
- Authorized redirect URIs — add both:
  ```
  http://localhost:4000/api/auth/google/callback
  http://localhost:4000/api/google/oauth/callback
  ```

After saving, copy the **Client ID** and **Client Secret** — you will need them in the next step.

---

## 3. Set up the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in the required values:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=any_random_string_here

# PostgreSQL — create a local database named "formbridge"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=formbridge
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false
DB_SYNC_ALTER=true

CORS_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:4000

# Paste your Google Cloud credentials here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Leave these as-is for local development
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google/oauth/callback
GOOGLE_LOGIN_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
GOOGLE_OAUTH_SUCCESS_URL=http://localhost:5173/forms
GOOGLE_OAUTH_ERROR_URL=http://localhost:5173/forms?google=error
GOOGLE_LOGIN_SUCCESS_URL=http://localhost:5173/login
GOOGLE_LOGIN_ERROR_URL=http://localhost:5173/login?google=error

# AI assistant — get a key at platform.openai.com
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Create the database (if it does not exist yet):

```bash
psql -U postgres -c "CREATE DATABASE formbridge;"
```

Install dependencies and start the backend:

```bash
npm install
npm run dev
```

Backend runs at `http://localhost:4000`. On first start, Sequelize will auto-create all tables.

---

## 4. Set up the frontend

```bash
cd ../frontend
```

Create a `.env` file:

```bash
echo "VITE_API_URL=http://localhost:4000/api" > .env
```

Install dependencies and start:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 5. Open the app

1. Go to `http://localhost:5173`
2. Register an account
3. Click **Connect Google** and authorize with your Google account (use the test user you added in step 2c)
4. Select a Google Form from your account
5. Enable polling — FormBridge will start syncing responses every 30 seconds

---

## Project structure

```
FormBridge/
├── backend/         Express + Sequelize + PostgreSQL API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── .env.example
├── frontend/        React + Vite SPA
│   └── src/
│       ├── pages/
│       ├── components/
│       └── shared/
└── scripts/         Server deploy script (for production use)
```

---

## Notes

- The Google OAuth app stays in **testing mode** until you submit it for Google verification. In testing mode only accounts listed under **Test users** in Google Cloud Console can log in.
- The AI assistant requires a valid `OPENAI_API_KEY`. Without it the AI tab will return errors but everything else works normally.
- WhatsApp notifications use a WhatsApp Web session stored locally in `backend/whatsapp-session/`. This is an MVP integration and may require re-scanning the QR code after restarts.
