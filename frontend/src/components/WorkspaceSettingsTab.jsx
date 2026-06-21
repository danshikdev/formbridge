import { useState, useCallback } from "react";

function slugify(text) {
  const base = text
    .toLowerCase()
    .replace(/[^\w\sа-яёәіңғүұқөһА-ЯЁӘІҢҒҮҰҚӨҺ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return base || `status_${Date.now()}`;
}

export function WorkspaceSettingsTab({
  integrationId,
  scenario,
  scenarioMeta,
  customStatuses,
  t,
  onStatusesUpdated,
  apiBase = ""
}) {
  const defaultFlow = (scenarioMeta?.statusFlow || []).map((key) => ({
    key,
    label: key
  }));

  const [statuses, setStatuses] = useState(() =>
    customStatuses && customStatuses.length > 0 ? customStatuses : defaultFlow
  );
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState(null);

  const scenarioTitle =
    scenarioMeta?.title?.ru || scenarioMeta?.title?.kk || scenarioMeta?.title?.en || scenario;

  const handleLabelChange = useCallback((idx, value) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], label: value };
      return next;
    });
    setSavedMsg(false);
  }, []);

  const handleRemove = useCallback((idx) => {
    setStatuses((prev) => prev.filter((_, i) => i !== idx));
    setSavedMsg(false);
  }, []);

  const handleAdd = useCallback(() => {
    const label = newLabel.trim();
    if (!label) return;
    setStatuses((prev) => [...prev, { key: slugify(label), label }]);
    setNewLabel("");
    setSavedMsg(false);
  }, [newLabel]);

  const handleSave = useCallback(async () => {
    const cleaned = statuses.filter((s) => s.label.trim());
    if (cleaned.length === 0) {
      setError("Добавьте хотя бы один статус");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/integrations/forms/${integrationId}/statuses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ statuses: cleaned })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      const data = await res.json();
      setSavedMsg(true);
      if (onStatusesUpdated) onStatusesUpdated(data.customStatuses);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [statuses, integrationId, apiBase, onStatusesUpdated]);

  const handleReset = useCallback(async () => {
    if (!window.confirm(t.settingsResetConfirm)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/integrations/forms/${integrationId}/statuses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ statuses: [] })
      });
      if (!res.ok) throw new Error("Reset failed");
      setStatuses(defaultFlow);
      setSavedMsg(true);
      if (onStatusesUpdated) onStatusesUpdated(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationId, apiBase, onStatusesUpdated, defaultFlow.length]);

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
              <input
                className="status-editor-input"
                value={s.label}
                onChange={(e) => handleLabelChange(idx, e.target.value)}
                placeholder={t.settingsStatusPlaceholder}
                maxLength={60}
              />
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
          <input
            className="status-editor-input"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t.settingsStatusPlaceholder}
            maxLength={60}
          />
          <button
            type="button"
            className="official-btn secondary-btn"
            onClick={handleAdd}
            disabled={!newLabel.trim()}
          >
            + {t.settingsAddStatus}
          </button>
        </div>

        {error && <p className="settings-error">{error}</p>}
        {savedMsg && <p className="settings-saved-msg">{t.settingsSaved}</p>}

        <div className="settings-actions">
          <button
            type="button"
            className="official-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "..." : t.settingsSave}
          </button>
          <button
            type="button"
            className="official-btn secondary-btn"
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
