import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

function accountAwareUrl(url, email) {
  if (!url) return null;
  if (!email) return url;
  const withAccount = new URL(url);
  if (withAccount.hostname.endsWith("google.com")) {
    withAccount.searchParams.set("authuser", email);
  }
  return `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=${encodeURIComponent(withAccount.toString())}`;
}

function scriptEditorUrlFromId(scriptProjectId) {
  return `https://script.google.com/home/projects/${scriptProjectId}/edit`;
}

function deriveSetupStatus(integration) {
  return {
    sheet: integration?.sheetId ? "done" : "idle",
    script: integration?.scriptProjectId ? "done" : "idle",
    permission: integration?.healthStatus === "connected" || integration?.status === "ready" ? "done" : "idle",
    verify: integration?.healthStatus === "connected" || integration?.status === "ready" ? "done" : "idle"
  };
}

const SHEET_SETUP_SCREENSHOTS = [
  { src: "/setup-screenshots/google-form-responses.png", labelKey: "setupSheetShotResponses" },
  { src: "/setup-screenshots/select-existing-sheet.png", labelKey: "setupSheetShotExisting" },
  { src: "/setup-screenshots/choose-formbridge-sheet.png", labelKey: "setupSheetShotChoose" },
  { src: "/setup-screenshots/insert-selected-sheet.png", labelKey: "setupSheetShotInsert" }
];

const AUTO_DELIVERY_SCREENSHOTS = [
  { src: "/setup-screenshots/apps-script-run.png", labelKey: "setupAutoShotRun" },
  { src: "/setup-screenshots/apps-script-authorization.png", labelKey: "setupAutoShotAuthorization" },
  { src: "/setup-screenshots/apps-script-permissions.png", labelKey: "setupAutoShotPermissions" }
];

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

