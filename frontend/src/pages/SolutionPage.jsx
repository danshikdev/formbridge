import { Link, Navigate, useParams } from "react-router-dom";
import { AcademicCapIcon, BriefcaseIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useLocale } from "../shared/useLocale";

const solutionCopy = {
  kk: {
    back: "Басты бетке қайту",
    connect: "Форманы қосу",
    preparing: "Бұл бетке толық сипаттама кейін қосылады. Қазір маршрут пен негізгі құрылым дайын.",
    items: {
      education: {
        label: "Шешім",
        title: "Білім беру",
        subtitle: "Қабылдау комиссиясы, студенттік өтініштер және кері байланыс формалары үшін.",
        bullets: ["Қабылдау өтініштері", "Статустарды басқару", "WhatsApp хабарламалары"]
      },
      business: {
        label: "Шешім",
        title: "Бизнес",
        subtitle: "Клиент өтініштері, тапсырыстар және қолдау сұрақтарын басқаруға арналған.",
        bullets: ["Клиент сұраныстары", "Жауапты адамға бөлу", "Аналитика және есептер"]
      },
      hr: {
        label: "Шешім",
        title: "Кадр бөлімі",
        subtitle: "Үміткер анкеталары, HR сауалнамалары және ішкі процестер үшін.",
        bullets: ["Үміткерлер тізімі", "Сұхбат кезеңдері", "ЖИ қысқаша талдау"]
      }
    }
  },
  ru: {
    back: "Вернуться на главную",
    connect: "Подключить форму",
    preparing: "Подробное описание будет добавлено позже. Сейчас готов маршрут и базовая структура страницы.",
    items: {
      education: {
        label: "Решение",
        title: "Образование",
        subtitle: "Для приемной комиссии, студенческих заявок и форм обратной связи.",
        bullets: ["Заявки абитуриентов", "Управление статусами", "WhatsApp-уведомления"]
      },
      business: {
        label: "Решение",
        title: "Бизнес",
        subtitle: "Для клиентских заявок, заказов и обращений в поддержку.",
        bullets: ["Клиентские запросы", "Назначение ответственного", "Аналитика и отчеты"]
      },
      hr: {
        label: "Решение",
        title: "HR",
        subtitle: "Для анкет кандидатов, HR-опросов и внутренних процессов.",
        bullets: ["Список кандидатов", "Этапы интервью", "Краткий AI-анализ"]
      }
    }
  },
  en: {
    back: "Back to home",
    connect: "Connect form",
    preparing: "Detailed content will be added later. The route and base page structure are ready now.",
    items: {
      education: {
        label: "Solution",
        title: "Education",
        subtitle: "For admissions, student requests and feedback forms.",
        bullets: ["Admissions requests", "Status management", "WhatsApp notifications"]
      },
      business: {
        label: "Solution",
        title: "Business",
        subtitle: "For client requests, orders and support inquiries.",
        bullets: ["Client inquiries", "Owner assignment", "Analytics and reports"]
      },
      hr: {
        label: "Solution",
        title: "HR",
        subtitle: "For candidate forms, HR surveys and internal workflows.",
        bullets: ["Candidate list", "Interview stages", "Concise AI analysis"]
      }
    }
  }
};

const icons = {
  education: AcademicCapIcon,
  business: BriefcaseIcon,
  hr: UsersIcon
};

export function SolutionPage() {
  const { solutionId } = useParams();
  const { lang } = useLocale();
  const text = solutionCopy[lang] || solutionCopy.kk;
  const item = text.items[solutionId];

  if (!item) return <Navigate to="/" replace />;

  const Icon = icons[solutionId] || AcademicCapIcon;
  const connectTo = localStorage.getItem("fb_token") ? "/forms" : "/login";

  return (
    <section className="solution-page">
      <div className="solution-page-hero">
        <div className="solution-page-icon"><Icon /></div>
        <span className="section-kicker">{item.label}</span>
        <h1>{item.title}</h1>
        <p>{item.subtitle}</p>
        <div className="solution-page-actions">
          <Link className="primary-btn home-primary" to={connectTo}>{text.connect}</Link>
          <Link className="ghost-btn" to="/">{text.back}</Link>
        </div>
      </div>

      <div className="solution-page-card">
        <p>{text.preparing}</p>
        <div>
          {item.bullets.map((bullet) => <span key={bullet}>{bullet}</span>)}
        </div>
      </div>
    </section>
  );
}
