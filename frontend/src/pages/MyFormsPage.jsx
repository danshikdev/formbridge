import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";
import { GuidedSetupModal } from "../components/GuidedSetupModal";
import { ShareModal } from "../components/ShareModal";

function formatShortDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function integrationState(item, t) {
  if (!item) return t.notAdded;
  if (isIntegrationReady(item)) return t.formReady;
  return t.formPreparing;
}

function isIntegrationReady(item) {
  return item?.status === "ready" || item?.healthStatus === "connected";
}

function integrationBadgeClass(item) {
  if (!item) return "status-new";
  return isIntegrationReady(item) ? "status-done" : "status-in_progress";
}

function integrationConnectionLabel(item, t) {
  if (!item) return t.notAdded;
  return isIntegrationReady(item) ? t.added : t.formPreparing;
}

const SCENARIO_LABELS = {
  universal:       { kk: "Жалпылама", ru: "Универсальный", en: "Universal" },
  admissions:      { kk: "Қабылдау", ru: "Приемная комиссия", en: "Admissions" },
  hr:              { kk: "HR", ru: "HR / Рекрутинг", en: "HR" },
  survey:          { kk: "Сауалнама", ru: "Опрос", en: "Survey" },
  client_requests: { kk: "Клиент өтініштері", ru: "Клиентские заявки", en: "Client requests" },
  event:           { kk: "Іс-шара", ru: "Мероприятие", en: "Event" }
};

function scenarioLabel(scenario, lang) {
  const map = SCENARIO_LABELS[scenario] || SCENARIO_LABELS.universal;
  return map[lang] || map.en;
}

function SkeletonLine({ className = "" }) {
  return <span className={`skeleton-line ${className}`} aria-hidden="true" />;
}

function FormsPageSkeleton() {
  return (
    <section className="my-forms-page" aria-busy="true">
      <div className="official-page-title forms-skeleton-title">
        <div>
          <SkeletonLine className="skeleton-title" />
          <SkeletonLine className="skeleton-text skeleton-wide" />
        </div>
      </div>
      <div className="forms-list-card">
        <div className="official-card-title">
          <SkeletonLine className="skeleton-heading" />
          <SkeletonLine className="skeleton-chip" />
        </div>
        <div className="forms-toolbar">
          <SkeletonLine className="skeleton-input" />
          <SkeletonLine className="skeleton-select" />
        </div>
        <div className="forms-list">
          {[0, 1, 2, 3].map((item) => (
            <article key={item} className="form-management-row form-management-row--skeleton">
              <div className="form-row-info">
                <SkeletonLine className="skeleton-heading" />
                <SkeletonLine className="skeleton-text" />
              </div>
              <div className="form-row-actions">
                <SkeletonLine className="skeleton-chip" />
                <SkeletonLine className="skeleton-button" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MyFormsPage() {
  const { t, lang } = useLocale();
  const [googleStatus, setGoogleStatus] = useState(null);
  const [forms, setForms] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [setupModal, setSetupModal] = useState(null); // { formId, formTitle, integration, googleEmail }
  const [shareModal, setShareModal] = useState(null); // { formId, formTitle }

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
    if (filterType === "connected") result = result.filter((f) => isIntegrationReady(integrationByFormId.get(f.id)));
    if (filterType === "not_connected") result = result.filter((f) => !integrationByFormId.has(f.id));
    return result;
  }, [forms, search, filterType, integrationByFormId]);

  if (loading) return <FormsPageSkeleton />;

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
              const ready = isIntegrationReady(integration);
              const dateStr = formatShortDate(form.modifiedTime);
              return (
                <article key={form.id} className="form-management-row">
                  <div className="form-row-info">
                    <h3>{form.name}</h3>
                    <p>
                      <span className={ready ? "form-status-connected" : "form-status-disconnected"}>
                        {integrationConnectionLabel(integration, t)}
                      </span>
                      {dateStr ? <span className="form-modified-date">{t.modifiedAt}: {dateStr}</span> : null}
                    </p>
                  </div>
                  <div className="form-row-actions">
                    <span className={`official-badge ${integrationBadgeClass(integration)}`}>
                      {integrationState(integration, t)}
                    </span>
                    {integration?.scenarioConfiguredAt && (
                      <span className="scenario-mini-badge">
                        {scenarioLabel(integration.scenario, lang)}
                      </span>
                    )}
                    {ready ? (
                      <>
                        <Link
                          className="primary-btn compact-action-btn"
                          to={`/forms/${encodeURIComponent(form.id)}/requests?formTitle=${encodeURIComponent(form.name)}`}
                        >
                          {t.openWorkspace}
                        </Link>
                        {integration?.scenarioConfiguredAt && (
                          <button
                            className="official-link-btn"
                            type="button"
                            onClick={() => setShareModal({ formId: form.id, formTitle: form.name })}
                          >
                            {t.share || "Поделиться"}
                          </button>
                        )}
                        <button
                          className="official-link-btn danger-btn"
                          type="button"
                          onClick={() => removeIntegration(integration.id)}
                          disabled={actionId === integration.id}
                        >
                          {t.remove}
                        </button>
                      </>
                    ) : integration ? (
                      <>
                        <button
                          className="primary-btn compact-action-btn"
                          type="button"
                          onClick={() => setSetupModal({
                            formId: form.id,
                            formTitle: form.name,
                            integration,
                            googleEmail: googleStatus?.account?.email || null
                          })}
                        >
                          {t.continueSetup}
                        </button>
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
                        onClick={() => setSetupModal({
                          formId: form.id,
                          formTitle: form.name,
                          integration: null,
                          googleEmail: googleStatus?.account?.email || null
                        })}
                      >
                        {t.connectForm}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared forms section */}
      {integrations.some((i) => i.isShared) && (
        <div className="forms-list-card" style={{ marginTop: "1.5rem" }}>
          <div className="official-card-title">
            <h2>{t.sharedWithMe || "Общий доступ"}</h2>
            <span>{integrations.filter((i) => i.isShared).length}</span>
          </div>
          <div className="forms-list">
            {integrations.filter((i) => i.isShared).map((integration) => (
              <article key={integration.id} className="form-management-row">
                <div className="form-row-info">
                  <h3>{integration.formTitle}</h3>
                  <p>
                    <span className="form-status-connected">{t.sharedAccess || "Общий доступ"}</span>
                  </p>
                </div>
                <div className="form-row-actions">
                  <span className="scenario-mini-badge">
                    {scenarioLabel(integration.scenario, lang)}
                  </span>
                  <Link
                    className="primary-btn compact-action-btn"
                    to={`/forms/${encodeURIComponent(integration.formId)}/requests?formTitle=${encodeURIComponent(integration.formTitle || "")}`}
                  >
                    {t.openWorkspace}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {setupModal && (
        <GuidedSetupModal
          mode="forms_api_polling"
          formId={setupModal.formId}
          formTitle={setupModal.formTitle}
          integration={setupModal.integration}
          googleEmail={setupModal.googleEmail}
          onClose={() => setSetupModal(null)}
          onRefresh={loadIntegrations}
        />
      )}

      {shareModal && (
        <ShareModal
          formId={shareModal.formId}
          formTitle={shareModal.formTitle}
          onClose={() => setShareModal(null)}
        />
      )}
    </section>
  );
}
