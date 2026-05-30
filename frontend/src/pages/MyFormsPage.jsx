import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

function formatShortDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function integrationState(item, t) {
  if (!item) return t.notAdded;
  if (item.status === "ready" || item.healthStatus === "connected") return t.formReady;
  return t.formPreparing;
}

export function MyFormsPage() {
  const { t } = useLocale();
  const [googleStatus, setGoogleStatus] = useState(null);
  const [forms, setForms] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  async function loadIntegrations() {
    const { data } = await api.get("/api/integrations/forms");
    setIntegrations(data.items || []);
  }

  async function loadGoogleStatus() {
    const { data } = await api.get("/api/google/oauth/status");
    setGoogleStatus(data);
    return data;
  }

  async function loadForms() {
    const { data } = await api.get("/api/google/forms");
    setForms(data.items || []);
  }

  async function boot() {
    setLoading(true);
    setError("");
    try {
      const status = await loadGoogleStatus();
      await loadIntegrations();
      if (status.account) await loadForms();
    } catch (err) {
      setError(err.response?.data?.error || t.failedLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot();
  }, []);

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

  async function addForm(form) {
    setActionId(form.id);
    setError("");
    setMessage("");
    try {
      await api.post("/api/integrations/forms/setup-google", { formId: form.id, formTitle: form.name });
      await loadIntegrations();
      setMessage(t.integrationPrepared);
    } catch (err) {
      setError(err.response?.data?.error || t.failedSetup);
    } finally {
      setActionId("");
    }
  }

  async function removeIntegration(id) {
    if (!window.confirm(t.deleteConfirm)) return;

    setActionId(id);
    setError("");
    setMessage("");
    try {
      await api.delete(`/api/integrations/forms/${id}`);
      await loadIntegrations();
      setMessage(t.integrationRemoved);
    } catch (err) {
      setError(err.response?.data?.error || t.failedRemove);
    } finally {
      setActionId("");
    }
  }

  const integrationByFormId = useMemo(() => {
    return new Map(integrations.map((item) => [item.formId, item]));
  }, [integrations]);

  const filteredForms = useMemo(() => {
    let result = forms;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(needle));
    }
    if (filterType === "connected") result = result.filter((f) => integrationByFormId.has(f.id));
    if (filterType === "not_connected") result = result.filter((f) => !integrationByFormId.has(f.id));
    return result;
  }, [forms, search, filterType, integrationByFormId]);

  if (loading) return <section className="card"><p className="muted">{t.loading}</p></section>;

  return (
    <section className="my-forms-page">
      <div className="official-page-title">
        <div>
          <h1>{t.myForms}</h1>
          <p>{t.myFormsSubtitle}</p>
        </div>
      </div>

      {error ? <p className="error official-message">{error}</p> : null}
      {message ? <p className="ok-msg official-message">{message}</p> : null}

      {!googleStatus?.account ? (
        <div className="forms-access-card">
          <h2>{t.formsAccessTitle}</h2>
          <p>{t.formsAccessText}</p>
          <button className="primary-btn" type="button" onClick={connectGoogle}>{t.grantFormsAccess}</button>
        </div>
      ) : (
        <div className="forms-list-card">
          <div className="official-card-title">
            <h2>{t.availableForms}</h2>
            <span>{filteredForms.length} / {forms.length}</span>
          </div>
          <div className="forms-toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchFormsPh}
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">{t.all}</option>
              <option value="connected">{t.filterConnected}</option>
              <option value="not_connected">{t.filterNotConnected}</option>
            </select>
          </div>
          <div className="forms-list">
            {filteredForms.length === 0 ? (
              <p className="muted forms-empty-msg">
                {forms.length === 0 ? t.noGoogleForms : t.noFormsFound}
              </p>
            ) : filteredForms.map((form) => {
              const integration = integrationByFormId.get(form.id);
              const dateStr = formatShortDate(form.modifiedTime);
              return (
                <article key={form.id} className="form-management-row">
                  <div className="form-row-info">
                    <h3>{form.name}</h3>
                    <p>
                      <span className={integration ? "form-status-connected" : "form-status-disconnected"}>
                        {integration ? t.added : t.notAdded}
                      </span>
                      {dateStr ? <span className="form-modified-date">{t.modifiedAt}: {dateStr}</span> : null}
                    </p>
                  </div>
                  <div className="form-row-actions">
                    <span className={`official-badge ${integration ? "status-done" : "status-new"}`}>
                      {integrationState(integration, t)}
                    </span>
                    {integration ? (
                      <>
                        <Link
                          className="official-link-btn"
                          to={`/forms/${encodeURIComponent(form.id)}/requests?formTitle=${encodeURIComponent(form.name)}`}
                        >
                          {t.viewRequests}
                        </Link>
                        <button
                          className="official-link-btn danger-btn"
                          type="button"
                          onClick={() => removeIntegration(integration.id)}
                          disabled={actionId === integration.id}
                        >
                          {t.remove}
                        </button>
                      </>
                    ) : (
                      <button
                        className="primary-btn compact-action-btn"
                        type="button"
                        onClick={() => addForm(form)}
                        disabled={actionId === form.id}
                      >
                        {actionId === form.id ? t.preparing : t.addToFormBridge}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
