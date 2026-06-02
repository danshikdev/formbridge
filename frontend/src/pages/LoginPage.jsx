import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircleIcon, EnvelopeIcon, LockClosedIcon, Squares2X2Icon, UserIcon } from "@heroicons/react/24/outline";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

export function LoginPage({ t }) {
  const { lang } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(() => searchParams.get("mode") === "register" ? "register" : "login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const reason = searchParams.get("reason");

    if (token) {
      localStorage.setItem("fb_token", token);
      sessionStorage.setItem("fb_toast", t.loginSuccess);
      navigate("/forms", { replace: true });
      return;
    }

    if (reason) {
      setError(reason);
    }
  }, [navigate, searchParams]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { fullName, email, password };

      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("fb_token", data.token);
      sessionStorage.setItem("fb_toast", t.loginSuccess);
      navigate("/forms");
    } catch (err) {
      setError(err.response?.data?.error || authCopy.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setError("");
    setGoogleLoading(true);

    try {
      const { data } = await api.post("/api/auth/google/start");
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || authCopy.googleFailed);
      setGoogleLoading(false);
    }
  }

  const authCopy = {
    kk: {
      loginKicker: "Қайта келдіңіз",
      registerKicker: "Жаңа аккаунт",
      brandTitleLogin: "Формалармен жұмыс бір жерден басқарылады",
      brandTitleRegister: "Жаңа жұмыс кеңістігін бастаңыз",
      brandTextLogin: "Өтініштерді бақылап, статустарды өзгертіп, есептерді бір жүйеден көріңіз.",
      brandTextRegister: "FormBridge Google Forms жауаптарын реттелген өтініштерге айналдырады.",
      benefits: ["Жауаптар бір тізімде", "Статустар арқылы өңдеу", "Есеп пен талдау дайын"],
      requestFailed: "Сұраныс орындалмады",
      googleFailed: "Google арқылы кіру орындалмады"
    },
    ru: {
      loginKicker: "С возвращением",
      registerKicker: "Новый аккаунт",
      brandTitleLogin: "Работа с формами управляется из одного места",
      brandTitleRegister: "Начните новое рабочее пространство",
      brandTextLogin: "Следите за заявками, меняйте статусы и смотрите отчеты в одной системе.",
      brandTextRegister: "FormBridge превращает ответы Google Forms в организованные заявки.",
      benefits: ["Ответы в одном списке", "Обработка по статусам", "Готовые отчеты и аналитика"],
      requestFailed: "Не удалось выполнить запрос",
      googleFailed: "Не удалось войти через Google"
    },
    en: {
      loginKicker: "Welcome back",
      registerKicker: "New account",
      brandTitleLogin: "Manage forms from one workspace",
      brandTitleRegister: "Start a new workspace",
      brandTextLogin: "Track requests, update statuses and view reports in one system.",
      brandTextRegister: "FormBridge turns Google Forms responses into organized requests.",
      benefits: ["Responses in one list", "Status-based processing", "Reports and analytics"],
      requestFailed: "Request failed",
      googleFailed: "Google login failed"
    }
  }[lang || "kk"];

  return (
    <section className={`auth-split-page auth-mode-${mode}`}>
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-kicker">{mode === "login" ? authCopy.loginKicker : authCopy.registerKicker}</div>
          <h1>{mode === "login" ? t.welcomeBack : t.createAccount}</h1>
          <p>{t.authSubtitle}</p>

          <button type="button" className="google-auth-btn" onClick={loginWithGoogle} disabled={googleLoading}>
            <span className="google-mark">G</span>
            <span>{googleLoading ? t.loading : t.loginWithGoogle}</span>
          </button>
          <div className="divider"><span>{t.or}</span></div>

          <form onSubmit={onSubmit} className="form-stack auth-form-animated">
            <div className="auth-name-field">
              <label>
                {t.fullName}
                <div className="input-wrap">
                  <UserIcon className="icon-sm input-icon" />
                  <input placeholder={t.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} required={mode === "register"} />
                </div>
              </label>
            </div>

            <label>
              {t.email}
              <div className="input-wrap">
                <EnvelopeIcon className="icon-sm input-icon" />
                <input placeholder={t.emailPlaceholder} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </label>

            <label>
              {t.password}
              <div className="input-wrap">
                <LockClosedIcon className="icon-sm input-icon" />
                <input placeholder={t.passwordPlaceholder} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button disabled={loading} className="primary-btn" type="submit">
              {loading ? t.loading : mode === "login" ? t.login : t.createAccount}
            </button>
          </form>

          <button
            type="button"
            className="auth-switch-link"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? t.needAccount : t.haveAccount}
          </button>
        </div>
      </div>

      <aside className="auth-brand-panel">
        <div className="auth-floating-shape shape-one" />
        <div className="auth-floating-shape shape-two" />
        <div className="auth-brand-card">
          <div className="auth-brand-icon"><Squares2X2Icon /></div>
          <h2>{mode === "login" ? authCopy.brandTitleLogin : authCopy.brandTitleRegister}</h2>
          <p>{mode === "login" ? authCopy.brandTextLogin : authCopy.brandTextRegister}</p>
          <div className="auth-benefits">
            {authCopy.benefits.map((item) => (
              <span key={item}><CheckCircleIcon />{item}</span>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
