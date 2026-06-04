import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useLocale } from "../shared/useLocale";

export function ShareModal({ formId, formTitle, onClose }) {
  const { t } = useLocale();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  async function loadMembers() {
    try {
      const { data } = await api.get(`/api/forms/${encodeURIComponent(formId)}/members`);
      setMembers(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post(`/api/forms/${encodeURIComponent(formId)}/members`, { email: email.trim() });
      setEmail("");
      setSuccess(t.memberInvited || "Доступ открыт");
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(memberId) {
    if (!window.confirm(t.removeMemberConfirm || "Убрать доступ?")) return;
    setError("");
    try {
      await api.delete(`/api/forms/${encodeURIComponent(formId)}/members/${memberId}`);
      await loadMembers();
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.shareForm || "Командный доступ"}</h2>
          <button className="modal-close-btn" type="button" onClick={onClose}>✕</button>
        </div>

        <p className="share-modal-form-title">{formTitle}</p>
        <p className="share-modal-hint">
          {t.shareHint || "Участники могут просматривать заявки. Только настроенные формы можно открыть для команды."}
        </p>

        <form className="share-invite-form" onSubmit={handleInvite}>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.inviteEmailPh || "Email пользователя..."}
            disabled={submitting}
          />
          <button className="primary-btn" type="submit" disabled={submitting || !email.trim()}>
            {submitting ? "..." : (t.invite || "Пригласить")}
          </button>
        </form>

        {error && <p className="error official-message">{error}</p>}
        {success && <p className="ok-msg official-message">{success}</p>}

        <div className="share-members-list">
          <h3>{t.currentMembers || "Участники"}</h3>
          {loading ? (
            <p className="muted">...</p>
          ) : members.length === 0 ? (
            <p className="muted">{t.noMembers || "Нет участников"}</p>
          ) : (
            <ul>
              {members.map((m) => (
                <li key={m.id} className="share-member-row">
                  <div className="share-member-info">
                    <span className="share-member-name">{m.member?.fullName}</span>
                    <span className="share-member-email">{m.member?.email}</span>
                  </div>
                  <span className="official-badge status-in_progress">{t.viewer || "Просмотр"}</span>
                  <button
                    className="official-link-btn danger-btn"
                    type="button"
                    onClick={() => handleRemove(m.member?.id)}
                  >
                    {t.remove || "Убрать"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
