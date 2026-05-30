import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

const STATUSES = ["", "new", "in_progress", "done", "test"];
const DATE_FILTERS = ["all", "today", "week"];

function isWithinDateRange(dateStr, range) {
  if (range === "all") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (range === "today") return d.toDateString() === now.toDateString();
  if (range === "week") return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return true;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function statusLabel(status, t) {
  if (status === "new") return t.new;
  if (status === "in_progress") return t.inProgress;
  if (status === "done") return t.done;
  if (status === "test") return t.test;
  return status;
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
    item.formTitle,
    item.formId,
    item.respondentEmail,
    item.status,
    ...answersForView(item.answers || [], t).flatMap((answer) => [answer.label, answer.value])
  ].join(" ").toLowerCase();
}

// ─── Export helpers ──────────────────────────────────────────────────────────

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
      ...questionLabels.map((q) => answerMap[q] || ""),
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
      answers,
    };
  });
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), buildFileName("json"));
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── AI Analysis Block ────────────────────────────────────────────────────────

const PRIORITY_COLORS = { high: "#c0392b", medium: "#e67e22", low: "#27ae60" };

function AIAnalysisBlock({ selected, lang, t }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const item = selected?.item;

  useEffect(() => {
    setResult(null);
    setError("");
  }, [item?.id]);

  if (!item) return null;

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/api/ai/analyze-request", {
        formTitle: item.formTitle || "",
        request: {
          id: item.id,
          submittedAt: item.submittedAt || item.createdAt || null,
          respondentEmail: item.respondentEmail || null,
          answers: item.answers || [],
        },
        lang: lang || "ru",
      });
      setResult(data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setError(t.aiError);
      } else {
        setError(t.aiErrorGeneral);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-block">
      <div className="ai-block-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M5.5 8.5l1.8 1.8 3.2-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="ai-block-title">{t.aiTitle}</span>
      </div>

      {!result && !loading && !error && (
        <button className="official-link-btn ai-analyze-btn" onClick={analyze}>
          {t.aiAnalyzeBtn}
        </button>
      )}

      {loading && <p className="muted ai-loading">{t.aiAnalyzing}</p>}

      {error && (
        <div className="ai-error">
          <p>{error}</p>
          <button className="official-link-btn ai-analyze-btn" onClick={analyze}>{t.aiRefresh}</button>
        </div>
      )}

      {result && (
        <div className="ai-result">
          <div className="ai-result-row">
            <span className="ai-result-label">{t.aiSummary}</span>
            <span className="ai-result-value">{result.summary}</span>
          </div>
          <div className="ai-result-row">
            <span className="ai-result-label">{t.aiCategory}</span>
            <span className="ai-result-value ai-badge">{result.category}</span>
          </div>
          <div className="ai-result-row">
            <span className="ai-result-label">{t.aiPriority}</span>
            <span
              className="ai-result-value ai-badge"
              style={{ color: PRIORITY_COLORS[result.priority] || "inherit" }}
            >
              {result.priority}
            </span>
          </div>
          <div className="ai-result-row">
            <span className="ai-result-label">{t.aiRecommended}</span>
            <span className="ai-result-value">{result.recommendedAction}</span>
          </div>
          <button className="ai-refresh-btn" onClick={analyze} disabled={loading}>
            {t.aiRefresh}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Notification Settings ────────────────────────────────────────────────────

const NOTIF_MODES = ["every_submission", "threshold", "daily_summary"];

function NotificationSettingsBlock({ formId, formTitle, t }) {
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
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await api.put(`/api/forms/${formId}/notification-settings`, {
        enabled,
        phoneNumber,
        mode,
        thresholdCount: mode === "threshold" ? Number(thresholdCount) : null
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError(t.notifFailedSave);
    } finally {
      setSaving(false);
    }
  }

  const previewMsg = (t.notifPreviewMsg || "").replace("{form}", formTitle || formId || "...");

  if (!formId) return null;

  return (
    <div className="notif-block">
      <div className="notif-header">
        <div className="notif-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9c0 1.44.39 2.79 1.07 3.95L1.5 16.5l3.62-1.14A7.47 7.47 0 0 0 9 16.5c4.14 0 7.5-3.36 7.5-7.5S13.14 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M6 9h6M6 6.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="notif-title">{t.notifTitle}</div>
          <div className="notif-subtitle">{t.notifSubtitle}</div>
        </div>
        <span className="notif-mock-badge">WhatsApp</span>
      </div>

      {loading ? (
        <p className="muted">{t.loading}</p>
      ) : loadError ? (
        <p className="error">{loadError}</p>
      ) : (
        <div className="notif-body">
          <label className="notif-toggle-row">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>{t.notifEnabled}</span>
          </label>

          {enabled && (
            <div className="notif-fields">
              <label className="notif-field">
                <span>{t.notifPhone}</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t.notifPhonePh}
                />
              </label>

              <label className="notif-field">
                <span>{t.notifMode}</span>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {NOTIF_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m === "every_submission" ? t.notifModeEvery
                        : m === "threshold" ? t.notifModeThreshold
                        : t.notifModeDaily}
                    </option>
                  ))}
                </select>
              </label>

              {mode === "threshold" && (
                <label className="notif-field">
                  <span>{t.notifThreshold}</span>
                  <input
                    type="number"
                    min="1"
                    value={thresholdCount}
                    onChange={(e) => setThresholdCount(e.target.value)}
                  />
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
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
        const top3 = Object.entries(answers)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
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
            {analytics.lastItem
              ? formatDate(analytics.lastItem.submittedAt || analytics.lastItem.createdAt)
              : "—"}
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
                  <span className={`official-badge status-${status} analytics-status-label`}>
                    {statusLabel(status, t)}
                  </span>
                  <div className="analytics-bar-track">
                    <div
                      className={`analytics-bar analytics-bar--${status}`}
                      style={{ width: `${pct}%` }}
                    />
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

export function RequestsPage() {
  const { t, lang } = useLocale();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const formId = params.formId || "";
  const formTitle = searchParams.get("formTitle") || "";
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!exportOpen) return;
    function onOutsideClick(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [exportOpen]);

  async function load() {
    const params = { ...(status ? { status } : {}), ...(formId ? { formId } : {}) };
    const { data } = await api.get("/api/forms/requests", { params });
    setItems(data.items || []);
  }

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError("");
      try {
        await load();
      } catch (err) {
        setError(err.response?.data?.error || t.failedRequests);
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [status, formId]);

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

  const filteredItems = useMemo(() => {
    let result = items;
    const needle = query.trim().toLowerCase();
    if (needle) result = result.filter((item) => requestSearchText(item, t).includes(needle));
    if (dateFilter !== "all") result = result.filter((item) => isWithinDateRange(item.submittedAt || item.createdAt, dateFilter));
    return result;
  }, [items, query, t, dateFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    fresh: items.filter((item) => item.status === "new").length,
    inProgress: items.filter((item) => item.status === "in_progress").length,
    done: items.filter((item) => item.status === "done").length
  }), [items]);

  if (loading) return <section className="card"><p className="muted">{t.loadingRequests}</p></section>;
  if (error) return <section className="card"><p className="error">{error}</p></section>;

  const selectedAnswers = answersForView(selected?.item?.answers || [], t);

  return (
    <section className="official-requests-page">
      <div className="official-page-title">
        <div>
          <h1>{formTitle || t.requestsTitle}</h1>
          <p>{formId ? t.requestsSubtitle : t.requestsSubtitle}</p>
        </div>
        <div className="official-stats-line">
          <Link className="official-link-btn" to="/forms">{t.myForms}</Link>
          <span>{t.totalRequests}: <b>{stats.total}</b></span>
          <span>{t.newRequests}: <b>{stats.fresh}</b></span>
          <span>{t.inProgressRequests}: <b>{stats.inProgress}</b></span>
          <span>{t.doneRequests}: <b>{stats.done}</b></span>
        </div>
      </div>

      <AnalyticsBlock items={items} t={t} />

      <div className="official-toolbar">
        <label>
          {t.search}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} />
        </label>
        <label>
          {t.status}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((item) => <option key={item || "all"} value={item}>{item ? statusLabel(item, t) : t.all}</option>)}
          </select>
        </label>
        <label>
          {t.dateRange}
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            {DATE_FILTERS.map((f) => (
              <option key={f} value={f}>
                {f === "all" ? t.all : f === "today" ? t.dateFilterToday : t.dateFilterWeek}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="official-workspace">
        <div className="official-table-card">
          <div className="official-card-title">
            <h2>{t.inbox}</h2>
            <div className="export-area">
              <span>{filteredItems.length} {t.requestsCount}</span>
              <div className="export-menu-wrap" ref={exportRef}>
                <button
                  className="export-btn"
                  onClick={() => setExportOpen((o) => !o)}
                  disabled={filteredItems.length === 0}
                >
                  {t.exportBtn}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                  <th>{t.formColumn}</th>
                  <th>{t.email}</th>
                  <th>{t.previewColumn}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">
                      {items.length === 0 ? t.noRequestsForForm : t.noRequestsFound}
                    </td>
                  </tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className={selected?.item?.id === item.id ? "selected clickable-row" : "clickable-row"} onClick={() => openDetails(item.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") openDetails(item.id); }}>
                    <td>{formatDate(item.submittedAt || item.createdAt)}</td>
                    <td>
                      <div className="form-cell-with-status">
                        <span>{item.formTitle || item.formId || "-"}</span>
                        <span className={`official-badge status-${item.status}`}>{statusLabel(item.status, t)}</span>
                      </div>
                    </td>
                    <td>{item.respondentEmail || t.noEmail}</td>
                    <td className="preview-cell">{preview(item, t)}</td>
                    <td></td>
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
                  <h3>{selected.item.formTitle || t.requestsTitle}</h3>
                </div>
                <span className={`official-badge status-${selected.item.status}`}>{statusLabel(selected.item.status, t)}</span>
              </div>

              <div className="official-detail-meta">
                <div><span>{t.submitted}</span><b>{formatDate(selected.item.submittedAt || selected.item.createdAt)}</b></div>
                <div><span>{t.email}</span><b>{selected.item.respondentEmail || "-"}</b></div>
              </div>

              <div className="official-answers">
                {selectedAnswers.map((answer, index) => (
                  <div key={`${answer.label}-${index}`} className="official-answer-row">
                    <span>{answer.label}</span>
                    <b>{answer.value}</b>
                  </div>
                ))}
              </div>

              <AIAnalysisBlock selected={selected} lang={lang} t={t} />

              <details className="detail-tech-info">
                <summary>{t.technicalInfo}</summary>
                <p>{t.responseIdLabel}: <code>{selected.item.responseId}</code></p>
              </details>
            </>
          ) : null}
        </aside>
      </div>

      <NotificationSettingsBlock formId={formId} formTitle={formTitle} t={t} />
    </section>
  );
}
