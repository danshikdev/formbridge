import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

function displayStatus(item, t) {
  if (item.status === "ready" || item.healthStatus === "connected") return t.readyToUse;
  if (item.healthStatus === "broken") return t.broken;
  if (item.status === "configured" || item.healthStatus === "needs_trigger") return t.preparingStatus;
  return t.needsSetup;
}

export function ConnectFormPage() {
  const { t } = useLocale();
  const [items, setItems] = useState([]);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [googleForms, setGoogleForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(false);
  const [setupLoadingId, setSetupLoadingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadIntegrations() {
    const { data } = await api.get("/api/integrations/forms");
    setItems(data.items || []);
  }

  async function loadGoogleStatus() {
    const { data } = await api.get("/api/google/oauth/status");
    setGoogleStatus(data);
  }

  async function loadGoogleForms() {
    setFormsLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/google/forms");
      setGoogleForms(data.items || []);
    } catch (err) {
      setError(err.response?.data?.error || t.failedLoad);
    } finally {
      setFormsLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      try {
        await Promise.all([loadIntegrations(), loadGoogleStatus()]);
      } catch (err) {
        setError(err.response?.data?.error || t.failedLoad);
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  useEffect(() => {
    if (googleStatus?.account) loadGoogleForms();
  }, [googleStatus?.account?.id]);

  async function connectGoogle() {
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/api/google/oauth/start");
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.error || t.oauthMissing);
    }
  }

  async function setupGoogleForm(form) {
    setSetupLoadingId(form.id);
    setError("");
    setMessage("");
    try {
      await api.post("/api/integrations/forms/setup-google", {
        formId: form.id,
        formTitle: form.name
      });
      await loadIntegrations();
      setMessage(t.integrationPrepared);
    } catch (err) {
      setError(err.response?.data?.error || t.failedSetup);
    } finally {
      setSetupLoadingId("");
    }
  }

  async function deleteIntegration(id) {
    setMessage("");
    setError("");

    try {
      await api.delete(`/api/integrations/forms/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMessage(t.integrationRemoved);
    } catch (err) {
      setError(err.response?.data?.error || t.failedRemove);
    }
  }

  const connectedFormIds = new Set(items.map((item) => item.formId));

  return (
    <section className="card connect-card product-connect-card">
      <div className="page-heading">
        <div>
          <h1>{t.connectTitle}</h1>
          <p className="muted">{t.connectSubtitle}</p>
        </div>
        <button type="button" className="primary-btn" onClick={connectGoogle}>
          {googleStatus?.account ? t.reconnectGoogle : t.connectGoogle}
        </button>
      </div>

      {loading ? <p className="muted">{t.loading}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="ok-msg">{message}</p> : null}

      <div className="setup-grid">
        <div className="wizard-step setup-panel product-panel">
          <h3>{t.googleAccount}</h3>
          <p className="muted">{googleStatus?.configured ? t.oauthReady : t.oauthMissing}</p>
          {googleStatus?.demoGoogleAccountEmail ? <p className="muted">{t.demoAccount}: {googleStatus.demoGoogleAccountEmail}</p> : null}
          <div className="mini-card">
            <strong>{googleStatus?.account?.email || t.notConnected}</strong>
            <span className={`status-pill health-${googleStatus?.account ? "connected" : "unknown"}`}>
              {googleStatus?.account ? "connected" : "missing"}
            </span>
          </div>
        </div>

        <div className="wizard-step setup-panel product-panel">
          <h3>{t.selectForm}</h3>
          {!googleStatus?.account ? <p className="muted">{t.connectFirst}</p> : null}
          {formsLoading ? <p className="muted">{t.loadingForms}</p> : null}
          <div className="integration-list form-picker">
            {googleForms.map((form) => {
              const isConnected = connectedFormIds.has(form.id);
              const isLoading = setupLoadingId === form.id;
              return (
                <button key={form.id} type="button" className="integration-item" onClick={() => setupGoogleForm(form)} disabled={isLoading || isConnected}>
                  <strong>{form.name}</strong>
                  <span>{isConnected ? t.readyToUse : isLoading ? t.preparing : t.prepareForm}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="wizard-step">
        <h3>{t.connectedIntegrations}</h3>
        {!items.length ? <p className="muted">{t.noIntegrations}</p> : null}
        <div className="integration-list">
          {items.map((item) => (
            <div key={item.id} className="integration-item integration-row">
              <div className="integration-main readonly-integration">
                <strong>{item.formTitle || item.formId}</strong>
                <span>{displayStatus(item, t)}</span>
              </div>
              <button type="button" className="ghost-btn danger-btn" onClick={() => deleteIntegration(item.id)}>{t.remove}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
