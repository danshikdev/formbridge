import { Link } from "react-router-dom";
import {
  BoltIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { useLocale } from "../shared/useLocale";
import { Breadcrumb } from "../shared/Breadcrumb";

const copy = {
  kk: {
    breadcrumb: [["FormBridge", "/"], ["Біз туралы"]],
    kicker: "Біз туралы",
    title: "Google Forms-ті кәсіби деңгейге көтереміз",
    subtitle: "FormBridge — Google Forms жауаптарын бір жұмыс кеңістігінде жинап, талдап, басқаруға мүмкіндік беретін платформа.",
    missionKicker: "Миссия",
    missionTitle: "Не үшін FormBridge?",
    missionText: "Google Forms — қарапайым, бірақ жауаптарды басқаруға арналмаған. Бізге деректерді оқып, статусты қолмен өзгертіп, сауалнамаға байланысты шешім қабылдау кезінде артық уақыт кетеді. FormBridge осы мәселені шешу үшін жасалған.",
    valuesKicker: "Негізгі принциптер",
    values: [
      ["Қарапайымдылық", "Экстра функционал емес — тек қажетті нәрсе.", ShieldCheckIcon],
      ["Жылдамдық", "Жауаптар Google Forms API арқылы автоматты синхрондалады.", BoltIcon],
      ["Аналитика", "Деректер диаграммалар мен ЖИ ұсыныстарына айналады.", ChartBarSquareIcon],
      ["ЖИ кемекші", "Форма деректерінен сұраққа жауап алу — бір хабарлама жеткілікті.", SparklesIcon],
    ],
    stackKicker: "Технологиялар",
    stackTitle: "Қандай технологиялармен жасалды",
    stack: [
      ["Frontend", "React, Vite, React Router"],
      ["Backend", "Node.js, Express, Sequelize"],
      ["Дерекқор", "PostgreSQL"],
      ["AI", "OpenAI API (gpt-5-nano)"],
      ["Интеграция", "Google Forms API, Google OAuth 2.0"],
      ["Хабарландыру", "WhatsApp-web.js"],
    ],
    ctaTitle: "Байқап көріңіз",
    ctaText: "Формаңызды FormBridge-ке бірнеше секундта қосыңыз.",
    ctaBtn: "Форманы қосу",
    ctaContact: "Байланыс",
  },
  ru: {
    breadcrumb: [["FormBridge", "/"], ["О нас"]],
    kicker: "О нас",
    title: "Превращаем Google Forms в профессиональный инструмент",
    subtitle: "FormBridge — платформа для сбора, анализа и управления ответами Google Forms в едином рабочем пространстве.",
    missionKicker: "Миссия",
    missionTitle: "Зачем FormBridge?",
    missionText: "Google Forms — простой инструмент, но он не предназначен для управления заявками. Приходится вручную читать данные, менять статусы и принимать решения без аналитики. FormBridge создан, чтобы закрыть этот пробел.",
    valuesKicker: "Принципы",
    values: [
      ["Простота", "Никакого лишнего функционала — только то, что нужно.", ShieldCheckIcon],
      ["Скорость", "Ответы синхронизируются автоматически через Google Forms API.", BoltIcon],
      ["Аналитика", "Данные превращаются в графики и AI-рекомендации.", ChartBarSquareIcon],
      ["AI-помощник", "Задайте вопрос по данным формы — получите ответ мгновенно.", SparklesIcon],
    ],
    stackKicker: "Технологии",
    stackTitle: "На чём построен FormBridge",
    stack: [
      ["Frontend", "React, Vite, React Router"],
      ["Backend", "Node.js, Express, Sequelize"],
      ["База данных", "PostgreSQL"],
      ["AI", "OpenAI API (gpt-5-nano)"],
      ["Интеграция", "Google Forms API, Google OAuth 2.0"],
      ["Уведомления", "WhatsApp Business API"],
    ],
    ctaTitle: "Попробуйте FormBridge",
    ctaText: "Подключите форму за несколько секунд и начните управлять заявками.",
    ctaBtn: "Подключить форму",
    ctaContact: "Контакты",
  },
  en: {
    breadcrumb: [["FormBridge", "/"], ["About"]],
    kicker: "About",
    title: "Taking Google Forms to a professional level",
    subtitle: "FormBridge is a platform for collecting, analyzing and managing Google Forms responses in one workspace.",
    missionKicker: "Mission",
    missionTitle: "Why FormBridge?",
    missionText: "Google Forms is simple, but it was never designed to manage requests at scale. You end up reading raw data, updating statuses by hand, and making decisions without analytics. FormBridge was built to close that gap.",
    valuesKicker: "Principles",
    values: [
      ["Simplicity", "No feature bloat — only what you actually need.", ShieldCheckIcon],
      ["Speed", "Responses sync automatically via Google Forms API.", BoltIcon],
      ["Analytics", "Raw data becomes charts and AI recommendations.", ChartBarSquareIcon],
      ["AI Assistant", "Ask a question about your form data — get an instant answer.", SparklesIcon],
    ],
    stackKicker: "Technology",
    stackTitle: "What FormBridge is built with",
    stack: [
      ["Frontend", "React, Vite, React Router"],
      ["Backend", "Node.js, Express, Sequelize"],
      ["Database", "PostgreSQL"],
      ["AI", "OpenAI API (gpt-5-nano)"],
      ["Integration", "Google Forms API, Google OAuth 2.0"],
      ["Notifications", "WhatsApp Business API"],
    ],
    ctaTitle: "Try FormBridge",
    ctaText: "Connect your form in seconds and start managing requests.",
    ctaBtn: "Connect a form",
    ctaContact: "Contact",
  }
};

export function AboutPage() {
  const { lang } = useLocale();
  const t = copy[lang] || copy.ru;
  const isLoggedIn = Boolean(localStorage.getItem("fb_token"));
  const connectTo = isLoggedIn ? "/forms" : "/login";

  return (
    <div className="about-page">
      <Breadcrumb items={t.breadcrumb} />
      <section className="about-hero">
        <span className="section-kicker">{t.kicker}</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </section>

      <section className="about-mission">
        <div className="about-mission-copy">
          <span className="section-kicker">{t.missionKicker}</span>
          <h2>{t.missionTitle}</h2>
          <p>{t.missionText}</p>
        </div>
        <div className="about-mission-img" aria-hidden="true">
          <div className="about-mission-visual">
            <div className="about-visual-bar"><span /><span /><span /></div>
            <img
              src="/setup-screenshots/product-dashboard.jpg"
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="about-values">
        <span className="section-kicker">{t.valuesKicker}</span>
        <div className="about-values-grid">
          {t.values.map(([title, desc, Icon]) => (
            <article key={title} className="about-value-card">
              <div className="about-value-icon"><Icon /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-stack">
        <span className="section-kicker">{t.stackKicker}</span>
        <h2>{t.stackTitle}</h2>
        <div className="about-stack-grid">
          {t.stack.map(([label, value]) => (
            <div key={label} className="about-stack-item">
              <span className="about-stack-label">{label}</span>
              <span className="about-stack-value">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <div className="about-cta-actions">
          <Link className="primary-btn home-primary" to={connectTo}>{t.ctaBtn}</Link>
          <Link className="primary-btn cta-outline-btn" to="/contact">{t.ctaContact}</Link>
        </div>
      </section>
    </div>
  );
}
