import { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";
import { HomeIcon, ArrowRightStartOnRectangleIcon, GlobeAltIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { LoginPage } from "../pages/LoginPage.jsx";
import { ProfilePage } from "../pages/ProfilePage.jsx";
import { RequestsPage } from "../pages/RequestsPage.jsx";
import { MyFormsPage } from "../pages/MyFormsPage.jsx";
import { IntegrationHealthPage } from "../pages/IntegrationHealthPage.jsx";
import { LANGUAGES } from "../shared/i18n";
import { useLocale } from "../shared/useLocale";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("fb_token");
  return token ? children : <Navigate to="/login" replace />;
}

function LanguageGate({ setLang, text }) {
  return (
    <section className="card auth-card language-card">
      <h1>{text.chooseLanguage}</h1>
      <div className="lang-grid">
        {LANGUAGES.map((item) => (
          <button key={item.code} type="button" className="ghost-btn" onClick={() => setLang(item.code)}>
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function TopBar({ t, lang, setLang }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("fb_token");
  const [menuOpen, setMenuOpen] = useState(false);

  function logout() {
    localStorage.removeItem("fb_token");
    setMenuOpen(false);
    navigate("/login");
  }

  return (
    <header className="topbar clean-topbar">
      <Link to="/forms" className="brand">
        <span className="brand-mark"><HomeIcon className="icon-sm" /></span>
        <span>{t.appName}</span>
      </Link>
      <div className="topbar-actions">
        <label className="lang-control" aria-label="Language switcher">
          <GlobeAltIcon className="icon-sm" />
          <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>{item.label}</option>
            ))}
          </select>
        </label>
        {token ? (
          <div className="account-menu-wrap">
            <button className="account-icon-btn" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={t.account}>
              <UserCircleIcon className="account-icon" />
            </button>
            {menuOpen ? (
              <div className="account-dropdown">
                <Link to="/profile" onClick={() => setMenuOpen(false)}>{t.openProfile}</Link>
                <button type="button" onClick={logout}><ArrowRightStartOnRectangleIcon className="icon-sm" />{t.logout}</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function App() {
  const { lang, setLang, t, hasLanguage } = useLocale();
  const location = useLocation();
  const [toast, setToast] = useState("");

  useEffect(() => {
    const nextToast = sessionStorage.getItem("fb_toast");
    if (!nextToast) return;

    setToast(nextToast);
    sessionStorage.removeItem("fb_toast");
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <TopBar t={t} lang={lang || "en"} setLang={setLang} />
      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-icon">✓</span>
          <span>{toast}</span>
        </div>
      ) : null}
      <main className="page-wrap">
        {!hasLanguage ? (
          <LanguageGate setLang={setLang} text={t} />
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage t={t} />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage t={t} /></ProtectedRoute>} />
            <Route path="/forms" element={<ProtectedRoute><MyFormsPage /></ProtectedRoute>} />
            <Route path="/connect" element={<Navigate to="/forms" replace />} />
            <Route path="/requests" element={<Navigate to="/forms" replace />} />
            <Route path="/forms/:formId/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute><IntegrationHealthPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/forms" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
