import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

function StepIcon({ status, fallback }) {
  if (status === "running") {
    return <span className="setup-progress-spinner" aria-hidden="true" />;
  }

  if (status === "done") {
    return (
      <span className="setup-progress-check" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.2l2.6 2.6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === "error") {
    return <span className="setup-progress-error" aria-hidden="true">!</span>;
  }

  return <span className="setup-progress-num">{fallback}</span>;
}

function setupErrorText(t, apiMessage) {
  if (apiMessage && apiMessage !== "Forbidden") return apiMessage;
  return t.pollingSetupError || "Не удалось подключить форму. Проверьте, что у аккаунта есть доступ к этой Google Form.";
}

export function GuidedSetupModal({ formId, formTitle, integration: initialIntegration, googleEmail, onClose, onRefresh }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [integration, setIntegration] = useState(initialIntegration || null);
  const [stepKey, setStepKey] = useState("access");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState(null);

  const steps = useMemo(() => ([
    { key: "access", title: t.pollingStepAccess || "Проверяем доступ к Google Form" },
    { key: "structure", title: t.pollingStepStructure || "Получаем структуру формы" },
    { key: "responses", title: t.pollingStepResponses || "Загружаем последние ответы" },
    { key: "sync", title: t.pollingStepSync || "Включаем автоматическую синхронизацию" },
    { key: "done", title: t.pollingStepDone || "Готово: форма подключена" }
  ]), [t]);

  const stepIndex = Math.max(0, steps.findIndex((step) => step.key === stepKey));
  const displayTitle = syncResult?.integration?.formTitle || integration?.formTitle || formTitle;

  useEffect(() => {
    let alive = true;

    async function runSetup() {
      setBusy(true);
      setError("");
      setSyncResult(null);

      try {
        setStepKey("access");
        const prepared = integration || (await api.post("/api/integrations/forms/setup-google", {
          formId,
          formTitle,
          createSheet: false
        })).data.item;

        if (!alive) return;
        setIntegration(prepared);
        setStepKey("structure");

        const timer = window.setTimeout(() => {
          if (alive) setStepKey("responses");
        }, 350);

        const { data } = await api.post(`/api/integrations/forms/${prepared.id}/enable-polling`);
        window.clearTimeout(timer);

        if (!alive) return;
        setStepKey("sync");
        setIntegration(data.integration || prepared);
        setSyncResult(data);
        window.setTimeout(() => {
          if (alive) {
            setStepKey("done");
            setBusy(false);
            onRefresh?.();
          }
        }, 250);
      } catch (_err) {
        if (!alive) return;
        setStepKey((current) => current || "access");
        setError(setupErrorText(t, _err?.response?.data?.error));
        setBusy(false);
      }
    }

    runSetup();

    return () => {
      alive = false;
    };
  }, [formId]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !busy) onClose();
  }

  function openDashboard() {
    onClose();
    navigate(`/forms/${encodeURIComponent(formId)}/requests?formTitle=${encodeURIComponent(displayTitle || formTitle || "")}`);
  }

  function retry() {
    setIntegration((value) => value);
    setStepKey("access");
    setError("");
    setBusy(true);
    setSyncResult(null);
    const current = integration;
    Promise.resolve()
      .then(async () => {
        const prepared = current || (await api.post("/api/integrations/forms/setup-google", {
          formId,
          formTitle,
          createSheet: false
        })).data.item;
        setIntegration(prepared);
        setStepKey("responses");
        const { data } = await api.post(`/api/integrations/forms/${prepared.id}/enable-polling`);
        setIntegration(data.integration || prepared);
        setSyncResult(data);
        setStepKey("done");
        onRefresh?.();
      })
      .catch((err) => {
        setError(setupErrorText(t, err?.response?.data?.error));
        setStepKey("access");
      })
      .finally(() => setBusy(false));
  }

  const isDone = stepKey === "done" && syncResult?.ok;

  return (
    <div className="setup-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="setup-modal setup-modal--compact">
        <div className="setup-header">
          <div className="setup-header-text">
            <h2>{t.connectGoogleForm}</h2>
            <p className="setup-form-title">{displayTitle}</p>
            {googleEmail ? (
              <p className="setup-account">{t.setupGoogleAccount}: <span>{googleEmail}</span></p>
            ) : null}
          </div>
          <button className="setup-close-btn" type="button" onClick={onClose} aria-label="Close" disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="setup-intro">{t.pollingSetupIntro || "FormBridge подключит форму через Google Forms API и включит автоматическое обновление ответов."}</p>

        {error ? <p className="setup-error">{error}</p> : null}

        <div className="setup-auto-panel">
          <div className="setup-auto-copy">
            <h3>{t.pollingSetupTitle || t.autoSetupTitle}</h3>
            <p>{t.pollingSetupSubtitle || "Ответы будут синхронизироваться из Google Forms API без ручной настройки в Google."}</p>
          </div>

          <div className="setup-progress-list">
            {steps.map((step, index) => {
              const status = error
                ? index === stepIndex ? "error" : index < stepIndex ? "done" : "idle"
                : isDone || index < stepIndex ? "done" : index === stepIndex ? "running" : "idle";
              return (
                <div className={`setup-progress-row setup-progress-row--${status}`} key={step.key}>
                  <StepIcon status={status} fallback={index + 1} />
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.key === "sync" ? (t.pollingStepSyncDesc || "Ответы будут обновляться каждые 1–2 минуты.") : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {isDone ? (
            <div className="setup-success-celebration setup-success-celebration--auto">
              <div className="setup-success-mark" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <path d="M9 17.8l5.2 5.2L25.5 11.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="setup-success-title">{t.connectionReady}</p>
              <p className="setup-success-text">{t.pollingSetupSuccess || "Автоматическая синхронизация включена. Ответы будут обновляться каждые 1–2 минуты."}</p>
              <div className="setup-check-grid setup-check-grid--auto">
                <div className="setup-check-item check-ok">
                  <span>{t.connectionMethod || "Connection method"}</span>
                  <span className="check-badge">Google Forms API</span>
                </div>
                <div className="setup-check-item check-ok">
                  <span>{t.loadedResponses || "Loaded responses"}</span>
                  <span className="check-badge">{syncResult.total ?? 0}</span>
                </div>
                <div className="setup-check-item check-ok">
                  <span>{t.newResponses || "New"}</span>
                  <span className="check-badge">{syncResult.created ?? 0}</span>
                </div>
              </div>
              <button className="setup-btn-primary" type="button" onClick={openDashboard}>
                {t.openWorkspace}
              </button>
            </div>
          ) : (
            <div className="setup-actions setup-actions--auto">
              {error ? (
                <button className="setup-btn-primary" type="button" onClick={retry}>
                  {t.checkAgain}
                </button>
              ) : (
                <button className="setup-btn-primary" type="button" disabled>
                  {t.checking}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
