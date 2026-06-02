import { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRightStartOnRectangleIcon,
  GlobeAltIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { LoginPage } from "../pages/LoginPage.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { SolutionPage } from "../pages/SolutionPage.jsx";
import { ProfilePage } from "../pages/ProfilePage.jsx";
import { RequestsPage } from "../pages/RequestsPage.jsx";
import { MyFormsPage } from "../pages/MyFormsPage.jsx";
import { IntegrationHealthPage } from "../pages/IntegrationHealthPage.jsx";
import { AdminPage } from "../pages/AdminPage.jsx";
import { api } from "../api/client.js";
import { IconCheck } from "../shared/icons.jsx";
import { LANGUAGES } from "../shared/i18n";
import { useLocale } from "../shared/useLocale";

function ProtectedRoute({ children }) {
  const token = getStoredToken();
  return token ? children : <Navigate to="/login" replace />;
}

function getStoredToken() {
  try {
    return localStorage.getItem("fb_token");
  } catch {
    return "";
  }
}

function removeStoredToken() {
  try {
    localStorage.removeItem("fb_token");
  } catch {
    // ignore storage failures
  }
}

function getSessionItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return "";
  }
}

function removeSessionItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
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

function TopBar({ t, lang, setLang, isHome }) {
  const navigate = useNavigate();
  const token = getStoredToken();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [canOpenAdmin, setCanOpenAdmin] = useState(false);
  const homeNav = {
    kk: ["Мүмкіндіктер", "Қалай жұмыс істейді", "Шешімдер", "Баға", "Ресурстар", "Біз туралы"],
    ru: ["Функции", "Как работает", "Решения", "Цены", "Ресурсы", "О нас"],
    en: ["Features", "How it Works", "Solutions", "Pricing", "Resources", "About"]
  }[lang || "kk"] || ["Features", "How it Works", "Solutions", "Pricing", "Resources", "About"];
  const homeNavTargets = ["#features", "#workflow", "#solutions", "#pricing", "#resources", "#about"];

  useEffect(() => {
    if (!token) {
      setCanOpenAdmin(false);
      return undefined;
    }

    let alive = true;
    api.get("/api/admin/overview")
      .then(() => {
        if (alive) setCanOpenAdmin(true);
      })
      .catch(() => {
        if (alive) setCanOpenAdmin(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  function logout() {
    removeStoredToken();
    setMenuOpen(false);
    navigate("/login");
  }

  return (
    <header className="topbar clean-topbar home-topbar">
      <Link to={token ? "/" : "/"} className="brand">
        <span className="brand-mark"><img src="/icons/formbridge-icon-192.png" alt="" /></span>
        <span>{t.appName}</span>
      </Link>
      {isHome && !token ? (
        <nav className="home-nav-links" aria-label="Home navigation">
          {homeNav.map((label, index) => (
            <a key={label} href={homeNavTargets[index]}>{label}</a>
          ))}
        </nav>
      ) : null}
      <div className="topbar-actions">
        {isHome && !token ? <Link className="home-login-link" to="/login">{lang === "kk" ? "Кіру" : lang === "ru" ? "Войти" : "Log in"}</Link> : null}
        <div className="compact-lang-wrap">
          <button
            className="compact-lang-btn"
            type="button"
            aria-label="Language switcher"
            onClick={() => setLangOpen((value) => !value)}
          >
            <GlobeAltIcon className="icon-sm" />
            <span>{String(lang || "en").toUpperCase()}</span>
          </button>
          {langOpen ? (
            <div className="compact-lang-menu">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={lang === item.code ? "active" : ""}
                  onClick={() => {
                    setLang(item.code);
                    setLangOpen(false);
                  }}
                >
                  <span>{item.code === "kk" ? "KZ" : item.code.toUpperCase()}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {token ? (
          <div className="account-menu-wrap">
            <button className="account-icon-btn" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={t.account}>
              <UserCircleIcon className="account-icon" />
            </button>
            {menuOpen ? (
              <div className="account-dropdown">
                <Link to="/forms" onClick={() => setMenuOpen(false)}>{t.myForms}</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>{t.openProfile}</Link>
                {canOpenAdmin ? <Link to="/admin" onClick={() => setMenuOpen(false)}>{t.adminLink}</Link> : null}
                <button type="button" onClick={logout}><ArrowRightStartOnRectangleIcon className="icon-sm" />{t.logout}</button>
              </div>
            ) : null}
          </div>
        ) : isHome ? (
          <Link className="home-start-btn" to="/login">{lang === "kk" ? "Бастау" : lang === "ru" ? "Начать" : "Get Started"}</Link>
        ) : null}
      </div>
    </header>
  );
}

const workspaceCopy = {
  kk: {
    eyebrow: "Жұмыс кеңістігі",
    title: "FormBridge платформасы",
    sidebar: {
      forms: "Формалар",
      settings: "Баптаулар",
      admin: "Админ"
    },
    plan: "Кәсіби жоспар",
    product: "Google Forms CRM",
    pages: {
      requests: ["Өтініштер", "Өтініштер нақты форма таңдалғаннан кейін ашылады. Алдымен формалар тізімінен керекті форманың жұмыс кеңістігін ашыңыз.", "Формаларға өту"],
      analytics: ["Аналитика", "Аналитика да нақты форма ішінде көрсетіледі. Бұл көп форма болған кезде деректерді шатастырмауға көмектеседі.", "Форманы таңдау"],
      automation: ["Автоматтандыру", "Автоматтандыру және интеграция баптаулары нақты форманың жұмыс кеңістігінде орналасады.", "Форманы таңдау"],
      notifications: ["Хабарламалар", "WhatsApp хабарламалары нақты форма workspace ішінде бапталады.", "Форманы таңдау"]
    }
  },
  ru: {
    eyebrow: "Рабочее пространство",
    title: "Платформа FormBridge",
    sidebar: {
      forms: "Формы",
      settings: "Настройки",
      admin: "Админ"
    },
    plan: "Профессиональный план",
    product: "Google Forms CRM",
    pages: {
      requests: ["Заявки", "Заявки открываются после выбора конкретной формы. Сначала откройте рабочее пространство нужной формы из списка.", "Перейти к формам"],
      analytics: ["Аналитика", "Аналитика показывается внутри конкретной формы, чтобы данные разных форм не смешивались.", "Выбрать форму"],
      automation: ["Автоматизация", "Автоматизация и настройки интеграции находятся внутри рабочего пространства конкретной формы.", "Выбрать форму"],
      notifications: ["Уведомления", "WhatsApp-уведомления настраиваются внутри workspace конкретной формы.", "Выбрать форму"]
    }
  },
  en: {
    eyebrow: "Workspace",
    title: "FormBridge Platform",
    sidebar: {
      forms: "Forms",
      settings: "Settings",
      admin: "Admin"
    },
    plan: "Professional plan",
    product: "Google Forms CRM",
    pages: {
      requests: ["Requests", "Requests open after selecting a specific form. Open the needed form workspace from the forms list first.", "Go to forms"],
      analytics: ["Analytics", "Analytics lives inside a specific form workspace so data from multiple forms does not get mixed.", "Choose form"],
      automation: ["Automation", "Automation and integration settings live inside the selected form workspace.", "Choose form"],
      notifications: ["Notifications", "WhatsApp notifications are configured inside the selected form workspace.", "Choose form"]
    }
  }
};

function WorkspaceUtilityPage({ page, lang }) {
  const text = workspaceCopy[lang] || workspaceCopy.kk;
  const [title, description, action] = text.pages[page] || text.pages.requests;
  const target = page === "automation" ? "/health" : "/forms";

  return (
    <section className="workspace-empty-page">
      <span>{text.eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className="primary-btn" to={target}>{action}</Link>
    </section>
  );
}

function WorkspaceShell({ children }) {
  return <div className="workspace-content">{children}</div>;
}

export function App() {
  const { lang, setLang, t, hasLanguage } = useLocale();
  const location = useLocation();
  const [toast, setToast] = useState("");
  const [toastClosing, setToastClosing] = useState(false);

  useEffect(() => {
    const nextToast = getSessionItem("fb_toast");
    if (!nextToast) return;

    setToastClosing(false);
    setToast(nextToast);
    removeSessionItem("fb_toast");
  }, [location.key, location.pathname]);

  useEffect(() => {
    if (!toast) return undefined;

    const closeTimer = window.setTimeout(() => setToastClosing(true), 3000);
    const clearTimer = window.setTimeout(() => {
      setToast("");
      setToastClosing(false);
    }, 3320);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [toast]);

  const isHome = location.pathname === "/";
  const token = getStoredToken();
  const isPublicSolution = location.pathname.startsWith("/solutions/");
  const isWorkspace = token && !isHome && !isPublicSolution && location.pathname !== "/login";

  return (
    <div className={`app-shell${isHome ? " home-shell" : ""}${isWorkspace ? " workspace-app-shell" : ""}`}>
      <TopBar t={t} lang={lang || "en"} setLang={setLang} isHome={isHome} />
      {toast ? (
        <div className={`toast${toastClosing ? " toast-closing" : ""}`} role="status" aria-live="polite">
          <span className="toast-icon"><IconCheck size={14} /></span>
          <span>{toast}</span>
        </div>
      ) : null}
      <main className={isWorkspace ? "workspace-route-wrap" : "page-wrap"}>
        {!hasLanguage ? (
          <LanguageGate setLang={setLang} text={t} />
        ) : (
          isWorkspace ? (
            <WorkspaceShell>
              <Routes>
                <Route path="/profile" element={<ProtectedRoute><ProfilePage t={t} /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><ProfilePage t={t} /></ProtectedRoute>} />
                <Route path="/dashboard" element={<Navigate to="/forms" replace />} />
                <Route path="/forms" element={<ProtectedRoute><MyFormsPage /></ProtectedRoute>} />
                <Route path="/connect" element={<Navigate to="/forms" replace />} />
                <Route path="/requests" element={<ProtectedRoute><WorkspaceUtilityPage page="requests" lang={lang || "kk"} /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><WorkspaceUtilityPage page="analytics" lang={lang || "kk"} /></ProtectedRoute>} />
                <Route path="/automation" element={<ProtectedRoute><WorkspaceUtilityPage page="automation" lang={lang || "kk"} /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><WorkspaceUtilityPage page="notifications" lang={lang || "kk"} /></ProtectedRoute>} />
                <Route path="/team" element={<Navigate to="/profile" replace />} />
                <Route path="/forms/:formId/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
                <Route path="/health" element={<ProtectedRoute><IntegrationHealthPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/forms" replace />} />
              </Routes>
            </WorkspaceShell>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage t={t} />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/solutions/:solutionId" element={<SolutionPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )
        )}
      </main>
    </div>
  );
}
