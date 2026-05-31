import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";
import { IconGrid, IconAcademic, IconUser, IconChart, IconMessage, IconCalendar } from "../shared/icons";

// ─── Scenario definitions (mirrors backend) ───────────────────────────────────

const SCENARIO_IDS = ["universal", "admissions", "hr", "survey", "client_requests", "event"];

const SCENARIO_CARDS = {
  universal:       { Icon: IconGrid,     colorClass: "sc-universal" },
  admissions:      { Icon: IconAcademic, colorClass: "sc-admissions" },
  hr:              { Icon: IconUser,     colorClass: "sc-hr" },
  survey:          { Icon: IconChart,    colorClass: "sc-survey" },
  client_requests: { Icon: IconMessage,  colorClass: "sc-client" },
  event:           { Icon: IconCalendar, colorClass: "sc-event" }
};

const SCENARIO_LABELS_STATIC = {
  universal:       { kk: "Жалпылама режим", ru: "Универсальный режим", en: "Universal mode" },
  admissions:      { kk: "Қабылдау комиссиясы", ru: "Приемная комиссия", en: "Admissions" },
  hr:              { kk: "HR / Рекрутинг", ru: "HR / Рекрутинг", en: "HR / Recruiting" },
  survey:          { kk: "Сауалнама", ru: "Опрос", en: "Survey" },
  client_requests: { kk: "Клиент өтініштері", ru: "Клиентские заявки", en: "Client requests" },
  event:           { kk: "Іс-шара тіркеу", ru: "Регистрация на мероприятие", en: "Event registration" }
};

const SCENARIO_DESC_STATIC = {
  universal:       { kk: "Кез келген форма үшін стандартты режим", ru: "Стандартный режим для любой формы", en: "Standard mode for any form" },
  admissions:      { kk: "Колледж/университет өтініштерін өңдеу", ru: "Обработка заявок на поступление", en: "College / university application processing" },
  hr:              { kk: "Үміткерлерді іріктеу және рекрутинг", ru: "Отбор кандидатов и рекрутинг", en: "Candidate screening and recruiting" },
  survey:          { kk: "Сауалнама және зерттеу нәтижелерін талдау", ru: "Анализ результатов опроса и исследования", en: "Survey and research results analysis" },
  client_requests: { kk: "Клиент өтініштерін және тапсырыстарды өңдеу", ru: "Обработка клиентских заявок и обращений", en: "Client request and order processing" },
  event:           { kk: "Іс-шараға қатысушыларды тіркеу", ru: "Управление регистрациями участников", en: "Manage event participant registrations" }
};

const SCENARIO_QUICK_ACTIONS = {
  admissions:      ["contacted", "documents_needed", "accepted", "rejected"],
  hr:              ["shortlisted", "interview", "hired", "rejected"],
  client_requests: ["urgent", "in_progress", "waiting_client", "done"],
  event:           ["confirmed", "waiting_payment", "attended", "cancelled"],
  universal:       ["in_progress", "done"],
  survey:          []
};

const ATTENTION_STATUSES = {
  admissions:      ["new", "documents_needed"],
  hr:              ["new", "interview"],
  client_requests: ["new", "urgent", "waiting_client"],
  event:           ["new", "waiting_payment"],
  universal:       ["new"],
  survey:          []
};

const DATE_FILTERS = ["all", "today", "yesterday", "last7", "last30", "custom"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWithinDateRange(dateStr, range, from, to) {
  if (range === "all") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (range === "today") return d.toDateString() === now.toDateString();
  if (range === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  }
  if (range === "last7") return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "last30") return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (range === "custom") {
    if (!from && !to) return true;
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      if (d < fromDate) return false;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      if (d > toDate) return false;
    }
    return true;
  }
  return true;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function statusLabel(status, t) {
  const map = {
    new: t.new,
    in_progress: t.inProgress,
    done: t.done,
    test: t.test,
    contacted: t.statusContacted,
    documents_needed: t.statusDocumentsNeeded,
    accepted: t.statusAccepted,
    rejected: t.statusRejected,
    shortlisted: t.statusShortlisted,
    interview: t.statusInterview,
    hired: t.statusHired,
    urgent: t.statusUrgent,
    waiting_client: t.statusWaitingClient,
    confirmed: t.statusConfirmed,
    waiting_payment: t.statusWaitingPayment,
    cancelled: t.statusCancelled,
    attended: t.statusAttended
  };
  return map[status] || status;
}

