import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { api } from "../api/client";

export function LoginPage({ t }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
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
      setError(err.response?.data?.error || "Request failed");
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
      setError(err.response?.data?.error || "Google login failed");
      setGoogleLoading(false);
    }
  }

  return (
    <section className="card auth-card">
      <h1>{mode === "login" ? t.welcomeBack : t.createAccount}</h1>
      <p className="muted">{t.authSubtitle}</p>

      <button type="button" className="google-auth-btn" onClick={loginWithGoogle} disabled={googleLoading}>
        <span className="google-mark">G</span>
        <span>{googleLoading ? t.loading : t.loginWithGoogle}</span>
      </button>
      <div className="divider"><span>{t.or}</span></div>

      <form onSubmit={onSubmit} className="form-stack">
        {mode === "register" ? (
          <label>
            {t.fullName}
            <div className="input-wrap">
              <UserIcon className="icon-sm input-icon" />
              <input placeholder={t.fullNamePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          </label>
        ) : null}

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
        className="ghost-btn switch"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? t.needAccount : t.haveAccount}
      </button>
    </section>
  );
}
