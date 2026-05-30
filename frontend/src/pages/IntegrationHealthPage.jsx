import { useEffect, useState } from "react";
import { api } from "../api/client";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export function IntegrationHealthPage() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
      setMessage("Setup script loaded. Paste it into the linked Sheet Apps Script project.");
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
          <h1>Integrations Health</h1>
          <p className="muted">Operational control for connected Google Forms: status, last event, errors, and diagnostics.</p>
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
              <span className={`status-pill health-${item.healthStatus}`}>{item.healthStatus}</span>
              <span>Last event: {formatDate(item.lastEventAt)}</span>
              <span>Last verified: {formatDate(item.lastVerifiedAt)}</span>
            </div>
            {item.lastErrorReason ? <p className="error">{item.lastErrorReason}</p> : <p className="ok-msg">No active error recorded.</p>}
            <div className="wizard-actions">
              <button type="button" className="primary-btn" onClick={() => runAutoSetup(item.id)} disabled={autoSetupLoadingId === item.id}>{autoSetupLoadingId === item.id ? "Setting up..." : "Auto Setup"}</button>
              <button type="button" className="ghost-btn" onClick={() => verify(item.id)}>Verify</button>
              <button type="button" className="ghost-btn" onClick={() => test(item.id)}>Test</button>
              <button type="button" className="ghost-btn" onClick={() => loadSetupScript(item.id)}>Manual Script</button>
            </div>
          </article>
        ))}
      </div>

      {autoSetup ? (
        <div className="wizard-step setup-script-panel">
          <h3>Auto Setup next step</h3>
          <p className="muted">FormBridge created/updated the Apps Script project. Google requires one manual authorization run.</p>
          <p><a className="primary-btn inline-link-btn" href={autoSetup.scriptUrl} target="_blank" rel="noreferrer">Open Apps Script installer</a></p>
          <ol className="instruction-list">
            <li>Open the installer link.</li>
            <li>Select function <strong>{autoSetup.functionName}</strong>.</li>
            <li>Press Run.</li>
            <li>Approve Google permissions.</li>
            <li>Return here and press Test or submit a Google Form response.</li>
          </ol>
        </div>
      ) : null}

      {setupScript ? (
        <div className="wizard-step setup-script-panel">
          <h3>Apps Script setup</h3>
          <p className="muted">Webhook URL: {setupScript.webhookUrl}</p>
          {setupScript.sheetUrl ? <p><a className="top-link" href={setupScript.sheetUrl} target="_blank" rel="noreferrer">Open linked Sheet</a></p> : null}
          <ol className="instruction-list">
            {(setupScript.instructions || []).map((item) => <li key={item}>{item}</li>)}
          </ol>
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
