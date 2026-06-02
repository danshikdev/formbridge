import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";
import { IconGrid, IconAcademic, IconUser, IconChart, IconMessage, IconCalendar, IconChevronDown, IconFeedback } from "../shared/icons";

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

const WORKSPACE_TABS = ["requests", "analytics", "ai", "whatsapp", "reports", "feedback"];

function SkeletonLine({ className = "" }) {
  return <span className={`skeleton-line ${className}`} aria-hidden="true" />;
}

function RequestsPageSkeleton() {
  return (
    <section className="official-requests-page" aria-busy="true">
      <div className="ws-header-card requests-skeleton-header">
        <div className="ws-header-main">
          <div className="ws-title-block">
            <SkeletonLine className="skeleton-title" />
            <SkeletonLine className="skeleton-text skeleton-wide" />
          </div>
          <div className="ws-header-actions">
            <SkeletonLine className="skeleton-button" />
            <SkeletonLine className="skeleton-button" />
          </div>
        </div>
        <div className="ws-stats-row">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="ws-stat">
              <SkeletonLine className="skeleton-text" />
              <SkeletonLine className="skeleton-number" />
            </div>
          ))}
        </div>
      </div>

      <div className="workspace-tabs">
        {[0, 1, 2, 3, 4, 5].map((item) => <SkeletonLine key={item} className="skeleton-tab" />)}
      </div>

      <div className="official-toolbar">
        <SkeletonLine className="skeleton-input" />
        <SkeletonLine className="skeleton-select" />
        <SkeletonLine className="skeleton-select" />
      </div>

      <div className="official-workspace">
        <div className="official-table-card">
          <div className="official-card-title">
            <SkeletonLine className="skeleton-heading" />
            <SkeletonLine className="skeleton-chip" />
          </div>
          <div className="requests-skeleton-table">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="requests-skeleton-row">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine className="skeleton-wide" />
                <SkeletonLine className="skeleton-chip" />
              </div>
            ))}
          </div>
        </div>
        <aside className="official-details-card">
          <SkeletonLine className="skeleton-heading" />
          <SkeletonLine className="skeleton-text skeleton-wide" />
          <SkeletonLine className="skeleton-text" />
          <div className="requests-skeleton-detail-lines">
            {[0, 1, 2, 3].map((item) => <SkeletonLine key={item} className="skeleton-wide" />)}
          </div>
        </aside>
      </div>
    </section>
  );
}

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
  const storageKey = `fb_ai_${formId}`;
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = (scenarioMeta?.suggestedQuestions || {})[lang] || [];

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    
    const history = messages
      .filter((m) => m.role === "user" || m.role === "ai")
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text
      }));

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const { data } = await api.post("/api/ai/form-chat", {
        formId,
        formTitle,
        scenario: scenario || "universal",
        message: msg,
        history,
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

function FeedbackPanel({ formId, t }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sentItems, setSentItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/forms/${encodeURIComponent(formId)}/feedback`)
      .then(({ data }) => setSentItems(data || []))
      .catch(() => {});
  }, [formId]);

  async function submit() {
    if (!message.trim()) return;
    const nextMessage = message.trim();
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/forms/${encodeURIComponent(formId)}/feedback`, { message: nextMessage });
      setSentItems((prev) => [{ message: nextMessage, createdAt: new Date().toISOString() }, ...prev]);
      setMessage("");
    } catch {
      setError(t.feedbackError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="feedback-panel">
      <div className="feedback-panel-copy">
        <span className="section-kicker">{t.feedbackBtn}</span>
        <h2>{t.feedbackPanelTitle}</h2>
        <p>{t.feedbackPanelSubtitle}</p>
      </div>
      <div className="feedback-panel-card">
        <textarea
          className="feedback-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.feedbackPlaceholder}
          rows={5}
          disabled={saving}
        />
        {error ? <p className="error feedback-panel-error">{error}</p> : null}
        <button className="primary-btn compact-action-btn" type="button" onClick={submit} disabled={saving || !message.trim()}>
          {saving ? "..." : t.feedbackSubmit}
        </button>
      </div>
      <div className="feedback-panel-list">
        <h3>{t.feedbackMySuggestions}</h3>
        {sentItems.length === 0 ? (
          <p className="muted">{t.feedbackNoSuggestions}</p>
        ) : (
          sentItems.map((item) => (
            <article key={`${item.createdAt}-${item.message}`}>
              <p>{item.message}</p>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Report & Export Helpers ──────────────────────────────────────────────────

function generateWordReport(formTitle, scenario, items, t, lang) {
  const now = new Date();
  const todayCount = items.filter((item) => {
    const d = new Date(item.submittedAt || item.createdAt);
    return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
  }).length;
  
  const statusCounts = {};
  for (const item of items) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  }
  
  const questionLabels = collectAllQuestions(items, t);

  const rowsHtml = items.map((item) => {
    const answerMap = {};
    for (const { label, value } of answersForView(item.answers || [], t)) {
      answerMap[label] = value;
    }
    
    const answersHtml = questionLabels.map((q) => {
      return `<td>${answerMap[q] || "-"}</td>`;
    }).join("");

    return `
      <tr>
        <td>${formatDate(item.submittedAt || item.createdAt)}</td>
        <td>${item.respondentEmail || "-"}</td>
        <td><b>${statusLabel(item.status, t)}</b></td>
        ${answersHtml}
      </tr>
    `;
  }).join("");

  const headersHtml = [t.submitted, t.email, t.status, ...questionLabels]
    .map(h => `<th>${h}</th>`).join("");

  const statusListHtml = Object.entries(statusCounts)
    .map(([status, count]) => `<li><b>${statusLabel(status, t)}:</b> ${count}</li>`)
    .join("");

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${formTitle || "FormBridge Report"}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 11in 8.5in;
          margin: 0.5in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
        }
        body {
          font-family: 'Arial', sans-serif;
          color: #1a2f26;
        }
        h1 {
          color: #123b2f;
          font-size: 22pt;
          border-bottom: 2px solid #123b2f;
          padding-bottom: 6px;
          margin-bottom: 12pt;
        }
        h2 {
          color: #66746f;
          font-size: 13pt;
          text-transform: uppercase;
          border-bottom: 1px solid #edf1ee;
          padding-bottom: 4px;
          margin-top: 20pt;
          margin-bottom: 8pt;
        }
        p {
          font-size: 10pt;
          line-height: 1.4;
          margin-bottom: 6pt;
        }
        ul {
          margin-top: 0;
          margin-bottom: 8pt;
          padding-left: 20pt;
          font-size: 10pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12pt;
          margin-bottom: 12pt;
          table-layout: auto;
        }
        th, td {
          border: 1px solid #d9e2dc;
          padding: 6pt 8pt;
          text-align: left;
          font-size: 8.5pt;
          vertical-align: top;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        th {
          background-color: #f8faf8;
          color: #475851;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h1>${formTitle || "FormBridge Report"}</h1>
        <p><b>${t.reportGeneratedAt}:</b> ${new Date().toLocaleString()}</p>
        <p><b>${t.totalRequests}:</b> ${items.length} | <b>${t.analyticsToday}:</b> ${todayCount}</p>
        
        <h2>${t.analyticsStatusDist}</h2>
        <ul>
          ${statusListHtml || "<li>-</li>"}
        </ul>

        <h2>${scenario === "survey" ? t.surveyResponsesLabel : t.requestsTitle}</h2>
        <table>
          <thead>
            <tr>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

function ReportPreviewModal({ isOpen, onClose, reportType, items, formTitle, scenario, t, lang }) {
  const now = new Date();
  const todayCount = useMemo(() => {
    return items.filter((item) => {
      const d = new Date(item.submittedAt || item.createdAt);
      return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
    }).length;
  }, [items]);

  const statusCounts = useMemo(() => {
    const counts = {};
    for (const item of items) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
    return counts;
  }, [items]);

  const questionLabels = useMemo(() => collectAllQuestions(items, t), [items, t]);

  const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  if (!isOpen) return null;

  function handleDownload() {
    if (reportType === "pdf") {
      window.print();
    } else {
      const docHtml = generateWordReport(formTitle, scenario, items, t, lang);
      const blob = new Blob(["\uFEFF" + docHtml], { type: "application/msword;charset=utf-8;" });
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `formbridge-report-${date}.doc`);
      onClose();
    }
  }

  return (
    <div className="report-preview-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="report-preview-modal">
        <div className="report-preview-modal-header">
          <h3>{t.reportPreviewTitle} ({reportType === "pdf" ? "PDF" : "Word"})</h3>
          <button className="official-link-btn" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={onClose}>✕</button>
        </div>
        <div className="report-preview-modal-body">
          <div className="report-sheet">
            <div className="report-sheet-header">
              <div className="report-sheet-header-left">
                <h1>{formTitle || "FormBridge Workspace"}</h1>
                <span>{(SCENARIO_LABELS_STATIC[scenario] || {})[lang] || scenario}</span>
              </div>
              <div className="report-sheet-header-right">
                <strong>FormBridge Report</strong>
                <div>{t.reportGeneratedAt}: {now.toLocaleDateString()}</div>
              </div>
            </div>

            <div className="report-section">
              <div className="report-section-title">{t.totalRequests} &amp; {t.analyticsStatusDist}</div>
              <div className="report-stats-grid">
                <div className="report-stat-card">
                  <span>{t.totalRequests}</span>
                  <strong>{items.length}</strong>
                </div>
                <div className="report-stat-card">
                  <span>{t.analyticsToday}</span>
                  <strong>{todayCount}</strong>
                </div>
                {sortedStatuses.slice(0, 2).map(([status, count]) => (
                  <div key={status} className="report-stat-card">
                    <span>{statusLabel(status, t)}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section">
              <div className="report-section-title">{scenario === "survey" ? t.surveyResponsesLabel : t.requestsTitle}</div>
              <div style={{ overflowX: "auto" }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>{t.submitted}</th>
                      <th>{t.email}</th>
                      <th>{t.status}</th>
                      <th>{t.previewColumn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 25).map((item) => (
                      <tr key={item.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(item.submittedAt || item.createdAt).split(",")[0]}</td>
                        <td>{item.respondentEmail || "-"}</td>
                        <td><b>{statusLabel(item.status, t)}</b></td>
                        <td>
                          <div className="report-table-answers">
                            {answersForView(item.answers || [], t).slice(0, 3).map((ans, idx) => (
                              <div key={idx}>
                                <span>{ans.label}:</span> {ans.value}
                              </div>
                            ))}
                            {item.answers?.length > 3 && <div style={{ fontSize: "0.75rem", color: "#66746f" }}>+{item.answers.length - 3} {t.question.toLowerCase()}</div>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length > 25 && (
                  <div style={{ textAlign: "center", padding: "12px", fontSize: "0.8rem", color: "#66746f", borderTop: "1px solid #edf1ee" }}>
                    Showing top 25 of {items.length} responses. Export covers full dataset.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="report-preview-modal-actions">
          <button className="official-link-btn" onClick={onClose}>{t.all === "Все" ? "Отмена" : t.all === "Барлығы" ? "Болдырмау" : "Cancel"}</button>
          <button className="primary-btn compact-action-btn" onClick={handleDownload}>
            {t.downloadReport} {reportType === "pdf" ? "PDF" : "Word"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Settings Block ──────────────────────────────────────────────

const NOTIF_MODES = ["every_submission", "threshold", "daily_summary"];

function normalizeWhatsAppPhoneInput(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;

  return null;
}

function NotificationSettingsBlock({ formId, formTitle, t }) {
  const [enabled, setEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mode, setMode] = useState("every_submission");
  const [thresholdCount, setThresholdCount] = useState(5);
  const [dailyTime, setDailyTime] = useState("18:00");
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
        setDailyTime(data.dailyTime || "18:00");
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
        thresholdCount: mode === "threshold" ? Number(thresholdCount) : null,
        dailyTime: mode === "daily_summary" ? dailyTime : null
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

  const previewTemplate = mode === "daily_summary" ? t.notifDailyPreviewMsg : t.notifPreviewMsg;
  const previewMsg = (previewTemplate || "").replace("{form}", formTitle || formId || "...");

  if (!formId) return null;

  return (
    <div className="notif-block notif-block--open">
      <div className="notif-header notif-header--static">
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
              <span className={`whatsapp-status-pill whatsapp-status-pill--${enabled ? "on" : "off"}`}>
                {enabled ? t.whatsappStatusOn : t.whatsappStatusOff}
              </span>
            ) : t.notifSubtitle}
          </div>
        </div>
        <span className="notif-mock-badge">WhatsApp</span>
      </div>

      {loading ? (
        <p className="muted" style={{ padding: "8px 0" }}>{t.loading}</p>
      ) : loadError ? (
        <p className="error" style={{ padding: "8px 0" }}>{loadError}</p>
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
              {mode === "daily_summary" && (
                <label className="notif-field">
                  <span>{t.notifDailyTime}</span>
                  <input type="time" value={dailyTime} onChange={(e) => setDailyTime(e.target.value)} />
                  <small className="notif-field-hint">{t.notifDailyHint}</small>
                </label>
              )}
              <div className="notif-preview">
                <div className="notif-preview-label">{t.notifPreview}</div>
                <div className="notif-preview-bubble">{previewMsg}</div>
              </div>
            </div>
          )}

          <div className="notif-actions">
            <button className="primary-btn compact-action-btn" onClick={save} disabled={saving}>
              {saving ? t.loading : t.notifSave}
            </button>
            {saved && <span className="notif-saved-msg">{t.notifSaved}</span>}
            {saveError && <span className="error">{saveError}</span>}
          </div>
          <p className="whatsapp-demo-helper">{t.whatsappDemoHelper}</p>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Block ──────────────────────────────────────────────────────────

const STATUS_COLORS = {
  new: "#d7b56d",
  in_progress: "#123b2f",
  done: "#4ade80",
  test: "#818cf8",
  contacted: "#60a5fa",
  documents_needed: "#f97316",
  accepted: "#22c55e",
  rejected: "#ef4444",
  shortlisted: "#a78bfa",
  interview: "#8b5cf6",
  hired: "#10b981",
  urgent: "#f43f5e",
  waiting_client: "#f59e0b",
  confirmed: "#34d399",
  waiting_payment: "#fb923c",
  cancelled: "#9ca3af",
  attended: "#2dd4bf"
};

function DonutChart({ statusCounts, total, t }) {
  const R = 38;
  const circumference = 2 * Math.PI * R;
  const entries = Object.entries(statusCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (total === 0 || entries.length === 0) return null;

  let accum = 0;
  const segments = entries.map(([status, count]) => {
    const len = (count / total) * circumference;
    const seg = { status, count, len, offset: accum };
    accum += len;
    return seg;
  });

  return (
    <div className="analytics-donut-wrap">
      <div className="analytics-donut-chart-area">
        <svg viewBox="0 0 100 100" className="analytics-donut-svg">
          <g style={{ transform: "rotate(-90deg)", transformOrigin: "50px 50px" }}>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#edf1ee" strokeWidth="10" />
            {segments.map((seg) => (
              <circle
                key={seg.status}
                cx="50" cy="50" r={R}
                fill="none"
                stroke={STATUS_COLORS[seg.status] || "#ccc"}
                strokeWidth="10"
                strokeDasharray={`${seg.len} ${circumference}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </g>
          <text x="50" y="44" textAnchor="middle" fontSize="16" fontWeight="800" fill="#10231d">{total}</text>
          <text x="50" y="57" textAnchor="middle" fontSize="7" fontWeight="700" fill="#66746f" textTransform="uppercase" letterSpacing="0.5">{t.totalRequests}</text>
        </svg>
      </div>
      <div className="analytics-donut-legend">
        {segments.map((seg) => (
          <div key={seg.status} className="analytics-donut-legend-item">
            <span className="analytics-donut-dot" style={{ background: STATUS_COLORS[seg.status] || "#ccc" }} />
            <span className="analytics-donut-label">{statusLabel(seg.status, t)}</span>
            <span className="analytics-donut-count">{seg.count}</span>
            <span className="analytics-donut-pct">{Math.round((seg.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineChart({ items }) {
  const days = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
      const dateStr = d.toDateString();
      const count = items.filter((item) => {
        const dd = new Date(item.submittedAt || item.createdAt);
        return !Number.isNaN(dd.getTime()) && dd.toDateString() === dateStr;
      }).length;
      result.push({ label, count, isToday: i === 0 });
    }
    return result;
  }, [items]);

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="analytics-timeline">
      {days.map((day, i) => (
        <div key={i} className={`analytics-tl-col${day.isToday ? " analytics-tl-col--today" : ""}`}>
          <div className="analytics-tl-bar-wrap">
            <div
              className={`analytics-tl-bar${day.isToday ? " analytics-tl-bar--today" : ""}`}
              style={{ height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 0)}%` }}
            />
            {day.count > 0 && <span className="analytics-tl-count">{day.count}</span>}
          </div>
          <span className="analytics-tl-label">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

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
    const statusCounts = {};
    for (const item of items) {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
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

      <div className="analytics-charts-row">
        <div className="analytics-section analytics-section--donut">
          <div className="analytics-section-title">{t.analyticsStatusDist}</div>
          <DonutChart statusCounts={analytics.statusCounts} total={total} t={t} />
        </div>
        <div className="analytics-section analytics-section--timeline">
          <div className="analytics-section-title">{t.analyticsLast14Days || "Last 14 days"}</div>
          <TimelineChart items={items} />
        </div>
      </div>

      {analytics.popularQuestions.length > 0 && (
        <div className="analytics-section">
          <div className="analytics-section-title">{t.analyticsPopularAnswers}</div>
          <div className="analytics-popular-grid">
            {analytics.popularQuestions.map((q, qi) => (
              <div key={qi} className="analytics-popular-card">
                <div className="analytics-popular-question">{q.question}</div>
                {q.top3.map(([answer, count], ai) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={ai} className="analytics-popular-answer-row">
                      <div className="analytics-popular-bar-wrap">
                        <div className="analytics-popular-bar" style={{ width: `${pct}%` }} />
                        <span className="analytics-popular-answer-text">{answer}</span>
                      </div>
                      <span className="analytics-popular-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("pdf"); // "pdf" | "word"
  const [menuOpen, setMenuOpen] = useState(false);
  const initialTab = WORKSPACE_TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "requests";
  const [activeTab, setActiveTab] = useState(initialTab);
  const exportRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const nextTab = searchParams.get("tab");
    if (WORKSPACE_TABS.includes(nextTab)) setActiveTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [menuOpen]);

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
  const tabLabels = {
    requests: scenario === "survey" ? t.surveyResponsesLabel : t.requestsTab,
    analytics: t.analyticsTab,
    ai: t.aiTab,
    whatsapp: t.whatsappTab,
    reports: t.reportsTab,
    feedback: t.feedbackTab
  };

  if (loading) return <RequestsPageSkeleton />;
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

            <div className="ws-actions-dropdown-container" ref={menuRef}>
              <button
                className={`official-link-btn ws-actions-trigger-btn${menuOpen ? " active" : ""}`}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span>{t.actionsDropdown}</span>
                <IconChevronDown size={14} className={`ws-actions-chevron${menuOpen ? " open" : ""}`} />
              </button>

              {menuOpen && (
                <div className="ws-actions-dropdown-menu">
                  {workspace?.form?.formUrl && (
                    <a
                      href={workspace.form.formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ws-dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ws-dropdown-item-icon">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{t.openGoogleForm}</span>
                    </a>
                  )}
                  {workspace?.form?.sheetUrl && (
                    <a
                      href={workspace.form.sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ws-dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ws-dropdown-item-icon">
                        <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M8 7h8M8 12h8M8 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <span>{t.openGoogleSheet}</span>
                    </a>
                  )}
                  <button
                    className="ws-dropdown-item ws-dropdown-item--feedback"
                    onClick={() => {
                      setFeedbackOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <IconFeedback size={16} className="ws-dropdown-item-icon" />
                    <span>{t.feedbackBtn}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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

      <div className="workspace-tabs" role="tablist" aria-label={t.workspaceTabsLabel}>
        {WORKSPACE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`workspace-tab${activeTab === tab ? " workspace-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "requests" && (
        <>
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

          <div className="official-workspace">
            <div className="official-table-card">
              <div className="official-card-title">
                <h2>{workspaceLabel}</h2>
                <span>{filteredItems.length} {scenario === "survey" ? t.surveyResponsesLabel : t.requestsCount}</span>
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
        </>
      )}

      {activeTab === "analytics" && (
        <div className="workspace-tab-panel">
          {items.length > 0 ? <AnalyticsBlock items={items} t={t} /> : <p className="muted">{t.noRequestsForForm}</p>}
        </div>
      )}

      {activeTab === "ai" && (
        <div className="workspace-tab-panel">
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
        </div>
      )}

      {activeTab === "whatsapp" && (
        <div className="workspace-tab-panel">
          <NotificationSettingsBlock formId={formId} formTitle={displayTitle} t={t} />
        </div>
      )}

      {activeTab === "reports" && (
        <div className="workspace-tab-panel">
          <div className="reports-panel">
            <div className="reports-panel-header">
              <div>
                <h2>{t.reportsTitle}</h2>
                <p>{t.reportsSubtitle}</p>
              </div>
            </div>

            <div className="reports-summary-row">
              {[
                { label: t.totalRequests, value: items.length },
                { label: t.analyticsToday, value: items.filter((item) => { const d = new Date(item.submittedAt || item.createdAt); return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString(); }).length },
                { label: t.newRequests, value: items.filter((i) => i.status === "new").length },
                { label: t.filterApplied || "Filtered", value: filteredItems.length }
              ].map(({ label, value }) => (
                <div key={label} className="reports-summary-card">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="reports-export-section" ref={exportRef}>
              <div className="reports-export-title">{t.exportBtn || "Export"}</div>
              <div className="reports-export-grid">
                <button className="reports-export-card" onClick={() => doExportCSV(filteredItems, t)} disabled={filteredItems.length === 0}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="2" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 8h8M7 12h8M7 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  <span className="reports-export-card-label">CSV</span>
                  <span className="reports-export-card-desc">{t.exportCsvDesc || "Spreadsheet-compatible"}</span>
                </button>
                <button className="reports-export-card" onClick={() => doExportJSON(filteredItems, t)} disabled={filteredItems.length === 0}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 7c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4H9c-2.2 0-4-1.8-4-4V7z" stroke="currentColor" strokeWidth="1.6"/><path d="M8 9h6M8 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  <span className="reports-export-card-label">JSON</span>
                  <span className="reports-export-card-desc">{t.exportJsonDesc || "Raw data"}</span>
                </button>
                <button className="reports-export-card" onClick={() => { setReportType("pdf"); setReportModalOpen(true); }} disabled={filteredItems.length === 0}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="2" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M13 2v6h6M9 13l2.5 2.5L15 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="reports-export-card-label">{t.exportPDF}</span>
                  <span className="reports-export-card-desc">{t.exportPdfDesc || "Printable report"}</span>
                </button>
                <button className="reports-export-card" onClick={() => { setReportType("word"); setReportModalOpen(true); }} disabled={filteredItems.length === 0}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="2" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 9h8M7 13h8M7 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M13 2v5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="reports-export-card-label">{t.exportWord}</span>
                  <span className="reports-export-card-desc">{t.exportWordDesc || "Word document"}</span>
                </button>
              </div>
              {filteredItems.length === 0 && (
                <p className="muted reports-empty-hint">{t.noRequestsFound}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="workspace-tab-panel">
          <FeedbackPanel formId={formId} t={t} />
        </div>
      )}

      {/* ── Feedback Modal ── */}
      {feedbackOpen && (
        <FeedbackModal formId={formId} t={t} onClose={() => setFeedbackOpen(false)} />
      )}

      {/* ── Report Preview Modal ── */}
      {reportModalOpen && (
        <ReportPreviewModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          reportType={reportType}
          items={filteredItems}
          formTitle={displayTitle}
          scenario={scenario}
          t={t}
          lang={lang}
        />
      )}
    </section>
  );
}
