import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function ProfilePage({ t }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMe() {
      try {
        const { data } = await api.get("/api/auth/me");
        setUser(data.user);
      } catch (_err) {
        setError(t.sessionExpired);
        localStorage.removeItem("fb_token");
      }
    }
    loadMe();
  }, [t.sessionExpired]);

  function logout() {
    localStorage.removeItem("fb_token");
    navigate("/login");
  }

  if (error) return <section className="card"><p className="error">{error}</p></section>;
  if (!user) return <section className="card"><p className="muted">{t.loadingProfile}</p></section>;

  return (
    <section className="profile-page-clean">
      <div className="profile-clean-title">
        <h1>{t.profile}</h1>
        <p className="muted">{t.profileSubtitle}</p>
      </div>

      <div className="profile-clean-card">
        <dl className="profile-fields">
          <div>
            <dt>{t.fullName}</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt>{t.email}</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>{t.accessLevel}</dt>
            <dd>{user.role}</dd>
          </div>
        </dl>
        <div className="profile-clean-actions">
          <Link className="primary-btn" to="/forms">{t.goToForms}</Link>
          <button className="official-link-btn danger-btn" type="button" onClick={logout}>
            {t.logout}
          </button>
        </div>
      </div>
    </section>
  );
}
