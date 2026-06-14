import { Link } from "react-router-dom";
import { useLocale } from "../shared/useLocale";
import { Breadcrumb } from "../shared/Breadcrumb";

const copy = {
  kk: {
    breadcrumb: [["FormBridge", "/"], ["Құпиялылық саясаты"]],
    kicker: "Құпиялылық саясаты",
    title: "Деректеріңіз қалай қорғалады",
    updated: "Соңғы жаңарту: 2026 жыл, маусым",
    sections: [
      {
        title: "Жалпы ақпарат",
        text: "FormBridge (formbridge.shora.site) — Google Forms жауаптарын басқаруға арналған платформа. Осы Құпиялылық саясаты платформаны пайдалану кезінде қандай деректер жиналатынын, қалай сақталатынын және қорғалатынын түсіндіреді.",
      },
      {
        title: "Қандай деректер жиналады",
        items: [
          "Google аккаунт деректері: электрондық пошта, аты-жөні, профиль суреті (кіру кезінде)",
          "Google Forms жауаптары: сіздің формаларыңыздағы пайдаланушы жауаптары",
          "Google Forms құрылымы: форма атауы, сұрақтар тізімі",
          "Google Drive метадеректері: формаларды іздеу үшін файл атаулары мен идентификаторлары",
          "Аккаунт баптаулары: тіл, WhatsApp нөмірі (егер қосылса), хабарландыру параметрлері",
        ],
      },
      {
        title: "Google API рұқсаттары (OAuth Scopes)",
        text: "FormBridge мына рұқсаттарды сұрайды:",
        items: [
          "forms.body.readonly — форма атауы мен сұрақтарын оқу үшін",
          "forms.responses.readonly — форма жауаптарын алу және синхрондау үшін",
          "drive.metadata.readonly — Google Drive-тан формаларды іздеу үшін",
          "spreadsheets — Google Sheets-пен интеграция үшін (болашақта экспорт)",
          "userinfo.email, userinfo.profile, openid — аутентификация үшін",
        ],
        note: "Деректер тек сіздің рұқсатыңызбен және тек FormBridge мақсатында ғана пайдаланылады. Үшінші тараппен бөліспейміз.",
      },
      {
        title: "Деректер қалай сақталады",
        items: [
          "Барлық деректер PostgreSQL дерекқорында сақталады",
          "Сервер Қазақстан аумағында орналасқан",
          "JWT токендері сессияны қорғау үшін пайдаланылады",
          "Google OAuth токендері шифрланған күйде сақталады",
          "Басқа пайдаланушылар сіздің деректеріңізге қол жеткізе алмайды",
        ],
      },
      {
        title: "Деректерді жою",
        text: "Аккаунтты жою туралы сұраныс жіберсеңіз, барлық деректеріңіз 30 күн ішінде жойылады. Сонымен қатар, Google аккаунтыңызда FormBridge-ке берілген рұқсатты кез келген уақытта алып тастауға болады.",
      },
      {
        title: "Байланыс",
        text: "Сұрақтарыңыз болса, бізге хабарласыңыз:",
        contact: true,
      },
    ],
    contactBtn: "Байланыс беті",
  },
  ru: {
    breadcrumb: [["FormBridge", "/"], ["Политика конфиденциальности"]],
    kicker: "Политика конфиденциальности",
    title: "Как мы защищаем ваши данные",
    updated: "Последнее обновление: июнь 2026 года",
    sections: [
      {
        title: "Общая информация",
        text: "FormBridge (formbridge.shora.site) — платформа для управления ответами Google Forms. Эта Политика конфиденциальности объясняет, какие данные собираются при использовании платформы, как они хранятся и защищаются.",
      },
      {
        title: "Какие данные собираются",
        items: [
          "Данные аккаунта Google: email, имя, фото профиля (при входе)",
          "Ответы Google Forms: ответы пользователей в ваших формах",
          "Структура Google Forms: название формы, список вопросов",
          "Метаданные Google Drive: названия и идентификаторы файлов для поиска форм",
          "Настройки аккаунта: язык, номер WhatsApp (если подключён), параметры уведомлений",
        ],
      },
      {
        title: "Разрешения Google API (OAuth Scopes)",
        text: "FormBridge запрашивает следующие разрешения:",
        items: [
          "forms.body.readonly — для чтения названия и вопросов формы",
          "forms.responses.readonly — для получения и синхронизации ответов формы",
          "drive.metadata.readonly — для поиска форм в Google Drive",
          "spreadsheets — для интеграции с Google Sheets (экспорт в будущем)",
          "userinfo.email, userinfo.profile, openid — для аутентификации",
        ],
        note: "Данные используются только с вашего согласия и исключительно в целях FormBridge. Мы не передаём данные третьим лицам.",
      },
      {
        title: "Как хранятся данные",
        items: [
          "Все данные хранятся в базе данных PostgreSQL",
          "Сервер расположен на территории Казахстана",
          "JWT-токены используются для защиты сессии",
          "Токены Google OAuth хранятся в зашифрованном виде",
          "Другие пользователи не имеют доступа к вашим данным",
        ],
      },
      {
        title: "Удаление данных",
        text: "Если вы отправите запрос на удаление аккаунта, все ваши данные будут удалены в течение 30 дней. Также вы можете в любой момент отозвать разрешение FormBridge в настройках вашего аккаунта Google.",
      },
      {
        title: "Контакты",
        text: "Если у вас есть вопросы, свяжитесь с нами:",
        contact: true,
      },
    ],
    contactBtn: "Страница контактов",
  },
  en: {
    breadcrumb: [["FormBridge", "/"], ["Privacy Policy"]],
    kicker: "Privacy Policy",
    title: "How we protect your data",
    updated: "Last updated: June 2026",
    sections: [
      {
        title: "Overview",
        text: "FormBridge (formbridge.shora.site) is a platform for managing Google Forms responses. This Privacy Policy explains what data is collected when using the platform, how it is stored, and how it is protected.",
      },
      {
        title: "What data is collected",
        items: [
          "Google account data: email, name, profile photo (on sign-in)",
          "Google Forms responses: user responses submitted to your forms",
          "Google Forms structure: form title, list of questions",
          "Google Drive metadata: file names and IDs used to find your forms",
          "Account settings: language, WhatsApp number (if connected), notification preferences",
        ],
      },
      {
        title: "Google API permissions (OAuth Scopes)",
        text: "FormBridge requests the following permissions:",
        items: [
          "forms.body.readonly — to read the form title and questions",
          "forms.responses.readonly — to fetch and sync form responses",
          "drive.metadata.readonly — to search for forms in Google Drive",
          "spreadsheets — for Google Sheets integration (future export feature)",
          "userinfo.email, userinfo.profile, openid — for authentication",
        ],
        note: "Data is used only with your consent and solely for FormBridge purposes. We do not share your data with third parties.",
      },
      {
        title: "How data is stored",
        items: [
          "All data is stored in a PostgreSQL database",
          "The server is located in Kazakhstan",
          "JWT tokens are used to protect your session",
          "Google OAuth tokens are stored in encrypted form",
          "Other users cannot access your data",
        ],
      },
      {
        title: "Data deletion",
        text: "If you submit a request to delete your account, all your data will be removed within 30 days. You can also revoke FormBridge's access at any time from your Google account settings.",
      },
      {
        title: "Contact",
        text: "If you have any questions, please reach out:",
        contact: true,
      },
    ],
    contactBtn: "Contact page",
  },
};

export function PrivacyPage() {
  const { lang } = useLocale();
  const t = copy[lang] || copy.ru;

  return (
    <div className="about-page privacy-page">
      <Breadcrumb items={t.breadcrumb} />
      <section className="about-hero">
        <span className="section-kicker">{t.kicker}</span>
        <h1>{t.title}</h1>
        <p className="privacy-updated">{t.updated}</p>
      </section>

      <div className="privacy-sections">
        {t.sections.map((section) => (
          <section key={section.title} className="privacy-section">
            <h2>{section.title}</h2>
            {section.text ? <p>{section.text}</p> : null}
            {section.items ? (
              <ul className="privacy-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.note ? (
              <p className="privacy-note">{section.note}</p>
            ) : null}
            {section.contact ? (
              <div className="privacy-contact">
                <Link className="primary-btn" to="/contact">
                  {t.contactBtn}
                </Link>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
