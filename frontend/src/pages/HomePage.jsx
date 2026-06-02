import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  BoltIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  CheckCircleIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { useLocale } from "../shared/useLocale";

const SCREENSHOT_SRC = "/setup-screenshots/forms-dashboard.jpg";

const SOLUTIONS = [
  { id: "admissions",      Icon: AcademicCapIcon    },
  { id: "client_requests", Icon: BriefcaseIcon      },
  { id: "hr",              Icon: UsersIcon           },
  { id: "survey",          Icon: ChartBarSquareIcon  },
  { id: "event",           Icon: CalendarDaysIcon    },
  { id: "universal",       Icon: Squares2X2Icon      },
];

const copy = {
  kk: {
    badge: "ЖАҢА",
    badgeText: "Google Forms үшін кәсіби өтініш платформасы",
    title: "Google Forms жауаптарын кәсіби басқару жүйесіне айналдырыңыз",
    subtitle: "Жауаптарды бақылаңыз, процестерді автоматтандырыңыз, деректерді талдаңыз және өтініштерді бір жұмыс кеңістігінде басқарыңыз.",
    connect: "Форманы қосу",
    stats: [["1,248+", "Өтініштер"], ["24+", "Белсенді формалар"], ["96.3%", "ЖИ дәлдігі"], ["24/7", "Мониторинг"]],
    workspaceLabel: "Жұмыс кеңістігі",
    workspaceTitle: "Барлық өтініштер бір жерде",
    workspaceText: "Өтініштерді бақылаңыз, талдаңыз және тиімді шешім қабылдаңыз. Жұмыс процестерін жеңіл әрі ыңғайлы етіңіз.",
    workspaceFeatures: ["ЖИ негізіндегі талдау", "Ақылды сүзгілер", "Статустарды басқару", "Нақты уақыттағы жаңарту", "Командалық жұмыс"],
    workflowLabel: "Қалай жұмыс істейді",
    workflowTitle: "Google Forms деректері FormBridge ішінде қалай жұмыс істейді",
    workflowSteps: [
      ["Google Forms қосу", "Формаңыздан келетін жауаптар бір жүйеге бағытталады."],
      ["Apps Script байланысы", "Google Sheets арқылы жаңа жауаптар қауіпсіз жіберіледі."],
      ["Деректерді өңдеу", "Өтініштер сақталып, статус пен жауапты адамға бөлінеді."],
      ["Аналитика және ЖИ", "Жүйе деректерді талдап, қысқаша ұсыныстар береді."],
      ["Өтініштерді басқару", "Команда барлық өтінішті бір жұмыс кеңістігінде бақылайды."]
    ],
    solutionsLabel: "Шешімдер",
    solutionsTitle: "Кез келген салаға арналған шешімдер",
    solutionsMore: "Толығырақ",
    solutions: {
      admissions:      ["Қабылдау комиссиясы",  "Абитуриент өтініштерін жылдам өңдеп, қабылдау процесін толық бақылаңыз."],
      client_requests: ["Клиент өтініштері",     "Клиент хабарларын жоғалтпаңыз — шұғылдарды бірінші өңдеңіз."],
      hr:              ["HR / Рекрутинг",         "Үміткерлерді іріктеп, shortlist жасаңыз — ЖИ ең үздікті табады."],
      survey:          ["Сауалнама / Анкета",     "ЖИ жауаптардан паттерн табады, диаграммалар жасайды, есеп дайындайды."],
      event:           ["Іс-шара тіркеу",         "Қатысушылар тізімін басқарып, растаңыз және есеп алыңыз."],
      universal:       ["Жалпылама режим",        "Кез келген форма үшін — статустар, ЖИ талдау және есептер."],
    },
    aiLabel: "ЖИ кемекші",
    aiTitle: "Форма деректерінен ақылды жауаптар алыңыз",
    aiText: "Әр жұмыс кеңістігінде кірістірілген ЖИ бар — ол форманың барлық жауаптарын оқиды және сұрақтарыңызға нақты жауап береді.",
    aiFeatures: [
      "Өтінішті автоматты талдап, негізгі деректерді бөліп алады",
      "«Неше адам бүгін жіберді?» деген сауалдарға жауап береді",
      "Тенденцияларды анықтап, ұсыныстар береді",
      "Сценарийге сәйкес бейімделген сұрақтар ұсынады"
    ],
    aiScreenshotAlt: "FormBridge ЖИ кемекші интерфейсі",
    reportsLabel: "Есептер",
    reportsTitle: "Дайын есептерді бір шертумен жүктеп алыңыз",
    reportsText: "Форма деректерін Word немесе Excel форматтарында экспорттаңыз. Есепте барлық жауаптар, статустар және талдау нәтижелері болады.",
    reportsScreenshotAlt: "FormBridge есеп алдын ала қарау",
    whyLabel: "Неліктен FormBridge?",
    whyTitle: "Неліктен FormBridge?",
    why: [
      ["Нақты уақыт", "Өтініштерді нақты уақытта көріп, жедел әрекет етіңіз."],
      ["Ақылды аналитика", "Деректерден құнды ақпарат алып, шешім қабылдаңыз."],
      ["ЖИ талдау", "Өтініштерді автоматты талдап, ұсыныстар алыңыз."],
      ["Автоматтандыру", "Қайталанатын процестерді автоматтандырып, уақытты үнемдеңіз."]
    ],
    finalTitle: "Google Forms мүмкіндігін кеңейтіңіз",
    finalText: "FormBridge арқылы өтініштерді кәсіби түрде басқарыңыз.",
    footerText: "Google Forms негізіндегі өтініштерді басқаруға арналған кәсіби платформа.",
    footerGroups: [
      ["Өнім", "Мүмкіндіктер", "Қалай жұмыс істейді", "Баға"],
      ["Компания", "Біз туралы", "Байланыс"],
      ["Ресурстар", "Құжаттама", "Нұсқаулықтар", "Қолдау"]
    ],
    copyright: "© 2026 FormBridge. Барлық құқықтар қорғалған.",
    screenshotAlt: "FormBridge жұмыс кеңістігінің нақты көрінісі"
  },
  ru: {
    badge: "НОВОЕ",
    badgeText: "Профессиональная платформа для Google Forms",
    title: "Превратите Google Forms в профессиональную систему управления заявками",
    subtitle: "Отслеживайте ответы, автоматизируйте процессы, анализируйте данные и управляйте заявками из одного рабочего пространства.",
    connect: "Подключить форму",
    stats: [["1,248+", "Заявки"], ["24+", "Активные формы"], ["96.3%", "Точность AI"], ["24/7", "Мониторинг"]],
    workspaceLabel: "Рабочее пространство",
    workspaceTitle: "Все заявки в одном месте",
    workspaceText: "Контролируйте заявки, анализируйте данные и принимайте решения быстрее. Рабочие процессы становятся понятными и удобными.",
    workspaceFeatures: ["AI-анализ", "Умные фильтры", "Управление статусами", "Обновления в реальном времени", "Командная работа"],
    workflowLabel: "Как работает",
    workflowTitle: "Как данные Google Forms попадают в FormBridge",
    workflowSteps: [
      ["Подключение Google Forms", "Ответы из формы направляются в единую систему."],
      ["Связь через Apps Script", "Новые ответы безопасно передаются через Google Sheets."],
      ["Обработка данных", "Заявки сохраняются, получают статус и ответственного."],
      ["Аналитика и AI", "Система анализирует данные и показывает краткие рекомендации."],
      ["Управление заявками", "Команда работает с заявками в одном пространстве."]
    ],
    solutionsLabel: "Решения",
    solutionsTitle: "Решения для разных сфер",
    solutionsMore: "Подробнее",
    solutions: {
      admissions:      ["Приемная комиссия",     "Быстро обрабатывайте заявки абитуриентов и контролируйте процесс поступления."],
      client_requests: ["Клиентские заявки",     "Не теряйте клиентские обращения — срочные обрабатывайте первыми."],
      hr:              ["HR / Рекрутинг",         "Отбирайте кандидатов и делайте шортлисты — AI находит лучших."],
      survey:          ["Опрос / Анкета",         "AI находит паттерны в ответах, строит графики и готовит выводы."],
      event:           ["Регистрация на событие", "Управляйте списком участников, подтверждайте, получайте отчёты."],
      universal:       ["Универсальный режим",    "Для любой формы — статусы, AI-анализ и экспорт отчётов."],
    },
    aiLabel: "ЖИ-помощник",
    aiTitle: "Получайте умные ответы из данных формы",
    aiText: "В каждом рабочем пространстве встроен AI — он читает все ответы формы и отвечает на ваши вопросы точно и быстро.",
    aiFeatures: [
      "Автоматически анализирует заявку и выделяет ключевые данные",
      "Отвечает на вопросы типа «Сколько человек отправили сегодня?»",
      "Выявляет тенденции и даёт рекомендации",
      "Предлагает вопросы, адаптированные под сценарий"
    ],
    aiScreenshotAlt: "Интерфейс ЖИ-помощника FormBridge",
    reportsLabel: "Отчёты",
    reportsTitle: "Готовые отчёты одним кликом",
    reportsText: "Экспортируйте данные формы в форматах Word или Excel. В отчёт входят все ответы, статусы и результаты аналитики.",
    reportsScreenshotAlt: "Предпросмотр отчёта FormBridge",
    whyLabel: "Почему FormBridge?",
    whyTitle: "Почему FormBridge?",
    why: [
      ["Реальное время", "Видите заявки сразу и быстрее реагируете."],
      ["Умная аналитика", "Получаете полезные данные для решений."],
      ["AI-анализ", "AI помогает анализировать заявки и рекомендации."],
      ["Автоматизация", "Повторяющиеся процессы занимают меньше времени."]
    ],
    finalTitle: "Расширьте возможности Google Forms",
    finalText: "Управляйте заявками профессионально через FormBridge.",
    footerText: "Профессиональная платформа для управления заявками на базе Google Forms.",
    footerGroups: [["Продукт", "Функции", "Как работает", "Цены"], ["Компания", "О нас", "Контакты"], ["Ресурсы", "Документация", "Гайды", "Поддержка"]],
    copyright: "© 2026 FormBridge. Все права защищены.",
    screenshotAlt: "Реальный вид рабочего пространства FormBridge"
  },
  en: {
    badge: "NEW",
    badgeText: "Professional platform for Google Forms",
    title: "Transform Google Forms Into a Professional Request Management Platform",
    subtitle: "Monitor responses, automate workflows, analyze data and manage requests from one centralized workspace.",
    connect: "Connect Form",
    stats: [["1,248+", "Requests"], ["24+", "Active Forms"], ["96.3%", "AI Accuracy"], ["24/7", "Monitoring"]],
    workspaceLabel: "Workspace",
    workspaceTitle: "All requests in one place",
    workspaceText: "Track requests, analyze data and make decisions faster from one clean workspace.",
    workspaceFeatures: ["AI-based analysis", "Smart filters", "Status management", "Real-time updates", "Team collaboration"],
    workflowLabel: "How it works",
    workflowTitle: "How Google Forms data flows into FormBridge",
    workflowSteps: [
      ["Connect Google Forms", "Form responses are routed into one management system."],
      ["Apps Script integration", "New answers are transferred through Google Sheets securely."],
      ["Data processing", "Requests are stored, assigned a status and an owner."],
      ["Analytics and AI", "The platform analyzes data and returns concise recommendations."],
      ["Request management", "Teams manage every request from one workspace."]
    ],
    solutionsLabel: "Solutions",
    solutionsTitle: "Solutions for every industry",
    solutionsMore: "Learn more",
    solutions: {
      admissions:      ["Admissions",           "Process applicant submissions quickly and control the full admissions workflow."],
      client_requests: ["Client requests",      "Never miss a client request — handle urgent ones first."],
      hr:              ["HR / Recruiting",       "Screen candidates and build shortlists — AI finds the best ones."],
      survey:          ["Survey / Questionnaire","AI finds patterns, builds charts and writes conclusions from responses."],
      event:           ["Event registration",   "Manage participant lists, send confirmations and get reports."],
      universal:       ["Universal mode",       "For any form — statuses, AI analysis and report export."],
    },
    aiLabel: "AI Assistant",
    aiTitle: "Get smart answers from your form data",
    aiText: "Every workspace has a built-in AI that reads all form responses and answers your questions accurately and instantly.",
    aiFeatures: [
      "Automatically analyzes requests and extracts key data",
      "Answers questions like \"How many people submitted today?\"",
      "Identifies trends and provides recommendations",
      "Suggests questions tailored to your scenario"
    ],
    aiScreenshotAlt: "FormBridge AI Assistant interface",
    reportsLabel: "Reports",
    reportsTitle: "Download ready reports in one click",
    reportsText: "Export form data as Word or Excel files. Reports include all responses, statuses and analytics results.",
    reportsScreenshotAlt: "FormBridge report preview",
    whyLabel: "Why FormBridge?",
    whyTitle: "Why FormBridge?",
    why: [["Real time", "See requests instantly and act faster."], ["Smart analytics", "Turn form data into useful insights."], ["AI analysis", "Analyze requests and receive recommendations."], ["Automation", "Save time on repetitive workflows."]],
    finalTitle: "Expand what Google Forms can do",
    finalText: "Manage requests professionally with FormBridge.",
    footerText: "Professional request management platform for Google Forms.",
    footerGroups: [["Product", "Features", "How it works", "Pricing"], ["Company", "About", "Contact"], ["Resources", "Documentation", "Guides", "Support"]],
    copyright: "© 2026 FormBridge. All rights reserved.",
    screenshotAlt: "Real FormBridge workspace dashboard"
  }
};

