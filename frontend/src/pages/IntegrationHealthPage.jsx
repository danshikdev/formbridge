import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function syncStatusClass(status) {
  if (status === "error") return "broken";
  if (status === "syncing") return "needs_trigger";
  return "connected";
}

export function IntegrationHealthPage() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [syncingId, setSyncingId] = useState("");
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [setupScript, setSetupScript] = useState(null);
  const [autoSetup, setAutoSetup] = useState(null);
  const [autoSetupLoadingId, setAutoSetupLoadingId] = useState("");

  async function loadHealth() {
    const { data } = await api.get("/api/integrations/health");
    setItems(data.items || []);
    setEvents(data.events || []);
  }

  useEffect(() => {
    async function boot() {
      try {
        await loadHealth();
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load health");
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  async function syncNow(id) {
    setMessage("");
    setError("");
    setSyncingId(id);
    try {
      const { data } = await api.post(`/api/integrations/forms/${id}/sync-now`);
      setMessage((t.syncNowSuccess || "Sync completed.") + ` ${t.newResponses || "New"}: ${data.created ?? 0}, ${t.skippedResponses || "skipped"}: ${data.skipped ?? 0}.`);
      await loadHealth();
    } catch (_err) {
      setError(t.pollingSetupError || "Не удалось подключить форму. Проверьте, что у аккаунта есть доступ к этой Google Form.");
    } finally {
      setSyncingId("");
    }
  }

  async function verify(id) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.post(`/api/integrations/forms/${id}/verify`);
      setMessage(data.broken?.length ? `Broken checks: ${data.broken.join(", ")}` : "All checks passed.");
      await loadHealth();
    } catch (err) {
      setError(err.response?.data?.error || "Verify failed");
    }
  }

  async function runAutoSetup(id) {
    setMessage("");
    setError("");
    setAutoSetup(null);
    setAutoSetupLoadingId(id);
    try {
      const { data } = await api.post(`/api/integrations/forms/${id}/auto-setup`);
      setAutoSetup(data);
      setMessage(data.message);
      await loadHealth();
    } catch (err) {
      setError(err.response?.data?.error || `Auto setup failed${err.response?.status ? ` (HTTP ${err.response.status})` : ""}`);
    } finally {
      setAutoSetupLoadingId("");
    }
  }

  async function loadSetupScript(id) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.get(`/api/integrations/forms/${id}/setup-script`);
      setSetupScript(data);
      setMessage("Legacy setup script loaded.");
    } catch (err) {
      setError(err.response?.data?.error || `Failed to load setup script${err.response?.status ? ` (HTTP ${err.response.status})` : ""}`);
    }
  }

  async function test(id) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.post(`/api/integrations/forms/${id}/test`);
      setMessage(data.message);
      await loadHealth();
    } catch (err) {
      setError(err.response?.data?.error || "Test failed");
    }
  }

  if (loading) return <section className="card"><p className="muted">Loading integration health...</p></section>;

  return (
    <section className="card requests-card">
      <div className="page-heading">
        <div>
          <h1>{t.integrationHealthTitle || "Integrations Health"}</h1>
          <p className="muted">{t.integrationHealthSubtitle || "Google Forms API connection status, sync health, and diagnostics."}</p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="ok-msg">{message}</p> : null}

      <div className="health-list">
        {items.map((item) => (
          <article key={item.id} className="health-card">
            <div>
              <h3>{item.formTitle || item.formId}</h3>
              <p className="muted">{item.formId}</p>
            </div>
            <div className="health-meta">
              <span>{t.connectionMethod || "Connection method"}: <strong>Google Forms API</strong></span>
              <span>{t.syncMode || "Sync mode"}: <strong>Polling</strong></span>
              <span className={`status-pill health-${syncStatusClass(item.syncStatus)}`}>{item.syncStatus || "idle"}</span>
              <span>{t.lastSync || "Last sync"}: {formatDate(item.lastSyncedAt)}</span>
            </div>
            {item.lastSyncError ? <p className="error">{item.lastSyncError}</p> : <p className="ok-msg">{t.pollingEnabled || "Automatic sync is enabled."}</p>}
            <div className="wizard-actions">
              <button type="button" className="primary-btn" onClick={() => syncNow(item.id)} disabled={syncingId === item.id}>
                {syncingId === item.id ? (t.checking || "Syncing...") : (t.syncNow || "Sync now")}
              </button>
              <button type="button" className="ghost-btn" onClick={() => verify(item.id)}>Verify</button>
            </div>
          </article>
        ))}
      </div>

      <div className="wizard-step setup-script-panel">
        <button type="button" className="ghost-btn" onClick={() => setLegacyOpen((value) => !value)}>
          {legacyOpen ? "Hide Advanced / Legacy Apps Script setup" : "Advanced / Legacy Apps Script setup"}
        </button>
        {legacyOpen ? (
          <div className="legacy-setup-panel">
            <p className="muted">Legacy webhook setup is kept only as a backup for older integrations.</p>
            <div className="health-list">
              {items.map((item) => (
                <article key={item.id} className="health-card">
                  <h3>{item.formTitle || item.formId}</h3>
                  <div className="wizard-actions">
                    <button type="button" className="ghost-btn" onClick={() => runAutoSetup(item.id)} disabled={autoSetupLoadingId === item.id}>
                      {autoSetupLoadingId === item.id ? "Setting up..." : "Prepare legacy setup"}
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => test(item.id)}>Test webhook</button>
                    <button type="button" className="ghost-btn" onClick={() => loadSetupScript(item.id)}>Load legacy script</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {autoSetup && legacyOpen ? (
        <div className="wizard-step setup-script-panel">
          <h3>Legacy setup next step</h3>
          <p className="muted">Open the legacy installer only if you intentionally use the old webhook backup.</p>
          <p><a className="primary-btn inline-link-btn" href={autoSetup.scriptUrl} target="_blank" rel="noreferrer">Open legacy installer</a></p>
        </div>
      ) : null}

      {setupScript && legacyOpen ? (
        <div className="wizard-step setup-script-panel">
          <h3>Legacy webhook setup</h3>
          <p className="muted">Webhook URL: {setupScript.webhookUrl}</p>
          <pre className="code-block"><code>{setupScript.code}</code></pre>
        </div>
      ) : null}

      <div className="wizard-step">
        <h3>Latest events</h3>
        <div className="requests-table-wrap">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.createdAt)}</td>
                  <td>{event.type}</td>
                  <td><span className={`status-pill event-${event.status}`}>{event.status}</span></td>
                  <td>{event.message || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
