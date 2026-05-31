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

function deriveStatuses(integration) {
  const step1 = integration?.sheetId ? "found" : "missing";
  let step2 = "locked";
  if (step1 === "found") {
    if (integration?.healthStatus === "connected" || integration?.status === "ready") {
      step2 = "done";
    } else if (integration?.scriptProjectId) {
      step2 = "prepared";
    } else {
      step2 = "ready";
    }
  }
  return { step1, step2 };
}

const SHEET_SETUP_SCREENSHOTS = [
  {
    src: "/setup-screenshots/google-form-responses.png",
    labelKey: "setupSheetShotResponses"
  },
  {
    src: "/setup-screenshots/select-existing-sheet.png",
    labelKey: "setupSheetShotExisting"
  },
  {
    src: "/setup-screenshots/choose-formbridge-sheet.png",
    labelKey: "setupSheetShotChoose"
  },
  {
    src: "/setup-screenshots/insert-selected-sheet.png",
    labelKey: "setupSheetShotInsert"
  }
];

const AUTO_DELIVERY_SCREENSHOTS = [
  {
    src: "/setup-screenshots/apps-script-run.png",
    labelKey: "setupAutoShotRun"
  },
  {
    src: "/setup-screenshots/apps-script-authorization.png",
    labelKey: "setupAutoShotAuthorization"
  },
  {
    src: "/setup-screenshots/apps-script-permissions.png",
    labelKey: "setupAutoShotPermissions"
  }
];