function cleanQuestionLabel(value, index, t) {
  const raw = String(value || "").trim();
  if (!raw) return `${t.question} ${index + 1}`;
  return raw
    .replace(/^Отметка времени$/i, t.submittedTime)
    .replace(/^Timestamp$/i, t.submittedTime)
    .replace(/^Столбец\s*\d+$/i, `${t.question} ${index + 1}`)
    .replace(/\s*\[(Вопрос|Question)\s*\d+\]\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim() || `${t.question} ${index + 1}`;
}

function actionLabel(action, t) {
  const map = {
    contacted:        t.actionContacted,
    documents_needed: t.actionDocumentsNeeded,
    accepted:         t.actionAccepted,
    rejected:         t.actionRejected,
    shortlisted:      t.actionShortlisted,
    interview:        t.actionInterview,
    hired:            t.actionHired,
    urgent:           t.actionUrgent,
    in_progress:      t.actionInProgress,
    waiting_client:   t.actionWaitingClient,
    done:             t.actionDone,
    confirmed:        t.actionConfirmed,
    waiting_payment:  t.actionWaitingPayment,
    attended:         t.actionAttended,
    cancelled:        t.actionCancelled,
    new:              t.new
  };
  return map[action] || action;
}

function answerValue(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function answersForView(answers = [], t) {
  return answers.map((answer, index) => ({
    label: cleanQuestionLabel(answer.question, index, t),
    value: answerValue(answer.answer)
  }));
}

function preview(item, t) {
  const first = answersForView(item.answers || [], t).find((answer) => answer.value !== "-");
  return first ? `${first.label}: ${first.value}` : t.noAnswerData;
}

function requestSearchText(item, t) {
  return [
    item.formTitle, item.formId, item.respondentEmail, item.status,
    ...answersForView(item.answers || [], t).flatMap((a) => [a.label, a.value])
  ].join(" ").toLowerCase();
}

// ─── Export helpers ────────────────────────────────────────────────────────────

function buildFileName(ext) {
  const date = new Date().toISOString().slice(0, 10);
  return `formbridge-requests-${date}.${ext}`;
}

function collectAllQuestions(items, t) {
  const seen = new Set();
  const labels = [];
  for (const item of items) {
    for (const { label } of answersForView(item.answers || [], t)) {
      if (!seen.has(label)) { seen.add(label); labels.push(label); }
    }
  }
  return labels;
}

function csvCell(value) {
  const str = String(value ?? "");
  return str.includes('"') || str.includes(",") || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function doExportCSV(filteredItems, t) {
  const questionLabels = collectAllQuestions(filteredItems, t);
  const headers = [t.submitted, t.formColumn, t.email, t.status, ...questionLabels];
  const rows = filteredItems.map((item) => {
    const answerMap = {};
    for (const { label, value } of answersForView(item.answers || [], t)) answerMap[label] = value;
    return [
      formatDate(item.submittedAt || item.createdAt),
      item.formTitle || item.formId || "",
      item.respondentEmail || "",
      item.status || "",
      ...questionLabels.map((q) => answerMap[q] || "")
    ].map(csvCell).join(",");
  });
  const csv = [headers.map(csvCell).join(","), ...rows].join("\r\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), buildFileName("csv"));
}

function doExportJSON(filteredItems, t) {
  const data = filteredItems.map((item) => {
    const answers = {};
    for (const { label, value } of answersForView(item.answers || [], t)) answers[label] = value;
    return {
      submittedAt: item.submittedAt || item.createdAt || null,
      formTitle: item.formTitle || item.formId || "",
      respondentEmail: item.respondentEmail || "",
      status: item.status || "",
      answers
    };
  });
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), buildFileName("json"));
}

// ─── Scenario Select Banner ───────────────────────────────────────────────────

function ScenarioSelectBanner({ formId, lang, t, onSelected }) {
  const [saving, setSaving] = useState("");

  async function select(id) {
    setSaving(id);
    try {
      await api.patch(`/api/forms/${encodeURIComponent(formId)}/scenario`, { scenario: id });
      sessionStorage.setItem("fb_toast", t.scenarioConfigured);
      onSelected(id);
    } catch {
      // ignore — user can try again
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="scenario-banner">
      <div className="scenario-banner-header">
        <h2>{t.scenarioSelectTitle}</h2>
        <p>{t.scenarioSelectSubtitle}</p>
      </div>
      <div className="scenario-cards-grid">
        {SCENARIO_IDS.map((id) => {
          const card = SCENARIO_CARDS[id];
          const label = (SCENARIO_LABELS_STATIC[id] || {})[lang] || id;
          const desc = (SCENARIO_DESC_STATIC[id] || {})[lang] || "";
          return (
            <button
              key={id}
              className={`scenario-card ${card.colorClass}`}
              onClick={() => select(id)}
              disabled={Boolean(saving)}
            >
              <span className="scenario-card-icon"><card.Icon size={22} /></span>
              <span className="scenario-card-title">{label}</span>
              <span className="scenario-card-desc">{desc}</span>
              <span className="scenario-card-btn">
                {saving === id ? "..." : t.scenarioSelectBtn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Chat Block ────────────────────────────────────────────────────────────

function AIChatBlock({ formId, formTitle, scenario, scenarioMeta, lang, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = (scenarioMeta?.suggestedQuestions || {})[lang] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const { data } = await api.post("/api/ai/form-chat", {
        formId,
        formTitle,
        scenario: scenario || "universal",
        message: msg,
        lang: lang || "ru"
      });
      const reply = String(data.reply || "").trim();
      setMessages((prev) => [...prev, reply
        ? { role: "ai", text: reply }
        : { role: "error", text: t.aiChatErrorGeneral }
      ]);
    } catch (err) {
      const status = err.response?.status;
      let errText = t.aiChatErrorGeneral;
      if (status === 503) errText = t.aiChatError503;
      else if (status === 502) errText = t.aiChatError502;
      setMessages((prev) => [...prev, { role: "error", text: errText }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="ai-chat-block">
      <div className="ai-chat-header">
        <span className="ai-chat-title">{t.aiChatTitle}</span>
        {scenario && scenario !== "universal" && (
          <span className="ai-chat-scenario-tag">
            {(SCENARIO_LABELS_STATIC[scenario] || {})[lang] || scenario}
          </span>
        )}
      </div>

      {suggestedQuestions.length > 0 && messages.length === 0 && (
        <div className="ai-chat-quick">
          {suggestedQuestions.map((q, i) => (
            <button key={i} className="ai-chat-quick-btn" onClick={() => send(q)} disabled={loading}>
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-chat-msg ai-chat-msg--${msg.role}`}>
              <span className="ai-chat-msg-text">{msg.text}</span>
            </div>
          ))}
          {loading && (
            <div className="ai-chat-msg ai-chat-msg--ai ai-chat-msg--loading">
              <span className="ai-chat-msg-text">{t.aiChatLoading}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="ai-chat-input-row">
        <textarea
          className="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t.aiChatPlaceholder}
          rows={2}
          disabled={loading}
        />
        <button
          className="ai-chat-send-btn official-link-btn"
          onClick={() => send()}
          disabled={!input.trim() || loading}
        >
          {t.aiChatSend}
        </button>
      </div>
    </div>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────

function FeedbackModal({ formId, t, onClose }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!message.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/forms/${encodeURIComponent(formId)}/feedback`, { message: message.trim() });
      setDone(true);
      setTimeout(() => {
        sessionStorage.setItem("fb_toast", t.feedbackSuccess);
        onClose();
      }, 900);
    } catch {
      setError(t.feedbackError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="feedback-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="feedback-modal">
        <h3>{t.feedbackTitle}</h3>
        {done ? (
          <p className="feedback-success-msg">{t.feedbackSuccess}</p>
        ) : (
          <>
            <textarea
              className="feedback-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.feedbackPlaceholder}
              rows={4}
              disabled={saving}
            />
            {error && <p className="error" style={{ margin: "6px 0 0", fontSize: "0.84rem" }}>{error}</p>}
            <div className="feedback-modal-actions">
              <button className="official-link-btn" onClick={onClose} disabled={saving}>{t.all === "Все" ? "Отмена" : t.all === "Барлығы" ? "Болдырмау" : "Cancel"}</button>
              <button className="primary-btn compact-action-btn" onClick={submit} disabled={saving || !message.trim()}>
                {saving ? "..." : t.feedbackSubmit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Notification Settings Block ──────────────────────────────────────────────

const NOTIF_MODES = ["every_submission", "threshold"];

function normalizeWhatsAppPhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;

  return null;
}

function NotificationSettingsBlock({ formId, formTitle, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mode, setMode] = useState("every_submission");
  const [thresholdCount, setThresholdCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!formId) return;
    setLoading(true);
    setLoadError("");
    api.get(`/api/forms/${formId}/notification-settings`)
      .then(({ data }) => {
        setEnabled(Boolean(data.enabled));
        setPhoneNumber(data.phoneNumber || "");
        setMode(data.mode || "every_submission");
        setThresholdCount(data.thresholdCount ?? 5);
      })
      .catch(() => setLoadError(t.notifFailedLoad))
      .finally(() => setLoading(false));
  }, [formId]);

  async function save() {
    const normalizedPhone = normalizeWhatsAppPhoneInput(phoneNumber);

    if (enabled && !normalizedPhone) {
      setSaveError(t.notifPhoneInvalid);
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const { data } = await api.put(`/api/forms/${formId}/notification-settings`, {
        enabled,
        phoneNumber: normalizedPhone || "",
        mode,
        thresholdCount: mode === "threshold" ? Number(thresholdCount) : null
      });
      setPhoneNumber(data.phoneNumber || normalizedPhone || "");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.error || t.notifFailedSave);
    } finally {
      setSaving(false);
    }
  }

  const previewMsg = (t.notifPreviewMsg || "").replace("{form}", formTitle || formId || "...");

  if (!formId) return null;

  return (
    <div className="notif-block">
      <div
        className={`notif-header notif-collapsible-header${isOpen ? " notif-is-open" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIsOpen((o) => !o); }}
      >
        <div className="notif-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9c0 1.44.39 2.79 1.07 3.95L1.5 16.5l3.62-1.14A7.47 7.47 0 0 0 9 16.5c4.14 0 7.5-3.36 7.5-7.5S13.14 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M6 9h6M6 6.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="notif-header-text">
          <div className="notif-title">{t.notifTitle}</div>
          <div className="notif-subtitle">
            {!loading && !loadError ? (
              <>
                <span className={`whatsapp-status-pill whatsapp-status-pill--${enabled ? "on" : "off"}`}>
                  {enabled ? t.whatsappStatusOn : t.whatsappStatusOff}
                </span>
                {enabled && !isOpen && phoneNumber && (
                  <span className="notif-phone-masked">
                    {phoneNumber.slice(0, 4)}{"•".repeat(Math.max(0, phoneNumber.length - 7))}{phoneNumber.slice(-3)}
                  </span>
                )}
              </>
            ) : t.notifSubtitle}
          </div>
        </div>
        <span className="notif-mock-badge">WhatsApp</span>
        <svg
          className={`notif-chevron${isOpen ? " notif-chevron--open" : ""}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isOpen && (
        loading ? (
          <p className="muted" style={{ padding: "4px 0 0" }}>{t.loading}</p>
        ) : loadError ? (
          <p className="error" style={{ padding: "4px 0 0" }}>{loadError}</p>
        ) : (
          <div className="notif-body">
            <label className="notif-toggle-row">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span>{t.notifEnabled}</span>
            </label>

            {enabled && (
              <div className="notif-fields">
                <label className="notif-field">
                  <span>{t.notifPhone}</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setSaveError("");
                    }}
                    onBlur={() => {
                      const normalized = normalizeWhatsAppPhoneInput(phoneNumber);
                      if (normalized) setPhoneNumber(normalized);
                    }}
                    placeholder={t.notifPhonePh}
                  />
                  <small className="notif-field-hint">{t.notifPhoneHint}</small>
                </label>
                <label className="notif-field">
                  <span>{t.notifMode}</span>
                  <select value={mode} onChange={(e) => setMode(e.target.value)}>
                    {NOTIF_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m === "every_submission" ? t.notifModeEvery : m === "threshold" ? t.notifModeThreshold : t.notifModeDaily}
                      </option>
                    ))}
                  </select>
                </label>
                {mode === "threshold" && (
                  <label className="notif-field">
                    <span>{t.notifThreshold}</span>
                    <input type="number" min="1" value={thresholdCount} onChange={(e) => setThresholdCount(e.target.value)} />
                  </label>
                )}
                <div className="notif-preview">
                  <div className="notif-preview-label">{t.notifPreview}</div>
                  <div className="notif-preview-bubble">{previewMsg}</div>
                </div>
              </div>
            )}

            <div className="notif-actions">
              <button className="official-link-btn" onClick={save} disabled={saving}>
                {saving ? t.loading : t.notifSave}
              </button>
              {saved && <span className="notif-saved-msg">{t.notifSaved}</span>}
              {saveError && <span className="error">{saveError}</span>}
            </div>
            <p className="whatsapp-demo-helper">{t.whatsappDemoHelper}</p>
          </div>
        )
      )}
    </div>
  );
}

// ─── Analytics Block ──────────────────────────────────────────────────────────

const STATUS_ORDER = ["new", "in_progress", "done", "test"];

function AnalyticsBlock({ items, t }) {
  const analytics = useMemo(() => {
    const now = new Date();
    const todayCount = items.filter((item) => {
      const d = new Date(item.submittedAt || item.createdAt);
      return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
    }).length;
    const weekCount = items.filter((item) => {
      const d = new Date(item.submittedAt || item.createdAt);
      return !Number.isNaN(d.getTime()) && d >= new Date(now - 7 * 86400000);
    }).length;
    const sorted = [...items].sort(
      (a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
    );
    const lastItem = sorted[0];
    const statusCounts = { new: 0, in_progress: 0, done: 0, test: 0 };
    for (const item of items) {
      if (item.status in statusCounts) statusCounts[item.status]++;
    }
    const answerMap = {};
    for (const item of items) {
      for (const ans of (item.answers || [])) {
        const q = String(ans.question || "").trim();
        const a = String(ans.answer || "").trim();
        if (!q || !a) continue;
        if (!answerMap[q]) answerMap[q] = {};
        answerMap[q][a] = (answerMap[q][a] || 0) + 1;
      }
    }
    const popularQuestions = Object.entries(answerMap)
      .map(([q, answers]) => {
        const top3 = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return { question: q, top3 };
      })
      .filter((q) => q.top3.length >= 2 && q.top3[0][1] > 1)
      .slice(0, 3);
    return { todayCount, weekCount, lastItem, statusCounts, popularQuestions };
  }, [items]);

  if (items.length === 0) return null;
  const total = items.length;

  return (
    <div className="analytics-wrap">
      <div className="analytics-stats-row">
        <div className="analytics-stat-card">
          <span>{t.totalRequests}</span>
          <strong>{total}</strong>
        </div>
        <div className="analytics-stat-card">
          <span>{t.analyticsToday}</span>
          <strong>{analytics.todayCount}</strong>
        </div>
        <div className="analytics-stat-card">
          <span>{t.analyticsWeek}</span>
          <strong>{analytics.weekCount}</strong>
        </div>
        <div className="analytics-stat-card analytics-stat-card--wide">
          <span>{t.analyticsLastRequest}</span>
          <strong className="analytics-stat-date">
            {analytics.lastItem ? formatDate(analytics.lastItem.submittedAt || analytics.lastItem.createdAt) : "—"}
          </strong>
        </div>
      </div>

      <div className="analytics-bottom-row">
        <div className="analytics-section">
          <div className="analytics-section-title">{t.analyticsStatusDist}</div>
          <div className="analytics-status-bars">
            {STATUS_ORDER.map((status) => {
              const count = analytics.statusCounts[status] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status} className="analytics-status-row">
                  <span className={`official-badge status-${status} analytics-status-label`}>{statusLabel(status, t)}</span>
                  <div className="analytics-bar-track">
                    <div className={`analytics-bar analytics-bar--${status}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="analytics-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        {analytics.popularQuestions.length > 0 && (
          <div className="analytics-section">
            <div className="analytics-section-title">{t.analyticsPopularAnswers}</div>
            <div className="analytics-popular-grid">
              {analytics.popularQuestions.map((q, qi) => (
                <div key={qi} className="analytics-popular-card">
                  <div className="analytics-popular-question">{q.question}</div>
                  {q.top3.map(([answer, count], ai) => (
                    <div key={ai} className="analytics-popular-answer-row">
                      <span className="analytics-popular-answer-text">{answer}</span>
                      <span className="analytics-popular-count">{count}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Actions Block ──────────────────────────────────────────────────────

function QuickActionsBlock({ scenario, currentStatus, onAction, t }) {
  const actions = SCENARIO_QUICK_ACTIONS[scenario] || SCENARIO_QUICK_ACTIONS.universal;
  if (!actions.length) return null;
  return (
    <div className="quick-action-section">
      <div className="quick-action-label">{t.quickActions}</div>
      <div className="quick-action-row">
        {actions.map((action) => (
          <button
            key={action}
            className={`quick-action-btn${currentStatus === action ? " quick-action-btn--active" : ""}`}
            onClick={() => onAction(action)}
            disabled={currentStatus === action}
          >
            {actionLabel(action, t)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Survey Insights Panel ────────────────────────────────────────────────────

function SurveyInsightsPanel({ items, t }) {
  const insights = useMemo(() => {
    const now = new Date();
    const today = items.filter((item) => {
      const d = new Date(item.submittedAt || item.createdAt);
      return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
    }).length;
    const last7 = items.filter((item) => {
      const d = new Date(item.submittedAt || item.createdAt);
      return !Number.isNaN(d.getTime()) && d >= new Date(now.getTime() - 7 * 86400000);
    }).length;
    const answerMap = {};
    for (const item of items) {
      for (const ans of (item.answers || [])) {
        const q = String(ans.question || "").trim();
        const a = String(ans.answer || "").trim();
        if (!q || !a) continue;
        if (!answerMap[q]) answerMap[q] = {};
        answerMap[q][a] = (answerMap[q][a] || 0) + 1;
      }
    }
    const popularQuestions = Object.entries(answerMap)
      .map(([q, answers]) => {
        const top3 = Object.entries(answers).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return { question: q, top3 };
      })
      .filter((q) => q.top3.length >= 2 && q.top3[0][1] > 1)
      .slice(0, 4);
    return { today, last7, popularQuestions };
  }, [items]);

  return (
    <div className="survey-insights-card">
      <div className="survey-insights-header">{t.surveyInsights}</div>
      <div className="survey-insights-stats">
        <div className="survey-insight-stat"><span>{t.totalRequests}</span><b>{items.length}</b></div>
        <div className="survey-insight-stat"><span>{t.analyticsToday}</span><b>{insights.today}</b></div>
        <div className="survey-insight-stat"><span>{t.analyticsWeek}</span><b>{insights.last7}</b></div>
      </div>
      {insights.popularQuestions.length > 0 && (
        <div className="survey-insights-popular">
          <div className="survey-insights-popular-title">{t.analyticsPopularAnswers}</div>
          {insights.popularQuestions.map((q, qi) => (
            <div key={qi} className="survey-insights-q">
              <div className="survey-insights-q-label">{q.question}</div>
              {q.top3.map(([answer, count], ai) => (
                <div key={ai} className="survey-insights-q-row">
                  <span className="survey-insights-q-answer">{answer}</span>
                  <span className="survey-insights-q-count">{count}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RequestsPage() {
  const { t, lang } = useLocale();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const formId = params.formId || "";
  const formTitle = searchParams.get("formTitle") || "";

  const [workspace, setWorkspace] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [scenarioMeta, setScenarioMeta] = useState(null);
  const [scenarioConfiguredAt, setScenarioConfiguredAt] = useState(null);

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!exportOpen) return;
    function onOutsideClick(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [exportOpen]);

  async function loadWorkspace() {
    if (!formId) return;
    try {
      const { data } = await api.get(`/api/forms/${encodeURIComponent(formId)}/workspace`);
      setWorkspace(data);
      setScenario(data.scenario || "universal");
      setScenarioMeta(data.scenarioMeta || null);
      setScenarioConfiguredAt(data.scenarioConfiguredAt || null);
    } catch {
      // workspace load failure is non-fatal — page still shows requests
    }
  }

  async function loadRequests() {
    const p = { ...(statusFilter ? { status: statusFilter } : {}), ...(formId ? { formId } : {}) };
    const { data } = await api.get("/api/forms/requests", { params: p });
    setItems(data.items || []);
  }

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadWorkspace(), loadRequests()]);
      } catch (err) {
        setError(err.response?.data?.error || t.failedRequests);
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [formId]);

  useEffect(() => {
    if (loading) return;
    loadRequests().catch(() => {});
  }, [statusFilter]);

  async function openDetails(id) {
    setDetailsLoading(true);
    try {
      const { data } = await api.get(`/api/forms/requests/${id}`);
      setSelected(data);
    } catch (err) {
      setError(err.response?.data?.error || t.failedDetails);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function changeStatus(id, newStatus) {
    try {
      const { data } = await api.patch(`/api/forms/requests/${id}/status`, { status: newStatus });
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus } : item));
      if (selected?.item?.id === id) {
        setSelected((prev) => ({ ...prev, item: { ...prev.item, status: newStatus } }));
      }
      return data;
    } catch {
      // ignore
    }
  }

  function handleScenarioSelected(newScenario) {
    setScenario(newScenario);
    setScenarioConfiguredAt(new Date().toISOString());
    // Reload workspace to get updated scenarioMeta
    loadWorkspace().catch(() => {});
  }

  const filteredItems = useMemo(() => {
    let result = items;
    const needle = query.trim().toLowerCase();
    if (needle) result = result.filter((item) => requestSearchText(item, t).includes(needle));
    if (dateFilter !== "all") result = result.filter((item) => isWithinDateRange(item.submittedAt || item.createdAt, dateFilter, dateFrom, dateTo));
    return result;
  }, [items, query, t, dateFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const now = new Date();
    const attentionSet = new Set(ATTENTION_STATUSES[scenario] || ["new"]);
    return {
      total: items.length,
      fresh: items.filter((item) => item.status === "new").length,
      inProgress: items.filter((item) => item.status === "in_progress").length,
      done: items.filter((item) => item.status === "done").length,
      today: items.filter((item) => {
        const d = new Date(item.submittedAt || item.createdAt);
        return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
      }).length,
      week: items.filter((item) => {
        const d = new Date(item.submittedAt || item.createdAt);
        return !Number.isNaN(d.getTime()) && d >= new Date(now - 7 * 86400000);
      }).length,
      attention: items.filter((item) => attentionSet.size > 0 && attentionSet.has(item.status)).length
    };
  }, [items, scenario]);

  // Determine statuses to show in filter dropdown
  const scenarioStatuses = useMemo(() => {
    const base = ["new", "in_progress", "done"];
    const flow = scenarioMeta?.statusFlow || [];
    const combined = Array.from(new Set([...base, ...flow]));
    return ["", ...combined];
  }, [scenarioMeta]);

  // Labels for scenario
  const scenarioTitle = scenarioMeta?.title?.[lang] || scenarioMeta?.title?.ru || "";
  const scenarioGoal = scenarioMeta?.primaryGoal?.[lang] || scenarioMeta?.primaryGoal?.ru || "";
  const workspaceLabel = scenarioMeta?.workspaceTitle?.[lang] || scenarioMeta?.workspaceTitle?.ru || t.inbox;

  const displayTitle = formTitle || workspace?.form?.title || t.requestsTitle;

  if (loading) return <section className="card"><p className="muted">{t.loadingRequests}</p></section>;
  if (error) return <section className="card"><p className="error">{error}</p></section>;

  const selectedAnswers = answersForView(selected?.item?.answers || [], t);
  const showScenarioBanner = !scenarioConfiguredAt;

  return (
    <section className="official-requests-page">

      {/* ── Workspace Header ── */}
      <div className="ws-header-card">
        <div className="ws-header-main">
          <div className="ws-title-block">
            <div className="ws-title-row">
              <h1>{displayTitle}</h1>
              {scenarioTitle && (
                <span className="scenario-badge-pill">{scenarioTitle}</span>
              )}
            </div>
            {scenarioGoal && (
              <p className="ws-goal-text">
                <span className="ws-goal-label">{t.workspaceGoal}:</span> {scenarioGoal}
              </p>
            )}
          </div>
          <div className="ws-header-actions">
            <Link className="official-link-btn" to="/forms">{t.myForms}</Link>
            <button className="official-link-btn feedback-trigger-btn" onClick={() => setFeedbackOpen(true)}>
              {t.feedbackBtn}
            </button>
          </div>
        </div>
        <div className="ws-stats-row">
          <div className="ws-stat">
            <span>{scenario === "survey" ? t.surveyResponsesLabel : t.totalRequests}</span>
            <b>{stats.total}</b>
          </div>
          <div className="ws-stat">
            <span>{t.analyticsToday}</span>
            <b>{stats.today}</b>
          </div>
          <div className="ws-stat">
            <span>{t.analyticsWeek}</span>
            <b>{stats.week}</b>
          </div>
          {scenario === "survey" ? (
            <div className="ws-stat">
              <span>{t.newRequests}</span>
              <b>{stats.fresh}</b>
            </div>
          ) : (
            <div className={`ws-stat${stats.attention > 0 ? " ws-stat--attention" : ""}`}>
              <span>{t.needsAttention}</span>
              <b>{stats.attention}</b>
            </div>
          )}
        </div>
      </div>

      {/* ── Scenario Selection Banner ── */}
      {showScenarioBanner && (
        <ScenarioSelectBanner
          formId={formId}
          lang={lang}
          t={t}
          onSelected={handleScenarioSelected}
        />
      )}

      {/* ── Survey Insights ── */}
      {scenario === "survey" && items.length > 0 && (
        <SurveyInsightsPanel items={items} t={t} />
      )}

      {/* ── Toolbar ── */}
      <div className="official-toolbar">
        <label>
          {t.search}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} />
        </label>
        <label>
          {t.status}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {scenarioStatuses.map((s) => (
              <option key={s || "all"} value={s}>{s ? statusLabel(s, t) : t.all}</option>
            ))}
          </select>
        </label>
        <div className="toolbar-date-group">
          <label>
            {t.dateRange}
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              {DATE_FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f === "all" ? t.all
                    : f === "today" ? t.dateFilterToday
                    : f === "yesterday" ? t.dateFilterYesterday
                    : f === "last7" ? t.dateFilterLast7
                    : f === "last30" ? t.dateFilterLast30
                    : t.dateFilterCustom}
                </option>
              ))}
            </select>
          </label>
          {dateFilter === "custom" && (
            <div className="toolbar-date-custom">
              <label className="toolbar-date-input-label">
                <span>{t.dateFrom}</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </label>
              <span className="toolbar-date-sep">—</span>
              <label className="toolbar-date-input-label">
                <span>{t.dateTo}</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Workspace (Table + Details) ── */}
      <div className="official-workspace">
        <div className="official-table-card">
          <div className="official-card-title">
            <h2>{workspaceLabel}</h2>
            <div className="export-area">
              <span>{filteredItems.length} {scenario === "survey" ? t.surveyResponsesLabel : t.requestsCount}</span>
              <div className="export-menu-wrap" ref={exportRef}>
                <button
                  className="export-btn"
                  onClick={() => setExportOpen((o) => !o)}
                  disabled={filteredItems.length === 0}
                >
                  {t.exportBtn}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {exportOpen && (
                  <div className="export-dropdown">
                    <button onClick={() => { doExportCSV(filteredItems, t); setExportOpen(false); }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      CSV
                    </button>
                    <button onClick={() => { doExportJSON(filteredItems, t); setExportOpen(false); }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4.5C3 3.12 4.12 2 5.5 2h3C9.88 2 11 3.12 11 4.5v5c0 1.38-1.12 2.5-2.5 2.5h-3C4.12 12 3 10.88 3 9.5v-5z" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5.5h4M5 8h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="official-table-wrap">
            <table className="official-table">
              <thead>
                <tr>
                  <th>{t.submitted}</th>
                  <th>{t.email}</th>
                  <th>{t.previewColumn}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-empty-cell">
                      {items.length === 0 ? t.noRequestsForForm : t.noRequestsFound}
                    </td>
                  </tr>
                ) : filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={selected?.item?.id === item.id ? "selected clickable-row" : "clickable-row"}
                    onClick={() => openDetails(item.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") openDetails(item.id); }}
                  >
                    <td>{formatDate(item.submittedAt || item.createdAt)}</td>
                    <td>{item.respondentEmail || t.noEmail}</td>
                    <td className="preview-cell">{preview(item, t)}</td>
                    <td>
                      <span className={`official-badge status-${item.status}`}>{statusLabel(item.status, t)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="official-details-card">
          {!selected && !detailsLoading ? (
            <div className="official-empty-state">
              <h3>{t.selectRequest}</h3>
              <p>{t.requestDetailsHint}</p>
            </div>
          ) : null}
          {detailsLoading ? <p className="muted">{t.loading}</p> : null}
          {selected ? (
            <>
              <div className="official-detail-head">
                <div>
                  <h3>{selected.item.formTitle || displayTitle}</h3>
                </div>
                <span className={`official-badge status-${selected.item.status}`}>{statusLabel(selected.item.status, t)}</span>
              </div>

              <div className="official-detail-meta">
                <div><span>{t.submitted}</span><b>{formatDate(selected.item.submittedAt || selected.item.createdAt)}</b></div>
                <div><span>{t.email}</span><b>{selected.item.respondentEmail || "-"}</b></div>
              </div>

              <div className="detail-status-row">
                <select
                  className="official-status-select"
                  value={selected.item.status}
                  onChange={(e) => changeStatus(selected.item.id, e.target.value)}
                >
                  {scenarioStatuses.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{statusLabel(s, t)}</option>
                  ))}
                </select>
              </div>

              {scenario !== "survey" && (
                <QuickActionsBlock
                  scenario={scenario || "universal"}
                  currentStatus={selected.item.status}
                  onAction={(newStatus) => changeStatus(selected.item.id, newStatus)}
                  t={t}
                />
              )}

              <div className="official-answers">
                {selectedAnswers.map((answer, index) => (
                  <div key={`${answer.label}-${index}`} className="official-answer-row">
                    <span>{answer.label}</span>
                    <b>{answer.value}</b>
                  </div>
                ))}
              </div>

              {scenario === "admissions" && (
                <div className="admissions-ai-hint">{t.admissionsAiHint}</div>
              )}

              <details className="detail-tech-info">
                <summary>{t.technicalInfo}</summary>
                <p>{t.responseIdLabel}: <code>{selected.item.responseId}</code></p>
              </details>
            </>
          ) : null}
        </aside>
      </div>

      {/* ── Analytics (collapsible) ── */}
      {items.length > 0 && (
        <details className="ws-analytics-section">
          <summary className="ws-analytics-summary">{t.analyticsStatusDist}</summary>
          <AnalyticsBlock items={items} t={t} />
        </details>
      )}

      {/* ── Bottom Row: AI + WhatsApp ── */}
      <div className="ws-bottom-row">
        {formId && (
          <AIChatBlock
            formId={formId}
            formTitle={displayTitle}
            scenario={scenario}
            scenarioMeta={scenarioMeta}
            lang={lang}
            t={t}
          />
        )}
        <NotificationSettingsBlock formId={formId} formTitle={displayTitle} t={t} />
      </div>

      {/* ── Feedback Modal ── */}
      {feedbackOpen && (
        <FeedbackModal formId={formId} t={t} onClose={() => setFeedbackOpen(false)} />
      )}
    </section>
  );
}
