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
