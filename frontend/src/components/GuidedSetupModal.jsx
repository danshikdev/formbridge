import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

function accountAwareUrl(url, email) {
  if (!url) return null;
  if (!email) return url;
  return `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=${encodeURIComponent(url)}`;
}

function deriveStatuses(integration) {
  const step1 = integration?.sheetId ? "found" : "missing";
  let step2 = "locked";
  if (step1 === "found") {
    step2 = integration?.scriptProjectId ? "prepared" : "ready";
  }
  let step3 = "locked";
  if (step2 === "prepared") {
    step3 = integration?.setupChecklist?.lastTest ? "ok" : "ready";
  }
  return { step1, step2, step3 };
}

export function GuidedSetupModal({ formId, formTitle, integration: initialIntegration, googleEmail, onClose, onRefresh }) {
  const { t } = useLocale();
  const [integration, setIntegration] = useState(initialIntegration || null);

  const initial = deriveStatuses(initialIntegration);
  const [step1Status, setStep1Status] = useState(initial.step1);
  const [step2Status, setStep2Status] = useState(initial.step2);
  const [step3Status, setStep3Status] = useState(initial.step3);

  const [accordion1Open, setAccordion1Open] = useState(false);
  const [accordion2Open, setAccordion2Open] = useState(false);
  const [scriptUrl, setScriptUrl] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [initLoading, setInitLoading] = useState(!initialIntegration);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
      setStep3Status(derived.step3);
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
        if (derived.step2 !== "locked" && step2Status === "locked") setStep2Status(derived.step2);
        if (derived.step3 !== "locked" && step3Status === "locked") setStep3Status(derived.step3);
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
      if (step3Status === "locked") setStep3Status("ready");
      onRefresh?.();
    } catch (err) {
      setError(err.response?.data?.error || t.failedSetup);
    } finally {
      setPreparing(false);
    }
  }

  function openGoogleSetup() {
    const base = scriptUrl
      || (integration?.scriptProjectId ? `https://script.google.com/d/${integration.scriptProjectId}/edit` : null);
    if (!base) return;
    const url = accountAwareUrl(base, googleEmail);
    window.open(url, "_blank", "noopener,noreferrer");
    setStep2Status("opened");
    if (step3Status === "locked") setStep3Status("ready");
  }

  async function copySetupLink() {
    const base = scriptUrl
      || (integration?.scriptProjectId ? `https://script.google.com/d/${integration.scriptProjectId}/edit` : "");
    if (!base) return;
    try {
      await navigator.clipboard.writeText(base);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
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
        setStep3Status("ok");
      } else {
        setStep3Status("failed");
      }
      onRefresh?.();
    } catch (err) {
      setError(t.failedLoad);
      setStep3Status("failed");
    } finally {
      setVerifying(false);
    }
  }

  const step2Locked = step1Status !== "found";
  const step3Locked = step2Status === "locked" || step2Status === "ready";
  const hasScriptUrl = Boolean(scriptUrl || integration?.scriptProjectId);
  const step2Opened = step2Status === "prepared" || step2Status === "opened";

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

          {step1Status !== "found" && !initLoading && (
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
                  <li>{t.setupSheetInstruction3}</li>
                  <li>{t.setupSheetInstruction4}</li>
                  <li>{t.setupSheetInstruction5}</li>
                </ol>
                <div className="setup-screenshot-grid">
                  <div className="setup-screenshot-placeholder">
                    <span className="screenshot-label">Screenshot: Responses tab</span>
                    <span className="screenshot-hint">{t.addScreenshotLater}</span>
                  </div>
                  <div className="setup-screenshot-placeholder">
                    <span className="screenshot-label">Screenshot: Link to Sheets button</span>
                    <span className="screenshot-hint">{t.addScreenshotLater}</span>
                  </div>
                  <div className="setup-screenshot-placeholder">
                    <span className="screenshot-label">Screenshot: Create spreadsheet</span>
                    <span className="screenshot-hint">{t.addScreenshotLater}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div className={`setup-step${step2Locked ? " setup-step-locked" : ""}${step2Opened ? " setup-step--done" : ""}`}>
          <div className="setup-step-header">
            <span className="setup-step-num">2</span>
            <span className="setup-step-title">{t.setupStepAutoDelivery}</span>
            {step2Locked
              ? <span className="setup-status-pill pill-locked">{t.stepLocked}</span>
              : step2Opened
                ? <span className="setup-status-pill pill-ok">{t.linkedSheetFound}</span>
                : null
            }
          </div>
          <p className="setup-step-desc">{t.setupStepAutoDeliveryDesc}</p>

          {!step2Locked && (
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
                  onClick={copySetupLink}
                >
                  {copied ? "Copied" : t.copySetupLink}
                </button>
              )}
            </div>
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
                  <div className="setup-screenshot-placeholder">
                    <span className="screenshot-label">Screenshot: select installFormBridge</span>
                    <span className="screenshot-hint">{t.addScreenshotLater}</span>
                  </div>
                  <div className="setup-screenshot-placeholder">
                    <span className="screenshot-label">Screenshot: Run button</span>
                    <span className="screenshot-hint">{t.addScreenshotLater}</span>
                  </div>
                  <div className="setup-screenshot-placeholder">
                    <span className="screenshot-label">Screenshot: Allow permissions</span>
                    <span className="screenshot-hint">{t.addScreenshotLater}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3 */}
        <div className={`setup-step${step3Locked ? " setup-step-locked" : ""}${step3Status === "ok" ? " setup-step--done" : ""}`}>
          <div className="setup-step-header">
            <span className="setup-step-num">3</span>
            <span className="setup-step-title">{t.setupStepVerify}</span>
            {step3Locked && (
              <span className="setup-status-pill pill-locked">{t.stepLocked}</span>
            )}
            {step3Status === "ok" && (
              <span className="setup-status-pill pill-ok">{t.connectionReady}</span>
            )}
          </div>
          <p className="setup-step-desc">{t.setupStepVerifyDesc}</p>

          {!step3Locked && step3Status !== "ok" && (
            <div className="setup-actions">
              <button
                className="setup-btn-primary"
                type="button"
                onClick={verifyConnection}
                disabled={verifying}
              >
                {verifying ? t.checking : t.verifyConnection}
              </button>
            </div>
          )}

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
              <div className={`setup-check-item${verifyResult.checklist?.lastTest ? " check-ok" : " check-missing"}`}>
                <span>{t.testEvent}</span>
                <span className="check-badge">{verifyResult.checklist?.lastTest ? "ok" : "missing"}</span>
              </div>
            </div>
          )}

          {step3Status === "ok" && (
            <div className="setup-ready-banner">
              <p className="setup-ready-text">{t.connectionReady}</p>
              <button className="setup-btn-primary" type="button" onClick={onClose}>
                {t.openWorkspace}
              </button>
            </div>
          )}

          {step3Status === "failed" && verifyResult?.broken?.length > 0 && (
            <div className="setup-reason-list">
              {verifyResult.broken.includes("sheet") && (
                <p>{t.setupMissingSheetReason}</p>
              )}
              {(verifyResult.broken.includes("trigger") || verifyResult.broken.includes("scriptProject")) && (
                <p>{t.setupMissingDeliveryReason}</p>
              )}
              {verifyResult.broken.includes("lastTest") && (
                <p>{t.setupMissingTestReason}</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
