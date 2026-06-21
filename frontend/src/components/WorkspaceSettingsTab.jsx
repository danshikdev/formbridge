import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api/client";
import { createDefaultStatus, normalizeCustomStatus, resolveStatusLabel, STATUS_LANGS } from "../shared/statuses";

const STATUS_LANGUAGE_LABELS = {
  kk: "KK",
  ru: "RU",
  en: "EN"
};

function slugify(text) {
  const base = text
    .toLowerCase()
    .replace(/[^\w\sа-яёәіңғүұқөһА-ЯЁӘІҢҒҮҰҚӨҺ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return base || `status_${Date.now()}`;
}

function editableTranslations(value) {
  const next = {};
  for (const locale of STATUS_LANGS) {
    next[locale] = typeof value?.[locale] === "string" ? value[locale] : "";
  }
  return next;
}

function editableStatus(status) {
  const normalized = normalizeCustomStatus(status);
  return {
    key: normalized.key,
    label: normalized.label,
    translations: editableTranslations(normalized.translations)
  };
}

export function WorkspaceSettingsTab({
  integrationId,
  scenario,
  scenarioMeta,
  customStatuses,
  t,
  lang,
  onStatusesUpdated
}) {
  const defaultFlow = useMemo(
    () => (scenarioMeta?.statusFlow || []).map((key) => editableStatus(createDefaultStatus(key))),
    [scenarioMeta]
  );

  const [statuses, setStatuses] = useState(() =>
    customStatuses && customStatuses.length > 0
      ? customStatuses.map((status) => editableStatus(status))
      : defaultFlow
  );
  const [newStatus, setNewStatus] = useState({ kk: "", ru: "", en: "" });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState(null);

  const scenarioTitle =
    scenarioMeta?.title?.ru || scenarioMeta?.title?.kk || scenarioMeta?.title?.en || scenario;

  useEffect(() => {
    setStatuses(
      customStatuses && customStatuses.length > 0
        ? customStatuses.map((status) => editableStatus(status))
        : defaultFlow
    );
  }, [customStatuses, defaultFlow]);

  const handleLabelChange = useCallback((idx, locale, value) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        translations: {
          ...next[idx]?.translations,
          [locale]: value
        }
      };
      return next;
    });
    setSavedMsg(false);
  }, []);

  const handleRemove = useCallback((idx) => {
    setStatuses((prev) => prev.filter((_, i) => i !== idx));
    setSavedMsg(false);
  }, []);

  const handleAdd = useCallback(() => {
    const baseLabel = resolveStatusLabel({ translations: newStatus }, lang).trim();
    if (!baseLabel) return;
    setStatuses((prev) => [
      ...prev,
      {
        key: slugify(baseLabel),
        label: baseLabel,
        translations: newStatus
      }
    ]);
    setNewStatus({ kk: "", ru: "", en: "" });
    setSavedMsg(false);
  }, [lang, newStatus]);

  const handleSave = useCallback(async () => {
    const cleaned = statuses
      .map((status) => normalizeCustomStatus(status))
      .filter((status) => resolveStatusLabel(status, lang).trim())
      .map((status) => ({
        key: status.key,
        label: resolveStatusLabel(status, "ru"),
        translations: status.translations
      }));
    if (cleaned.length === 0) {
      setError(t.settingsMinOneStatus);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.patch(
        `/api/integrations/forms/${integrationId}/statuses`,
        { statuses: cleaned }
      );
      setStatuses((data.customStatuses || []).map((status) => editableStatus(status)));
      setSavedMsg(true);
      if (onStatusesUpdated) onStatusesUpdated(data.customStatuses);
    } catch (err) {
      setError(err.response?.data?.error || t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }, [statuses, integrationId, lang, onStatusesUpdated, t]);

  const handleReset = useCallback(async () => {
    if (!window.confirm(t.settingsResetConfirm)) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/api/integrations/forms/${integrationId}/statuses`, { statuses: [] });
      setStatuses(defaultFlow);
      setSavedMsg(true);
      if (onStatusesUpdated) onStatusesUpdated(null);
    } catch (err) {
      setError(err.response?.data?.error || t.settingsSaveError);
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationId, onStatusesUpdated, t, defaultFlow.length]);

  return (
    <div className="workspace-settings-tab">
      <div className="settings-section">
        <div className="settings-section-label">{t.settingsScenarioLabel}</div>
        <div className="settings-scenario-badge">{scenarioTitle}</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-label">{t.settingsStatusesTitle}</div>
        <p className="settings-hint">{t.settingsStatusesHint}</p>

        <ul className="status-editor-list">
          {statuses.map((s, idx) => (
            <li key={s.key} className="status-editor-row">
              <span className={`official-badge status-${s.key}`} aria-hidden="true" />
              <div className="status-editor-fields">
                {STATUS_LANGS.map((locale) => (
                  <label key={locale} className="status-translation-field">
                    <span title={locale}>{STATUS_LANGUAGE_LABELS[locale]}</span>
                    <input
                      className="status-editor-input"
                      value={s.translations?.[locale] || ""}
                      onChange={(e) => handleLabelChange(idx, locale, e.target.value)}
                      placeholder={t.settingsStatusPlaceholder}
                      aria-label={`${t.settingsStatusPlaceholder} (${STATUS_LANGUAGE_LABELS[locale]})`}
                      maxLength={60}
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="status-editor-remove"
                aria-label="Remove"
                onClick={() => handleRemove(idx)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>

        <div className="status-editor-add-row">
          <div className="status-editor-add-fields">
            {STATUS_LANGS.map((locale) => (
              <label key={locale} className="status-translation-field">
                <span title={locale}>{STATUS_LANGUAGE_LABELS[locale]}</span>
                <input
                  className="status-editor-input"
                  value={newStatus[locale]}
                  onChange={(e) => setNewStatus((prev) => ({ ...prev, [locale]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder={t.settingsStatusPlaceholder}
                  aria-label={`${t.settingsStatusPlaceholder} (${STATUS_LANGUAGE_LABELS[locale]})`}
                  maxLength={60}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="ghost-btn compact-action-btn status-editor-add-btn"
            onClick={handleAdd}
            disabled={!resolveStatusLabel({ translations: newStatus }, lang).trim()}
          >
            + {t.settingsAddStatus}
          </button>
        </div>

        {error && <p className="settings-error">{error}</p>}
        {savedMsg && <p className="settings-saved-msg">{t.settingsSaved}</p>}

        <div className="settings-actions">
          <button
            type="button"
            className="primary-btn compact-action-btn settings-action-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "..." : t.settingsSave}
          </button>
          <button
            type="button"
            className="ghost-btn compact-action-btn settings-action-btn"
            onClick={handleReset}
            disabled={saving}
          >
            {t.settingsReset}
          </button>
        </div>
      </div>
    </div>
  );
}
