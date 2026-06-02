import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { useLocale } from "../shared/useLocale";
import { api } from "../api/client";
import { Breadcrumb } from "../shared/Breadcrumb";

const copy = {
  kk: {
    breadcrumb: [["FormBridge", "/"], ["Байланыс"]],
    kicker: "Байланыс",
    title: "Хабарлама жіберіңіз",
    subtitle: "Сұрақ, ұсыныс немесе пікір болса — жазыңыз, жауап береміз.",
    namePh: "Атыңыз",
    emailPh: "Email",
    messagePh: "Хабарламаңыз...",
    send: "Жіберу",
    sending: "Жіберілуде...",
    successTitle: "Хабарлама жіберілді",
    successText: "Сізбен жақын арада байланысамыз.",
    backHome: "Басты бетке",
    infoTitle: "Байланыс ақпараты",
    infoEmail: "Электрондық пошта",
    infoResponse: "Жауап уақыты",
    infoResponseVal: "1–2 жұмыс күні",
    nameRequired: "Атыңызды енгізіңіз",
    emailRequired: "Email енгізіңіз",
    messageRequired: "Хабарлама жазыңыз",
  },
  ru: {
    breadcrumb: [["FormBridge", "/"], ["Контакты"]],
    kicker: "Контакты",
    title: "Напишите нам",
    subtitle: "Есть вопрос, предложение или отзыв — мы читаем всё и отвечаем.",
    namePh: "Ваше имя",
    emailPh: "Email",
    messagePh: "Ваше сообщение...",
    send: "Отправить",
    sending: "Отправка...",
    successTitle: "Сообщение отправлено",
    successText: "Мы свяжемся с вами в ближайшее время.",
    backHome: "На главную",
    infoTitle: "Контактная информация",
    infoEmail: "Электронная почта",
    infoResponse: "Время ответа",
    infoResponseVal: "1–2 рабочих дня",
    nameRequired: "Введите имя",
    emailRequired: "Введите email",
    messageRequired: "Напишите сообщение",
  },
  en: {
    breadcrumb: [["FormBridge", "/"], ["Contact"]],
    kicker: "Contact",
    title: "Get in touch",
    subtitle: "Have a question, suggestion or feedback — write to us and we will reply.",
    namePh: "Your name",
    emailPh: "Email",
    messagePh: "Your message...",
    send: "Send message",
    sending: "Sending...",
    successTitle: "Message sent",
    successText: "We will get back to you shortly.",
    backHome: "Back to home",
    infoTitle: "Contact information",
    infoEmail: "Email address",
    infoResponse: "Response time",
    infoResponseVal: "1–2 business days",
    nameRequired: "Please enter your name",
    emailRequired: "Please enter your email",
    messageRequired: "Please write a message",
  }
};

export function ContactPage() {
  const { lang } = useLocale();
  const t = copy[lang] || copy.ru;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  function validate() {
    const next = {};
    if (!name.trim()) next.name = t.nameRequired;
    if (!email.trim()) next.email = t.emailRequired;
    if (!message.trim()) next.message = t.messageRequired;
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSendError("");
    setSending(true);
    try {
      await api.post("/api/contact", { name, email, message });
      setSent(true);
    } catch (err) {
      setSendError(err.response?.data?.error || "Ошибка отправки. Попробуйте позже.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="contact-page">
        <div className="contact-success">
          <div className="contact-success-icon"><CheckCircleIcon /></div>
          <h2>{t.successTitle}</h2>
          <p>{t.successText}</p>
          <Link className="primary-btn home-primary" to="/">{t.backHome}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <Breadcrumb items={t.breadcrumb} />
      <section className="contact-hero">
        <span className="section-kicker">{t.kicker}</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </section>

      <div className="contact-body">
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-field">
            <input
              type="text"
              placeholder={t.namePh}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name ? <span className="contact-field-error">{errors.name}</span> : null}
          </div>
          <div className="contact-field">
            <input
              type="email"
              placeholder={t.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email ? <span className="contact-field-error">{errors.email}</span> : null}
          </div>
          <div className="contact-field">
            <textarea
              placeholder={t.messagePh}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className={errors.message ? "input-error" : ""}
            />
            {errors.message ? <span className="contact-field-error">{errors.message}</span> : null}
          </div>
          <button type="submit" className="primary-btn home-primary" disabled={sending}>
            {sending ? t.sending : t.send}
          </button>
          {sendError ? <span className="contact-field-error">{sendError}</span> : null}
        </form>

        <aside className="contact-info">
          <h3>{t.infoTitle}</h3>
          <div className="contact-info-row">
            <div className="contact-info-icon"><EnvelopeIcon /></div>
            <div>
              <span className="contact-info-label">{t.infoEmail}</span>
              <span className="contact-info-val">shora.inc@outlook.com</span>
            </div>
          </div>
          <div className="contact-info-row">
            <div className="contact-info-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="contact-info-label">{t.infoResponse}</span>
              <span className="contact-info-val">{t.infoResponseVal}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