export function GuidedSetupModal({ formId, formTitle, integration: initialIntegration, googleEmail, onClose, onRefresh }) {
  const { t } = useLocale();
  const [integration, setIntegration] = useState(initialIntegration || null);
  const [scriptUrl, setScriptUrl] = useState(
    initialIntegration?.scriptProjectId ? scriptEditorUrlFromId(initialIntegration.scriptProjectId) : null
  );
  const [setupStatus, setSetupStatus] = useState(deriveSetupStatus(initialIntegration));
  const [verifyResult, setVerifyResult] = useState(null);
  const [initLoading, setInitLoading] = useState(!initialIntegration);
  const [autoRunning, setAutoRunning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);
  const [manualDeliveryOpen, setManualDeliveryOpen] = useState(true);
  const [error, setError] = useState("");

  const preparedSheetName = integration?.sheetTitle || `FormBridge - ${formTitle}`;
  const hasScriptUrl = Boolean(scriptUrl || integration?.scriptProjectId);
  const setupComplete = setupStatus.verify === "done";

  useEffect(() => {
    if (!initialIntegration) {
      initIntegration();
    }
  }, []);

  async function initIntegration() {
    setInitLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/integrations/forms/setup-google", { formId, formTitle, createSheet: false });
      setIntegration(data.item);
      setSetupStatus(deriveSetupStatus(data.item));
      onRefresh?.();
    } catch (err) {
      setError(err.response?.data?.error || t.failedSetup);
    } finally {
      setInitLoading(false);
    }
  }

  async function startAutomaticSetup() {
    setAutoRunning(true);
    setError("");
    setVerifyResult(null);
    setManualOpen(false);
    setSetupStatus((prev) => ({
      sheet: prev.sheet === "done" ? "done" : "running",
      script: "idle",
      permission: "idle",
      verify: "idle"
    }));

    try {
      const setupResponse = await api.post("/api/integrations/forms/setup-google", {
        formId,
        formTitle,
        createSheet: true
      });
      const preparedIntegration = setupResponse.data.item;
      setIntegration(preparedIntegration);
      setSetupStatus((prev) => ({ ...prev, sheet: "done", script: "running" }));

      const scriptResponse = await api.post("/api/integrations/apps-script-api/check", {
        integrationId: preparedIntegration.id
      });

      if (!scriptResponse.data.enabled) {
        throw new Error(t.appsScriptApiMissing);
      }

      const item = scriptResponse.data.item || preparedIntegration;
      setIntegration(item);
      if (scriptResponse.data.scriptUrl) setScriptUrl(scriptResponse.data.scriptUrl);
      setSetupStatus((prev) => ({
        ...prev,
        script: "done",
        permission: item.healthStatus === "connected" ? "done" : "running"
      }));
      onRefresh?.();
    } catch (err) {
      setSetupStatus((prev) => ({
        ...prev,
        sheet: prev.sheet === "running" ? "error" : prev.sheet,
        script: prev.script === "running" || prev.script === "idle" ? "error" : prev.script,
        permission: "idle"
      }));
      setManualOpen(true);
      setError(err.response?.data?.error || err.message || t.failedSetup);
    } finally {
      setAutoRunning(false);
    }
  }

  function openGoogleSetup() {
    const base = scriptUrl
      || (integration?.scriptProjectId ? scriptEditorUrlFromId(integration.scriptProjectId) : null);
    if (!base) return;
    const url = accountAwareUrl(base, googleEmail);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function verifyConnection() {
    if (!integration) return;
    setVerifying(true);
    setError("");
    setSetupStatus((prev) => ({ ...prev, verify: "running" }));
    try {
      const { data } = await api.post(`/api/integrations/forms/${integration.id}/verify`);
      setIntegration(data.item);
      setVerifyResult(data);
      if (!data.broken?.length) {
        setSetupStatus((prev) => ({ ...prev, permission: "done", verify: "done" }));
      } else {
        setSetupStatus((prev) => ({
          ...prev,
          permission: data.broken.includes("trigger") ? "running" : prev.permission,
          verify: "error"
        }));
      }
      onRefresh?.();
    } catch (err) {
      setError(t.failedLoad);
      setSetupStatus((prev) => ({ ...prev, verify: "error" }));
    } finally {
      setVerifying(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const progressSteps = [
    {
      key: "sheet",
      title: t.autoSetupSheetTitle,
      desc: integration?.sheetId ? t.autoSetupSheetDone : t.autoSetupSheetDesc,
      status: setupStatus.sheet
    },
    {
      key: "script",
      title: t.autoSetupScriptTitle,
      desc: integration?.scriptProjectId ? t.autoSetupScriptDone : t.autoSetupScriptDesc,
      status: setupStatus.script
    },
    {
      key: "permission",
      title: t.autoSetupPermissionTitle,
      desc: t.autoSetupPermissionDesc,
      status: setupStatus.permission
    },
    {
      key: "verify",
      title: t.autoSetupVerifyTitle,
      desc: t.autoSetupVerifyDesc,
      status: setupStatus.verify
    }
  ];

  return (
    <div className="setup-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="setup-modal setup-modal--compact">
        <div className="setup-header">
          <div className="setup-header-text">
            <h2>{t.connectGoogleForm}</h2>
            <p className="setup-form-title">{formTitle}</p>
            {googleEmail && (
              <p className="setup-account">{t.setupGoogleAccount}: <span>{googleEmail}</span></p>
            )}
          </div>
          <button className="setup-close-btn" type="button" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="setup-intro">{t.autoSetupIntro}</p>

        {error && <p className="setup-error">{error}</p>}
        {initLoading && <p className="setup-loading">{t.loading}</p>}

        <div className="setup-auto-panel">
          <div className="setup-auto-copy">
            <h3>{t.autoSetupTitle}</h3>
            <p>{t.autoSetupSubtitle}</p>
          </div>

          <div className="setup-progress-list">
            {progressSteps.map((step, index) => (
              <div className={`setup-progress-row setup-progress-row--${step.status}`} key={step.key}>
                <StepIcon status={step.status} fallback={index + 1} />
                <div>
                  <strong>{step.title}</strong>
                  <span>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {integration?.sheetUrl && (
            <div className="setup-sheet-callout setup-sheet-callout--auto">
              <span>{t.preparedSheetLabel}</span>
              <strong>{preparedSheetName}</strong>
            </div>
          )}

          <div className="setup-actions setup-actions--auto">
            <button
              className="setup-btn-primary"
              type="button"
              onClick={startAutomaticSetup}
              disabled={initLoading || autoRunning}
            >
              {autoRunning ? t.checking : hasScriptUrl ? t.prepareSetupAgain : t.startAutoSetup}
            </button>
            {hasScriptUrl && (
              <button className="setup-btn-primary" type="button" onClick={openGoogleSetup}>
                {t.openGoogleSetup}
              </button>
            )}
            {hasScriptUrl && (
              <button className="setup-btn-secondary" type="button" onClick={verifyConnection} disabled={verifying}>
                {verifying ? t.checking : t.verifyTrigger}
              </button>
            )}
          </div>

          {hasScriptUrl && !setupComplete && (
            <div className="setup-google-run">
              <h3>{t.googleRunTitle}</h3>
              <ol>
                <li>{t.googleRunStep1}</li>
                <li>{t.googleRunStep2}</li>
                <li>{t.googleRunStep3}</li>
              </ol>
              <div className="setup-screenshot-grid setup-screenshot-grid--run">
                {AUTO_DELIVERY_SCREENSHOTS.map((shot) => (
                  <figure className="setup-screenshot-card" key={shot.src}>
                    <img src={shot.src} alt={t[shot.labelKey]} loading="lazy" />
                    <figcaption>{t[shot.labelKey]}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {verifyResult && (
            <div className="setup-check-grid setup-check-grid--auto">
              <div className={`setup-check-item${verifyResult.checklist?.sheet ? " check-ok" : " check-missing"}`}>
                <span>{t.googleSheet}</span>
                <span className="check-badge">{verifyResult.checklist?.sheet ? "ok" : "missing"}</span>
              </div>
              <div className={`setup-check-item${verifyResult.checklist?.trigger ? " check-ok" : " check-missing"}`}>
                <span>{t.autoDelivery}</span>
                <span className="check-badge">{verifyResult.checklist?.trigger ? "ok" : "missing"}</span>
              </div>
              <div className={`setup-check-item${verifyResult.checklist?.webhookUrl ? " check-ok" : " check-missing"}`}>
                <span>Webhook</span>
                <span className="check-badge">{verifyResult.checklist?.webhookUrl ? "ok" : "missing"}</span>
              </div>
            </div>
          )}

          {setupComplete && (
            <div className="setup-success-celebration setup-success-celebration--auto">
              <div className="setup-success-mark" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <path d="M9 17.8l5.2 5.2L25.5 11.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="setup-success-title">{t.connectionReady}</p>
              <p className="setup-success-text">{t.setupSuccessText}</p>
              <button className="setup-btn-primary" type="button" onClick={onClose}>
                {t.openWorkspace}
              </button>
            </div>
          )}

          <button className="setup-manual-toggle" type="button" onClick={() => setManualOpen((v) => !v)}>
            {manualOpen ? t.hideManualSetup : t.showManualSetup}
            <span className={`setup-chevron${manualOpen ? " open" : ""}`} aria-hidden="true" />
          </button>
        </div>

        {manualOpen && (
          <div className="setup-manual-panel">
            <div className="setup-accordion">
              <button
                className="setup-accordion-toggle"
                type="button"
                onClick={() => setManualSheetOpen((v) => !v)}
              >
                {t.setupHowSheets}
                <span className={`setup-chevron${manualSheetOpen ? " open" : ""}`} aria-hidden="true" />
              </button>
              {manualSheetOpen && (
                <div className="setup-accordion-body">
                  <ol className="setup-instructions">
                    <li>{t.setupSheetInstruction1}</li>
                    <li>{t.setupSheetInstruction2}</li>
                    <li>{t.setupSheetInstruction3}: <strong>{preparedSheetName}</strong></li>
                    <li>{t.setupSheetInstruction4}</li>
                    <li>{t.setupSheetInstruction5}</li>
                  </ol>
                  <div className="setup-screenshot-grid">
                    {SHEET_SETUP_SCREENSHOTS.map((shot) => (
                      <figure className="setup-screenshot-card" key={shot.src}>
                        <img src={shot.src} alt={t[shot.labelKey]} loading="lazy" />
                        <figcaption>{t[shot.labelKey]}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="setup-accordion">
              <button
                className="setup-accordion-toggle"
                type="button"
                onClick={() => setManualDeliveryOpen((v) => !v)}
              >
                {t.setupHowAutoDelivery}
                <span className={`setup-chevron${manualDeliveryOpen ? " open" : ""}`} aria-hidden="true" />
              </button>
              {manualDeliveryOpen && (
                <div className="setup-accordion-body">
                  <ol className="setup-instructions">
                    <li>{t.setupAutoInstruction1}</li>
                    <li>{t.setupAutoInstruction2}</li>
                    <li>{t.setupAutoInstruction3}</li>
                    <li>{t.setupAutoInstruction4}</li>
                    <li>{t.setupAutoInstruction5}</li>
                    <li>{t.setupAutoInstruction6}</li>
                  </ol>
                  <div className="setup-screenshot-grid">
                    {AUTO_DELIVERY_SCREENSHOTS.map((shot) => (
                      <figure className="setup-screenshot-card" key={shot.src}>
                        <img src={shot.src} alt={t[shot.labelKey]} loading="lazy" />
                        <figcaption>{t[shot.labelKey]}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