const whyIcons = [ShieldCheckIcon, ChartBarSquareIcon, SparklesIcon, BoltIcon];
const workflowIcons = [DocumentTextIcon, BoltIcon, CpuChipIcon, ChartBarSquareIcon, CheckCircleIcon];

// Footer link targets by group/item position (language-agnostic)
const FOOTER_HREFS = [
  ["/#features", "/#workflow", "/#pricing"],
  ["/#about", "/#about"],
  ["/health", "/health", "/#about"],
];

function ProductPreview({ variant = "hero", alt, src }) {
  return (
    <div className={`product-preview product-preview--${variant}`}>
      <div className="product-preview-bar">
        <span />
        <span />
        <span />
      </div>
      <img src={src || SCREENSHOT_SRC} alt={alt} loading={variant === "hero" ? "eager" : "lazy"} />
    </div>
  );
}

export function HomePage() {
  const { lang, setLang } = useLocale();
  const text = copy[lang] || copy.kk;
  const isLoggedIn = Boolean(localStorage.getItem("fb_token"));
  const connectTo = isLoggedIn ? "/forms" : "/login";

  return (
    <section className={`home-page home-lang-${lang || "kk"}`}>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="home-badge"><b>{text.badge}</b>{text.badgeText}</span>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
          <div className="home-actions">
            <Link className="primary-btn home-primary" to={connectTo}>{text.connect}</Link>
          </div>
        </div>
        <ProductPreview variant="hero" alt={text.screenshotAlt} />
      </section>

      <section className="landing-workspace" id="workspace">
        <div className="landing-workspace-copy">
          <span className="section-kicker">{text.workspaceLabel}</span>
          <h2>{text.workspaceTitle}</h2>
          <p>{text.workspaceText}</p>
          <div className="landing-check-list">
            {text.workspaceFeatures.map((item) => <span key={item}><CheckCircleIcon />{item}</span>)}
          </div>
        </div>
        <ProductPreview variant="wide" alt={text.screenshotAlt} src="/setup-screenshots/product-dashboard.jpg" />
      </section>

      <section className="landing-ai" id="ai">
        <div className="landing-ai-screenshot">
          <div className="product-preview product-preview--wide">
            <div className="product-preview-bar"><span /><span /><span /></div>
            <img src="/setup-screenshots/feature-ai.jpg" alt={text.aiScreenshotAlt} loading="lazy" />
          </div>
        </div>
        <div className="landing-ai-copy">
          <span className="section-kicker">{text.aiLabel}</span>
          <h2>{text.aiTitle}</h2>
          <p>{text.aiText}</p>
          <ul className="landing-ai-features">
            {text.aiFeatures.map((f) => (
              <li key={f}><SparklesIcon /><span>{f}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-reports" id="reports">
        <div className="landing-reports-copy">
          <span className="section-kicker">{text.reportsLabel}</span>
          <h2>{text.reportsTitle}</h2>
          <p>{text.reportsText}</p>
        </div>
        <div className="landing-reports-screenshot">
          <div className="product-preview product-preview--modal">
            <div className="product-preview-bar"><span /><span /><span /></div>
            <img src="/setup-screenshots/feature-reports.jpg" alt={text.reportsScreenshotAlt} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="landing-workflow" id="workflow">
        <span className="section-kicker">{text.workflowLabel}</span>
        <h2>{text.workflowTitle}</h2>
        <div className="landing-workflow-line">
          {text.workflowSteps.map(([title, desc], index) => {
            const Icon = workflowIcons[index];
            return (
              <article key={title}>
                <div><Icon /></div>
                <b>{index + 1}</b>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-solutions" id="solutions">
        <span className="section-kicker">{text.solutionsLabel}</span>
        <h2>{text.solutionsTitle}</h2>
        <div className="landing-solution-grid">
          {SOLUTIONS.map(({ id, Icon }) => {
            const [title, desc] = text.solutions[id];
            return (
              <article key={id}>
                <Icon />
                <h3>{title}</h3>
                <p>{desc}</p>
                <Link to={`/solutions/${id}`}>{text.solutionsMore} →</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-why" id="features">
        <span className="section-kicker">{text.whyLabel}</span>
        <h2>{text.whyTitle}</h2>
        <div className="landing-why-grid">
          {text.why.map(([title, desc], index) => {
            const Icon = whyIcons[index];
            return (
              <article key={title}>
                <Icon />
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-final-cta" id="pricing">
        <div>
          <h2>{text.finalTitle}</h2>
          <p>{text.finalText}</p>
        </div>
        <div className="home-actions">
          <Link className="primary-btn cta-light-btn" to={connectTo}>{text.connect}</Link>
        </div>
      </section>

      <footer className="landing-footer" id="resources">
        <div className="landing-footer-brand">
          <strong>FormBridge</strong>
          <p>{text.footerText}</p>
        </div>
        <div className="landing-footer-groups">
          {text.footerGroups.map(([title, ...items], gi) => (
            <nav key={title}>
              <b>{title}</b>
              {items.map((item, ii) => (
                <a key={item} href={FOOTER_HREFS[gi]?.[ii] || "#"}>{item}</a>
              ))}
            </nav>
          ))}
        </div>
        <div className="landing-footer-bottom" id="about">
          <span>{text.copyright}</span>
          <div>
            <button type="button" onClick={() => setLang("kk")} className={lang === "kk" ? "active" : ""}>Қазақша</button>
            <button type="button" onClick={() => setLang("ru")} className={lang === "ru" ? "active" : ""}>Русский</button>
            <button type="button" onClick={() => setLang("en")} className={lang === "en" ? "active" : ""}>English</button>
          </div>
        </div>
      </footer>
    </section>
  );
}
