import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useLocale } from "../shared/useLocale.js";
import { IconUser, IconGrid, IconChart, IconFeedback } from "../shared/icons.jsx";

function StatCard({ label, value, sub }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value">{value ?? "—"}</div>
      <div className="admin-stat-label">{label}</div>
      {sub ? <div className="admin-stat-sub">{sub}</div> : null}
    </div>
  );
}

function FeedbackStatusBadge({ status, t }) {
  const map = {
    new: { label: t.adminStatusNew, cls: "admin-badge-new" },
    reviewed: { label: t.adminStatusReviewed, cls: "admin-badge-reviewed" },
    done: { label: t.adminStatusDone, cls: "admin-badge-done" }
  };
  const entry = map[status] || { label: status, cls: "" };
  return <span className={`admin-badge ${entry.cls}`}>{entry.label}</span>;
}

export function AdminPage() {
  const { t } = useLocale();
  const [overview, setOverview] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [clearEmail, setClearEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [clearResult, setClearResult] = useState(null);
  const [clearError, setClearError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/overview"),
      api.get("/api/admin/feedback")
    ])
      .then(([ov, fb]) => {
        setOverview(ov.data);
        setFeedback(fb.data);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setDenied(true);
        } else {
          setError(err.message || "Failed to load");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function updateFeedbackStatus(id, status) {
    try {
      await api.patch(`/api/admin/feedback/${id}`, { status });
      setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    } catch {
      // silent
    }
  }

  async function clearUserData(event) {
    event.preventDefault();
    const email = clearEmail.trim();
    const confirm = confirmEmail.trim();

    setClearError("");
    setClearResult(null);

    if (!email || email.toLowerCase() !== confirm.toLowerCase()) {
      setClearError(t.adminClearUserMismatch);
      return;
    }

    if (!window.confirm(`${t.adminClearUserConfirm} ${email}?`)) return;

    setClearLoading(true);
    try {
      const { data } = await api.post("/api/admin/users/clear-data", {
        email,
        confirmEmail: confirm
      });
      setClearResult(data);
      setClearEmail("");
      setConfirmEmail("");

      const overviewResponse = await api.get("/api/admin/overview");
      setOverview(overviewResponse.data);
    } catch (err) {
      setClearError(err.response?.data?.error || t.adminClearUserFailed);
    } finally {
      setClearLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">{t.loading}</div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <div className="admin-denied-title">{t.adminAccessDenied}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <div className="admin-denied-title">{error}</div>
        </div>
      </div>
    );
  }

  const { users, forms, requests, system } = overview;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">{t.adminTitle}</h1>
        <p className="admin-subtitle">{t.adminSubtitle}</p>
      </div>

      {/* Stat grid */}
      <div className="admin-section-title">
        <IconUser size={16} />
        {t.adminUsers}
      </div>
      <div className="admin-stat-grid">
        <StatCard label={t.adminTotal} value={users.total} />
        {overview.feedback ? (
          <StatCard label={t.adminFeedback} value={overview.feedback.total} sub={`${t.adminStatusNew}: ${overview.feedback.new}`} />
        ) : null}
      </div>

      <div className="admin-section-title">
        <IconGrid size={16} />
        {t.adminForms}
      </div>
      <div className="admin-stat-grid">
        <StatCard label={t.adminTotal} value={forms.totalIntegrations} />
        <StatCard label={t.adminReady} value={forms.ready} />
        <StatCard label={t.adminConfigured} value={forms.configured} />
        <StatCard label={t.adminBroken} value={forms.broken} />
      </div>

      <div className="admin-section-title">
        <IconChart size={16} />
        {t.adminRequests}
      </div>
      <div className="admin-stat-grid">
        <StatCard label={t.adminTotal} value={requests.total} />
        <StatCard label={t.adminToday} value={requests.today} />
        <StatCard label={t.adminLast7Days} value={requests.last7Days} />
      </div>

      {/* System status */}
      <div className="admin-section-title">{t.adminSystem}</div>
      <div className="admin-system-card">
        <div className="admin-system-row">
          <span>{t.adminNodeEnv}</span>
          <span className="admin-system-val">{system.nodeEnv}</span>
        </div>
        <div className="admin-system-row">
          <span>{t.adminAiConfigured}</span>
          <span className={`admin-system-val ${system.aiConfigured ? "admin-ok" : "admin-warn"}`}>
            {system.aiConfigured ? "true" : "false"}
          </span>
        </div>
        <div className="admin-system-row">
          <span>{t.adminAiModel}</span>
          <span className="admin-system-val">{system.openaiModel}</span>
        </div>
      </div>

      <div className="admin-section-title">
        <IconUser size={16} />
        {t.adminClearUserTitle}
      </div>
      <form className="admin-system-card" onSubmit={clearUserData}>
        <div className="admin-system-row">
          <span>{t.adminClearUserEmail}</span>
          <input
            type="email"
            value={clearEmail}
            onChange={(e) => setClearEmail(e.target.value)}
            placeholder="user@example.com"
            style={{ maxWidth: 360, width: "100%" }}
          />
        </div>
        <div className="admin-system-row">
          <span>{t.adminClearUserConfirmEmail}</span>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="user@example.com"
            style={{ maxWidth: 360, width: "100%" }}
          />
        </div>
        <div className="admin-system-row">
          <span>{t.adminClearUserHint}</span>
          <button className="admin-action-btn" type="submit" disabled={clearLoading}>
            {clearLoading ? t.loading : t.adminClearUserButton}
          </button>
        </div>
        {clearError ? <div className="admin-system-row"><span className="admin-system-val admin-warn">{clearError}</span></div> : null}
        {clearResult ? (
          <div className="admin-system-row">
            <span>{clearResult.found ? t.adminClearUserDone : t.adminClearUserNotFound}</span>
            <span className="admin-system-val">
              users: {clearResult.deleted?.users || 0}, forms: {clearResult.deleted?.integrations || 0}, requests: {clearResult.deleted?.requests || 0}
            </span>
          </div>
        ) : null}
      </form>

      {/* Recent users */}
      <div className="admin-section-title">
        <IconUser size={16} />
        {t.adminRecentUsers}
      </div>
      {users.recentUsers.length === 0 ? (
        <div className="admin-empty">{t.adminNoUsers}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.adminNameColumn}</th>
                <th>{t.adminEmailColumn}</th>
                <th>{t.adminRegisteredColumn}</th>
              </tr>
            </thead>
            <tbody>
              {users.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback table */}
      <div className="admin-section-title">
        <IconFeedback size={16} />
        {t.adminRecentFeedback}
      </div>
      {feedback.length === 0 ? (
        <div className="admin-empty">{t.adminNoFeedback}</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.adminUserColumn}</th>
                <th>{t.adminScenarioColumn}</th>
                <th>{t.adminMessageColumn}</th>
                <th>{t.adminStatusColumn}</th>
                <th>{t.adminDateColumn}</th>
                <th>{t.adminActionsColumn}</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f) => (
                <tr key={f.id}>
                  <td className="admin-cell-user">
                    <span>{f.userName || "—"}</span>
                    <span className="admin-cell-email">{f.userEmail || ""}</span>
                  </td>
                  <td>{f.scenario || "—"}</td>
                  <td className="admin-cell-message">{f.message}</td>
                  <td><FeedbackStatusBadge status={f.status} t={t} /></td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td className="admin-cell-actions">
                    {f.status === "new" && (
                      <button className="admin-action-btn" onClick={() => updateFeedbackStatus(f.id, "reviewed")}>
                        {t.adminMarkReviewed}
                      </button>
                    )}
                    {f.status !== "done" && (
                      <button className="admin-action-btn" onClick={() => updateFeedbackStatus(f.id, "done")}>
                        {t.adminMarkDone}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