export function GuidedSetupModal({ formId, formTitle, integration: initialIntegration, googleEmail, onClose, onRefresh }) {
  const { t } = useLocale();
  const [integration, setIntegration] = useState(initialIntegration || null);
  const preparedSheetName = integration?.sheetTitle || `FormBridge - ${formTitle}`;

  const initial = deriveStatuses(initialIntegration);
  const [step1Status, setStep1Status] = useState(initial.step1);
  const [step2Status, setStep2Status] = useState(initial.step2);

  const [accordion1Open, setAccordion1Open] = useState(false);
  const [accordion2Open, setAccordion2Open] = useState(false);
  const [scriptUrl, setScriptUrl] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [initLoading, setInitLoading] = useState(!initialIntegration);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialIntegration) {
      initIntegration();
    }
  }, []);

  async function initIntegration() {
    setInitLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/integrations/forms/setup-google", { formId, formTitle });
      const item = data.item;
      setIntegration(item);
      const derived = deriveStatuses(item);
      setStep1Status(derived.step1);
      setStep2Status(derived.step2);
      onRefresh?.();
    } catch (err) {
      setError(err.response?.data?.error || t.failedSetup);
    } finally {
      setInitLoading(false);
    }
  }

  async function checkAgain() {
    setChecking(true);
    setError("");
    try {
      const { data } = await api.get("/api/integrations/forms");
      const found = (data.items || []).find((i) => i.formId === formId);
      if (found) {
        setIntegration(found);
        const derived = deriveStatuses(found);
        setStep1Status(derived.step1);
        if (derived.step2 === "done") {
          setStep2Status("done");
        } else if (derived.step2 !== "locked" && step2Status === "locked") {
          setStep2Status(derived.step2);
        }
        onRefresh?.();
      }
    } catch (err) {
      setError(t.failedLoad);
    } finally {
      setChecking(false);
    }
  }

  async function prepareSetup() {
    if (!integration) return;
    setPreparing(true);
    setError("");
    try {
      const { data } = await api.post(`/api/integrations/forms/${integration.id}/auto-setup`);
      setIntegration(data.item);
      if (data.scriptUrl) setScriptUrl(data.scriptUrl);
      setStep2Status("prepared");
      onRefresh?.();
    } catch (err) {
      setError(err.response?.data?.error || t.failedSetup);
    } finally {
      setPreparing(false);
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
    try {
      const { data } = await api.post(`/api/integrations/forms/${integration.id}/verify`);
      setIntegration(data.item);
      setVerifyResult(data);
      if (!data.broken?.length) {
        setStep2Status("done");
      } else {
        setStep2Status("failed");
      }
      onRefresh?.();
    } catch (err) {
      setError(t.failedLoad);
      setStep2Status("failed");
    } finally {
      setVerifying(false);
    }
  }

  const step2Locked = step1Status !== "found";
  const hasScriptUrl = Boolean(scriptUrl || integration?.scriptProjectId);
  const setupComplete = step2Status === "done";

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="setup-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="setup-modal">

        {/* Header */}
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
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className="setup-intro">{t.setupIntro}</p>

        {error && <p className="setup-error">{error}</p>}
        {initLoading && <p className="setup-loading">{t.loading}</p>}

        {/* Step 1 */}
        <div className={`setup-step${step1Status === "found" ? " setup-step--done" : ""}`}>
          <div className="setup-step-header">
            <span className="setup-step-num">1</span>
            <span className="setup-step-title">{t.setupStepSheets}</span>
            <span className={`setup-status-pill ${step1Status === "found" ? "pill-ok" : checking ? "pill-checking" : "pill-missing"}`}>
              {step1Status === "found" ? t.linkedSheetFound : checking ? t.checking : t.linkedSheetMissing}
            </span>
          </div>
          <p className="setup-step-desc">{t.setupStepSheetsDesc}</p>

          {step1Status === "found" && (
            <div className="setup-sheet-callout">
              <span>{t.preparedSheetLabel}</span>
              <strong>{preparedSheetName}</strong>
            </div>
          )}

          {!initLoading && (
            <div className="setup-actions">
              {integration?.formUrl && (
                <a
                  className="setup-btn-secondary"
                  href={accountAwareUrl(integration.formUrl, googleEmail)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.openGoogleForm}
                </a>
              )}
              {integration?.sheetUrl && (
                <a
                  className="setup-btn-secondary"
                  href={accountAwareUrl(integration.sheetUrl, googleEmail)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.openPreparedSheet}
                </a>
              )}
              <button className="setup-btn-primary" type="button" onClick={checkAgain} disabled={checking}>
                {checking ? t.checking : t.checkAgain}
              </button>
            </div>
          )}

          <div className="setup-accordion">
            <button
              className="setup-accordion-toggle"
              type="button"
              onClick={() => setAccordion1Open((v) => !v)}
            >
              {t.setupHowSheets}
              <span className={`setup-chevron${accordion1Open ? " open" : ""}`} aria-hidden="true" />
            </button>
            {accordion1Open && (
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
        </div>

        {/* Step 2 */}
        <div className={`setup-step${step2Locked ? " setup-step-locked" : ""}${setupComplete ? " setup-step--done" : ""}`}>
          <div className="setup-step-header">
            <span className="setup-step-num">2</span>
            <span className="setup-step-title">{t.setupStepAutoDelivery}</span>
            {step2Locked
              ? <span className="setup-status-pill pill-locked">{t.stepLocked}</span>
              : setupComplete
                ? <span className="setup-status-pill pill-ok">{t.connectionReady}</span>
              : hasScriptUrl
                ? <span className="setup-status-pill pill-checking">{t.setupAutoPrepared}</span>
                : null
            }
          </div>
          <p className="setup-step-desc">{t.setupStepAutoDeliveryDesc}</p>

          {!step2Locked && (
            <>
              {googleEmail && (
                <p className="setup-account-hint">
                  {t.openGoogleSetupAccountHint}: <strong>{googleEmail}</strong>
                </p>
              )}
              <div className="setup-actions">
                <button
                  className="setup-btn-primary"
                  type="button"
                  onClick={prepareSetup}
                  disabled={preparing}
                >
                  {preparing ? t.checking : t.prepareSetup}
                </button>
                {hasScriptUrl && (
                  <button
                    className="setup-btn-primary"
                    type="button"
                    onClick={openGoogleSetup}
                  >
                    {t.openGoogleSetup}
                  </button>
                )}
                {hasScriptUrl && (
                  <button
                    className="setup-btn-secondary"
                    type="button"
                    onClick={verifyConnection}
                    disabled={verifying}
                  >
                    {verifying ? t.checking : t.verifyTrigger}
                  </button>
                )}
              </div>
            </>
          )}

          <div className="setup-accordion">
            <button
              className="setup-accordion-toggle"
              type="button"
              onClick={() => !step2Locked && setAccordion2Open((v) => !v)}
              disabled={step2Locked}
            >
              {t.setupHowAutoDelivery}
              <span className={`setup-chevron${accordion2Open ? " open" : ""}`} aria-hidden="true" />
            </button>
            {accordion2Open && !step2Locked && (
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

          {verifyResult && (
            <div className="setup-check-grid">
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
            <div className="setup-success-celebration">
              <div className="setup-success-mark" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <path d="M9 17.8l5.2 5.2L25.5 11.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="setup-success-title">{t.connectionReady}</p>
              <p className="setup-success-text">{t.setupSuccessText}</p>
              <button className="setup-btn-primary" type="button" onClick={onClose}>
                {t.openWorkspace}
              </button>
            </div>
          )}

          {step2Status === "failed" && verifyResult?.broken?.length > 0 && (
            <div className="setup-reason-list">
              {verifyResult.broken.includes("sheet") && (
                <p>{t.setupMissingSheetReason}</p>
              )}
              {(verifyResult.broken.includes("trigger") || verifyResult.broken.includes("scriptProject")) && (
                <p>{t.setupMissingDeliveryReason}</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
