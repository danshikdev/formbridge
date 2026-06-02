import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  AcademicCapIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useLocale } from "../shared/useLocale";
import { Breadcrumb } from "../shared/Breadcrumb";

const SOL_NAV = { kk: "Шешімдер", ru: "Решения", en: "Solutions" };

const STATUS_COLOR = {
  new: "blue",
  in_progress: "amber",
  done: "green",
  contacted: "amber",
  documents_needed: "purple",
  accepted: "green",
  rejected: "red",
  shortlisted: "amber",
  interview: "amber",
  hired: "green",
  urgent: "red",
  waiting_client: "purple",
  confirmed: "green",
  waiting_payment: "purple",
  cancelled: "red",
  attended: "green",
};

const STATUS_LABELS = {
  kk: {
    new: "Жаңа", in_progress: "Орындалуда", done: "Аяқталды",
    contacted: "Байланысылды", documents_needed: "Құжат қажет",
    accepted: "Қабылданды", rejected: "Қабылданбады",
    shortlisted: "Іріктелді", interview: "Сұхбат", hired: "Жұмысқа алынды",
    urgent: "Шұғыл", waiting_client: "Клиент күтуде",
    confirmed: "Расталды", waiting_payment: "Төлем күтуде",
    cancelled: "Болдырылмады", attended: "Қатысты",
  },
  ru: {
    new: "Новая", in_progress: "В работе", done: "Завершено",
    contacted: "Связались", documents_needed: "Нужны документы",
    accepted: "Принят", rejected: "Отклонён",
    shortlisted: "В шортлисте", interview: "Интервью", hired: "Нанят",
    urgent: "Срочно", waiting_client: "Ожидает клиента",
    confirmed: "Подтверждён", waiting_payment: "Ожидает оплаты",
    cancelled: "Отменён", attended: "Присутствовал",
  },
  en: {
    new: "New", in_progress: "In progress", done: "Done",
    contacted: "Contacted", documents_needed: "Docs needed",
    accepted: "Accepted", rejected: "Rejected",
    shortlisted: "Shortlisted", interview: "Interview", hired: "Hired",
    urgent: "Urgent", waiting_client: "Waiting client",
    confirmed: "Confirmed", waiting_payment: "Awaiting payment",
    cancelled: "Cancelled", attended: "Attended",
  },
};

const AI_DEMOS = {
  universal: {
    kk: {
      question: "Қандай жауаптар назар аударуды қажет етеді?",
      answer: [
        "3 жауапты бірінші қарау керек:",
        "1. Байланыс нөмірі көрсетілмеген өтініш.",
        "2. Комментарийде шұғыл жауап сұралған өтініш.",
        "3. Толық емес дерекпен жіберілген форма."
      ]
    },
    ru: {
      question: "Какие ответы требуют внимания?",
      answer: [
        "Сначала стоит проверить 3 ответа:",
        "1. Заявка без телефона для связи.",
        "2. Ответ, где в комментарии просят срочно связаться.",
        "3. Форма с неполными данными."
      ]
    },
    en: {
      question: "Which answers need attention?",
      answer: [
        "Review these 3 submissions first:",
        "1. A request without a contact phone.",
        "2. A response marked as urgent in the comment.",
        "3. A form submission with incomplete details."
      ]
    }
  },
  admissions: {
    kk: {
      question: "Қандай абитуриенттерге бірінші хабарласу керек?",
      answer: [
        "Бірінші 2 абитуриентке хабарласқан дұрыс:",
        "1. Нурислам Бекенов — фото 3x4 жетіспейді.",
        "2. Айгерим Садыкова — аттестат пен фото керек.",
        "Қалған толық құжаттары бар өтініштерді қабылдау кезеңіне өткізуге болады."
      ]
    },
    ru: {
      question: "С кем из абитуриентов связаться первым?",
      answer: [
        "В первую очередь свяжитесь с 2 абитуриентами:",
        "1. Нурислам Бекенов — не хватает фото 3x4.",
        "2. Айгерим Садыкова — нужен аттестат и фото.",
        "Заявки с полным пакетом документов можно переводить к решению."
      ]
    },
    en: {
      question: "Which applicants should we contact first?",
      answer: [
        "Contact these 2 applicants first:",
        "1. Nurislam Bekenov — missing a 3x4 photo.",
        "2. Aigerim Sadykova — needs transcript and photo.",
        "Applications with complete documents can move to review."
      ]
    }
  },
  hr: {
    kk: {
      question: "Shortlist үшін ең мықты кандидаттар кімдер?",
      answer: [
        "Shortlist-ке 3 кандидатты ұсынуға болады:",
        "1. Дана Ахметова — тәжірибесі релевантты, портфолио дайын.",
        "2. Арман Қасым — техникалық дағдылары жақсы.",
        "3. Алия Тулегенова — коммуникациясы және мотивациясы жоғары."
      ]
    },
    ru: {
      question: "Кого добавить в shortlist?",
      answer: [
        "В shortlist лучше добавить 3 кандидатов:",
        "1. Дана Ахметова — релевантный опыт и готовое портфолио.",
        "2. Арман Касым — сильные технические навыки.",
        "3. Алия Тулегенова — высокая мотивация и хорошая коммуникация."
      ]
    },
    en: {
      question: "Who should be shortlisted?",
      answer: [
        "I would shortlist 3 candidates:",
        "1. Dana Akhmetova — relevant experience and portfolio.",
        "2. Arman Kasym — strong technical skills.",
        "3. Aliya Tulegenova — high motivation and clear communication."
      ]
    }
  },
  survey: {
    kk: {
      question: "Сауалнама бойынша негізгі қорытынды қандай?",
      answer: [
        "Негізгі қорытынды:",
        "Көпшілік қызмет жылдамдығын жақсы бағалаған, бірақ қолдау жауаптарының уақытына шағым бар.",
        "Ұсыныс: FAQ қосып, күрделі сұрақтарға жауап беру уақытын қысқарту."
      ]
    },
    ru: {
      question: "Какой главный вывод по опросу?",
      answer: [
        "Главный вывод:",
        "Большинство довольны скоростью сервиса, но есть жалобы на время ответа поддержки.",
        "Рекомендация: добавить FAQ и сократить время реакции на сложные вопросы."
      ]
    },
    en: {
      question: "What is the main survey insight?",
      answer: [
        "Main insight:",
        "Most respondents like the service speed, but support response time is a recurring issue.",
        "Recommendation: add an FAQ and reduce response time for complex questions."
      ]
    }
  },
  client_requests: {
    kk: {
      question: "Қандай өтініштер шұғыл?",
      answer: [
        "2 өтініш шұғыл болып көрінеді:",
        "1. Төлем жасалған, бірақ тапсырыс статусы жаңармаған.",
        "2. Клиент бүгін жеткізу керек екенін жазған.",
        "Бірінші осы екеуіне жауап берген дұрыс."
      ]
    },
    ru: {
      question: "Какие заявки срочные?",
      answer: [
        "Срочными выглядят 2 заявки:",
        "1. Клиент оплатил заказ, но статус не обновился.",
        "2. Клиент указал, что доставка нужна сегодня.",
        "Лучше ответить им первыми."
      ]
    },
    en: {
      question: "Which requests are urgent?",
      answer: [
        "2 requests look urgent:",
        "1. The client paid, but the order status was not updated.",
        "2. The client says delivery is needed today.",
        "Reply to these first."
      ]
    }
  },
  event: {
    kk: {
      question: "Кімдерді растау керек?",
      answer: [
        "Растау керек қатысушылар:",
        "1. 4 адам төлемді күтіп тұр.",
        "2. 2 адам байланыс нөмірін толық жазбаған.",
        "Ұйымдастырушыға confirmed тізімін бөлек жіберуге болады."
      ]
    },
    ru: {
      question: "Кого нужно подтвердить?",
      answer: [
        "Нужно подтвердить несколько участников:",
        "1. 4 человека ожидают проверки оплаты.",
        "2. У 2 участников неполный номер телефона.",
        "Список confirmed можно отдельно отправить организатору."
      ]
    },
    en: {
      question: "Who needs confirmation?",
      answer: [
        "Several participants need confirmation:",
        "1. 4 people are waiting for payment verification.",
        "2. 2 participants have incomplete phone numbers.",
        "The confirmed list can be sent to the organizer separately."
      ]
    }
  }
};

const SCENARIOS = {
  universal: {
    Icon: Squares2X2Icon,
    kk: {
      title: "Жалпылама режим",
      subtitle: "Кез келген форма үшін стандартты шешім — өтініштерді бақылау, ЖИ талдау және есеп алу.",
      statusFlow: ["new", "in_progress", "done"],
      statusTitle: "Статустар жолы",
      statusDesc: "Жаңа өтініш → өңдеу → аяқталды. Қарапайым, бірақ тиімді.",
      benefits: [
        [DocumentTextIcon, "Кез келген форма", "Тіркеу, кері байланыс, сауалнама — кез келген Google Forms жұмыс жасайды."],
        [SparklesIcon, "ЖИ талдау", "Форма жауаптарын кез келген сұрақ бойынша AI арқылы талдаңыз."],
        [CheckCircleIcon, "Есеп шығарыңыз", "Word немесе Excel форматтарында бір шертумен есеп алыңыз."],
      ],
      aiTitle: "ЖИ кемекші бұл сценарийде не жасайды?",
      aiFeatures: [
        "«Қандай жауаптар назар аударуды қажет ете?» — AI тез жауап береді",
        "Соңғы 7 күн ішіндегі өзгерістерді талдайды",
        "Форма бойынша қысқаша есеп мәтінін дайындайды",
        "Деректерден паттерн табып, ұсыныстар береді",
      ],
      connectLabel: "Форманы қосу",
      backLabel: "Басты бетке",
    },
    ru: {
      title: "Универсальный режим",
      subtitle: "Стандартное решение для любой формы — управление заявками, AI-анализ и отчёты.",
      statusFlow: ["new", "in_progress", "done"],
      statusTitle: "Статусы",
      statusDesc: "Новая заявка → в работе → завершено. Просто и эффективно.",
      benefits: [
        [DocumentTextIcon, "Любая форма", "Регистрации, обратная связь, опросы — работает с любым Google Forms."],
        [SparklesIcon, "AI-анализ", "Анализируйте ответы формы с помощью AI по любому вопросу."],
        [CheckCircleIcon, "Отчёты", "Получайте отчёт в Word или Excel одним нажатием."],
      ],
      aiTitle: "Что делает ЖИ-помощник в этом сценарии?",
      aiFeatures: [
        "«Какие ответы требуют внимания?» — AI отвечает быстро",
        "Анализирует изменения за последние 7 дней",
        "Готовит краткий текст отчёта по форме",
        "Находит паттерны в данных и даёт рекомендации",
      ],
      connectLabel: "Подключить форму",
      backLabel: "На главную",
    },
    en: {
      title: "Universal mode",
      subtitle: "Standard solution for any form — track submissions, AI analysis and reports.",
      statusFlow: ["new", "in_progress", "done"],
      statusTitle: "Status flow",
      statusDesc: "New submission → in progress → done. Simple and effective.",
      benefits: [
        [DocumentTextIcon, "Any form", "Registrations, feedback, surveys — works with any Google Forms."],
        [SparklesIcon, "AI analysis", "Analyze form responses with AI on any question you have."],
        [CheckCircleIcon, "Reports", "Export reports to Word or Excel in one click."],
      ],
      aiTitle: "What does the AI Assistant do here?",
      aiFeatures: [
        "\"Which answers need attention?\" — AI answers instantly",
        "Analyzes changes over the last 7 days",
        "Prepares a brief report text for the form",
        "Finds patterns in the data and provides recommendations",
      ],
      connectLabel: "Connect form",
      backLabel: "Home",
    },
  },

  admissions: {
    Icon: AcademicCapIcon,
    kk: {
      title: "Қабылдау комиссиясы",
      subtitle: "Абитуриент өтініштерін жылдам өңдеп, қабылдау процесін толық бақылаңыз.",
      statusFlow: ["new", "contacted", "documents_needed", "accepted", "rejected"],
      statusTitle: "Абитуриент статустары",
      statusDesc: "Жаңа өтінімді қабылдаудан бас тартуға дейінгі толық процес бір экранда.",
      benefits: [
        [AcademicCapIcon, "Абитуриент тізімі", "Барлық өтінімдер бір жерде — статус, аты, байланыс деректері."],
        [SparklesIcon, "ЖИ деректерді тексереді", "Жетіспейтін деректерді анықтап, кімге хабарласу керектігін айтады."],
        [CheckCircleIcon, "WhatsApp хабарлама", "Автоматты түрде абитуриентке статус туралы хабарлама жіберіңіз."],
      ],
      aiTitle: "ЖИ кемекші бұл сценарийде не жасайды?",
      aiFeatures: [
        "Жетіспейтін деректер бар өтініштерді автоматты анықтайды",
        "«Кімге бірінші хабарласу керек?» деген сұраққа жауап береді",
        "Абитуриенттер бойынша жиынтық есеп дайындайды",
        "Қабылдау статистикасын — қанша қабылданды, қанша бас тартылды — талдайды",
      ],
      connectLabel: "Форманы қосу",
      backLabel: "Басты бетке",
    },
    ru: {
      title: "Приемная комиссия",
      subtitle: "Быстро обрабатывайте заявки абитуриентов и полностью контролируйте процесс поступления.",
      statusFlow: ["new", "contacted", "documents_needed", "accepted", "rejected"],
      statusTitle: "Статусы абитуриентов",
      statusDesc: "Полный процесс от новой заявки до решения о приёме на одном экране.",
      benefits: [
        [AcademicCapIcon, "Список абитуриентов", "Все заявки в одном месте — статус, имя, контакты."],
        [SparklesIcon, "AI проверяет данные", "Выявляет недостающие данные и подсказывает, кому нужно позвонить."],
        [CheckCircleIcon, "WhatsApp уведомления", "Автоматически отправляйте абитуриенту сообщения о статусе."],
      ],
      aiTitle: "Что делает ЖИ-помощник в этом сценарии?",
      aiFeatures: [
        "Автоматически определяет заявки с неполными данными",
        "Отвечает на вопрос «С кем нужно связаться первым?»",
        "Готовит сводный отчёт по всем абитуриентам",
        "Анализирует статистику приёма — сколько принято, сколько отклонено",
      ],
      connectLabel: "Подключить форму",
      backLabel: "На главную",
    },
    en: {
      title: "Admissions",
      subtitle: "Process applicant submissions quickly and fully control the admissions workflow.",
      statusFlow: ["new", "contacted", "documents_needed", "accepted", "rejected"],
      statusTitle: "Applicant statuses",
      statusDesc: "Full process from new application to admission decision on one screen.",
      benefits: [
        [AcademicCapIcon, "Applicant list", "All submissions in one place — status, name, contact details."],
        [SparklesIcon, "AI checks data", "Identifies missing information and suggests who to contact first."],
        [CheckCircleIcon, "WhatsApp notifications", "Automatically send status messages to applicants."],
      ],
      aiTitle: "What does the AI Assistant do here?",
      aiFeatures: [
        "Automatically identifies incomplete applications",
        "Answers \"Who should we contact first?\"",
        "Prepares a summary report for all applicants",
        "Analyzes admission statistics — accepted vs rejected breakdown",
      ],
      connectLabel: "Connect form",
      backLabel: "Home",
    },
  },

  hr: {
    Icon: UsersIcon,
    kk: {
      title: "HR / Рекрутинг",
      subtitle: "Үміткерлерді іріктеп, shortlist жасаңыз — ЖИ ең үздік кандидатты автоматты табады.",
      statusFlow: ["new", "shortlisted", "interview", "hired", "rejected"],
      statusTitle: "Рекрутинг кезеңдері",
      statusDesc: "Жаңа өтінімнен жұмысқа алуға дейінгі барлық кезеңдер бір жерде.",
      benefits: [
        [UsersIcon, "Үміткер тізімі", "Барлық кандидаттар бір жерде — аты, деректері, статусы."],
        [SparklesIcon, "ЖИ shortlist жасайды", "AI ең үздік үміткерлерді іріктеп, shortlist ұсынады."],
        [CheckCircleIcon, "Кезеңдерді бақылаңыз", "Сұхбат кестесін жасап, кімнің қандай кезеңде тұрғанын біліңіз."],
      ],
      aiTitle: "ЖИ кемекші бұл сценарийде не жасайды?",
      aiFeatures: [
        "«Ең үздік 5 кандидат кімдер?» деп сұрасаңыз — AI тізім береді",
        "Жетіспейтін деректері бар анкеталарды анықтайды",
        "Shortlist мәтінін немесе есебін дайындайды",
        "«Кімге бірінші хабарласу керек?» деп сұрасаңыз — жауап береді",
      ],
      connectLabel: "Форманы қосу",
      backLabel: "Басты бетке",
    },
    ru: {
      title: "HR / Рекрутинг",
      subtitle: "Отбирайте кандидатов и создавайте шортлисты — AI автоматически находит лучших.",
      statusFlow: ["new", "shortlisted", "interview", "hired", "rejected"],
      statusTitle: "Этапы рекрутинга",
      statusDesc: "Все этапы от анкеты до найма в одном месте.",
      benefits: [
        [UsersIcon, "Список кандидатов", "Все анкеты в одном месте — имя, данные, статус."],
        [SparklesIcon, "AI делает шортлист", "AI отбирает лучших кандидатов и предлагает шортлист."],
        [CheckCircleIcon, "Следите за этапами", "Создавайте расписание интервью и знайте, кто на каком этапе."],
      ],
      aiTitle: "Что делает ЖИ-помощник в этом сценарии?",
      aiFeatures: [
        "«Кто лучшие 5 кандидатов?» — AI выдаёт список",
        "Находит анкеты с неполными данными",
        "Готовит текст шортлиста или отчёт рекрутера",
        "Отвечает «Кому позвонить первым?»",
      ],
      connectLabel: "Подключить форму",
      backLabel: "На главную",
    },
    en: {
      title: "HR / Recruiting",
      subtitle: "Screen candidates and create shortlists — AI automatically finds the best ones.",
      statusFlow: ["new", "shortlisted", "interview", "hired", "rejected"],
      statusTitle: "Recruiting stages",
      statusDesc: "All stages from application to hire in one place.",
      benefits: [
        [UsersIcon, "Candidate list", "All applications in one place — name, data, status."],
        [SparklesIcon, "AI makes shortlists", "AI screens candidates and suggests a ranked shortlist."],
        [CheckCircleIcon, "Track stages", "Create interview schedules and know who is at which stage."],
      ],
      aiTitle: "What does the AI Assistant do here?",
      aiFeatures: [
        "\"Who are the top 5 candidates?\" — AI provides the list instantly",
        "Finds applications with incomplete data",
        "Prepares a shortlist text or recruiter report",
        "Answers \"Who should we call first?\"",
      ],
      connectLabel: "Connect form",
      backLabel: "Home",
    },
  },

  survey: {
    Icon: ChartBarSquareIcon,
    kk: {
      title: "Сауалнама / Анкета",
      subtitle: "Жауаптарды жай оқымаңыз — ЖИ паттерн табады, диаграммалар жасайды, есеп дайындайды.",
      statusFlow: [],
      statusTitle: "",
      statusDesc: "",
      benefits: [
        [ChartBarSquareIcon, "Жауап диаграммалары", "Әр сұрақ бойынша жауаптар автоматты диаграммаға айналады."],
        [SparklesIcon, "ЖИ қорытынды", "AI жауаптарды талдап, маңызды тенденцияларды бөліп алады."],
        [CheckCircleIcon, "Есеп экспорты", "Сауалнама нәтижелерін Word немесе Excel форматтарында алыңыз."],
      ],
      aiTitle: "ЖИ кемекші бұл сценарийде не жасайды?",
      aiFeatures: [
        "«Қандай жауаптар жиі кездеседі?» деп сұрасаңыз — AI статистика береді",
        "Жауаптардан паттерн табады, топтастырады",
        "«Сауалнама бойынша есеп мәтінін дайындаңыз» деп сұрасаңыз — AI жазады",
        "Белгілі бір жауап топтарын қолмен іздемей тауып береді",
      ],
      connectLabel: "Форманы қосу",
      backLabel: "Басты бетке",
    },
    ru: {
      title: "Опрос / Анкета",
      subtitle: "Не читайте ответы вручную — AI находит паттерны, строит графики и готовит выводы.",
      statusFlow: [],
      statusTitle: "",
      statusDesc: "",
      benefits: [
        [ChartBarSquareIcon, "Графики ответов", "Ответы по каждому вопросу автоматически превращаются в диаграммы."],
        [SparklesIcon, "AI-выводы", "AI анализирует ответы и выделяет ключевые тенденции."],
        [CheckCircleIcon, "Экспорт отчёта", "Результаты опроса в Word или Excel одним кликом."],
      ],
      aiTitle: "Что делает ЖИ-помощник в этом сценарии?",
      aiFeatures: [
        "«Какие ответы встречаются чаще всего?» — AI даёт статистику",
        "Находит паттерны в ответах и группирует их",
        "«Подготовь текст отчёта по опросу» — AI пишет выводы",
        "Находит нужные группы ответов без ручного поиска",
      ],
      connectLabel: "Подключить форму",
      backLabel: "На главную",
    },
    en: {
      title: "Survey / Questionnaire",
      subtitle: "Don't read responses manually — AI finds patterns, builds charts and writes conclusions.",
      statusFlow: [],
      statusTitle: "",
      statusDesc: "",
      benefits: [
        [ChartBarSquareIcon, "Answer charts", "Responses per question automatically turn into charts."],
        [SparklesIcon, "AI conclusions", "AI analyzes responses and highlights key trends."],
        [CheckCircleIcon, "Report export", "Get survey results in Word or Excel in one click."],
      ],
      aiTitle: "What does the AI Assistant do here?",
      aiFeatures: [
        "\"What answers appear most?\" — AI provides the statistics instantly",
        "Finds patterns in responses and groups them by theme",
        "\"Write a report for this survey\" — AI prepares the conclusions",
        "Finds specific answer groups without any manual searching",
      ],
      connectLabel: "Connect form",
      backLabel: "Home",
    },
  },

  client_requests: {
    Icon: BriefcaseIcon,
    kk: {
      title: "Клиент өтініштері",
      subtitle: "Клиент хабарларын жоғалтпаңыз — шұғылдарды бірінші өңдеп, барлық процесті бақылаңыз.",
      statusFlow: ["new", "urgent", "in_progress", "waiting_client", "done"],
      statusTitle: "Өтініш статустары",
      statusDesc: "Жаңа өтінімнен шешімге дейін — шұғылдар автоматты бөлінеді.",
      benefits: [
        [BriefcaseIcon, "Шұғыл белгілеу", "ЖИ шұғыл өтініштерді анықтап, бірінші орынға шығарады."],
        [UsersIcon, "Жауапты бөлу", "Өтінімдерді жауапты адамдарға бөліп, кімде не тұрғанын біліңіз."],
        [CheckCircleIcon, "Клиент тарихы", "Бір клиенттің барлық өтініштері бір жерде — тарихы сақталады."],
      ],
      aiTitle: "ЖИ кемекші бұл сценарийде не жасайды?",
      aiFeatures: [
        "«Қандай өтініштер шұғыл?» деп сұрасаңыз — AI тізімдейді",
        "Менеджерге ауысым сводкасын дайындайды",
        "«Кімге бірінші жауап беру керек?» деп сұрасаңыз — жауап береді",
        "Кешіктірілген өтініштерді анықтап, хабарлайды",
      ],
      connectLabel: "Форманы қосу",
      backLabel: "Басты бетке",
    },
    ru: {
      title: "Клиентские заявки",
      subtitle: "Не теряйте клиентские обращения — срочные обрабатывайте первыми, следите за всем процессом.",
      statusFlow: ["new", "urgent", "in_progress", "waiting_client", "done"],
      statusTitle: "Статусы заявок",
      statusDesc: "От новой заявки до решения — срочные выделяются автоматически.",
      benefits: [
        [BriefcaseIcon, "Маркировка срочных", "AI определяет срочные заявки и выводит их первыми в очереди."],
        [UsersIcon, "Назначение ответственного", "Распределяйте заявки и знайте, кто за что отвечает."],
        [CheckCircleIcon, "История клиента", "Все заявки одного клиента в одном месте, история сохраняется."],
      ],
      aiTitle: "Что делает ЖИ-помощник в этом сценарии?",
      aiFeatures: [
        "«Какие заявки срочные?» — AI выдаёт приоритетный список",
        "Готовит сводку для менеджера на смену",
        "Отвечает «Кому нужно ответить первым?»",
        "Выявляет просроченные заявки и сообщает об этом",
      ],
      connectLabel: "Подключить форму",
      backLabel: "На главную",
    },
    en: {
      title: "Client requests",
      subtitle: "Never miss a client request — handle urgent ones first and track the full process.",
      statusFlow: ["new", "urgent", "in_progress", "waiting_client", "done"],
      statusTitle: "Request statuses",
      statusDesc: "From new request to resolution — urgent ones are flagged automatically.",
      benefits: [
        [BriefcaseIcon, "Urgent flagging", "AI identifies urgent requests and surfaces them first in the queue."],
        [UsersIcon, "Owner assignment", "Assign requests and always know who is responsible for what."],
        [CheckCircleIcon, "Client history", "All requests from one client in one place, history preserved."],
      ],
      aiTitle: "What does the AI Assistant do here?",
      aiFeatures: [
        "\"Which requests are urgent?\" — AI lists them with priority",
        "Prepares a shift handover summary for the manager",
        "Answers \"Who needs a reply first?\"",
        "Identifies overdue requests and alerts the team",
      ],
      connectLabel: "Connect form",
      backLabel: "Home",
    },
  },

  event: {
    Icon: CalendarDaysIcon,
    kk: {
      title: "Іс-шара тіркеу",
      subtitle: "Қатысушылар тізімін басқарыңыз, растаңыз, есеп алыңыз — барлығы бір жұмыс кеңістігінде.",
      statusFlow: ["new", "confirmed", "waiting_payment", "attended", "cancelled"],
      statusTitle: "Қатысушы статустары",
      statusDesc: "Тіркелуден іс-шараға қатысуға дейінгі толық процес.",
      benefits: [
        [CalendarDaysIcon, "Қатысушылар тізімі", "Тіркелген барлық адамдар — аты, байланысы, статусы бір жерде."],
        [CheckCircleIcon, "Растау хабарламасы", "WhatsApp арқылы қатысушыға автоматты растау жіберіңіз."],
        [SparklesIcon, "ЖИ есеп", "«Қанша адам тіркелді?» деп сұрасаңыз — AI бірден жауап береді."],
      ],
      aiTitle: "ЖИ кемекші бұл сценарийде не жасайды?",
      aiFeatures: [
        "«Қанша қатысушы тіркелді?» деп сұрасаңыз — AI жауап береді",
        "Кімдерді растау керектігін анықтайды",
        "Ұйымдастырушыға қатысушылар тізімін дайындайды",
        "Төлемін күтіп тұрған қатысушыларды бөліп алады",
      ],
      connectLabel: "Форманы қосу",
      backLabel: "Басты бетке",
    },
    ru: {
      title: "Регистрация на мероприятие",
      subtitle: "Управляйте списком участников, подтверждайте, получайте отчёты — всё в одном пространстве.",
      statusFlow: ["new", "confirmed", "waiting_payment", "attended", "cancelled"],
      statusTitle: "Статусы участников",
      statusDesc: "Полный процесс от регистрации до участия в мероприятии.",
      benefits: [
        [CalendarDaysIcon, "Список участников", "Все зарегистрированные — имя, контакт, статус в одном месте."],
        [CheckCircleIcon, "Подтверждение", "Отправляйте автоматическое подтверждение через WhatsApp."],
        [SparklesIcon, "AI-отчёт", "«Сколько зарегистрировалось?» — AI отвечает мгновенно."],
      ],
      aiTitle: "Что делает ЖИ-помощник в этом сценарии?",
      aiFeatures: [
        "«Сколько участников зарегистрировалось?» — AI отвечает сразу",
        "Определяет, кого нужно подтвердить",
        "Готовит список участников для организатора",
        "Выделяет участников, ожидающих оплаты",
      ],
      connectLabel: "Подключить форму",
      backLabel: "На главную",
    },
    en: {
      title: "Event registration",
      subtitle: "Manage participant lists, send confirmations and get reports — all in one workspace.",
      statusFlow: ["new", "confirmed", "waiting_payment", "attended", "cancelled"],
      statusTitle: "Participant statuses",
      statusDesc: "Full process from registration to event attendance.",
      benefits: [
        [CalendarDaysIcon, "Participant list", "All registered people — name, contact, status in one place."],
        [CheckCircleIcon, "Confirmation", "Automatically send WhatsApp confirmations to participants."],
        [SparklesIcon, "AI report", "\"How many registered?\" — AI answers instantly."],
      ],
      aiTitle: "What does the AI Assistant do here?",
      aiFeatures: [
        "\"How many participants registered?\" — AI responds immediately",
        "Identifies who still needs confirmation",
        "Prepares a participant list for the event organizer",
        "Flags participants waiting for payment confirmation",
      ],
      connectLabel: "Connect form",
      backLabel: "Home",
    },
  },
};

function SolutionAiDemo({ scenarioId, lang }) {
  const demo = AI_DEMOS[scenarioId]?.[lang] || AI_DEMOS[scenarioId]?.kk || AI_DEMOS.universal.kk;

  return (
    <div className="sol-ai-demo" aria-label="AI Assistant demo">
      <div className="sol-ai-demo-top">
        <span>FormBridge AI</span>
        <i>{lang === "ru" ? "Демо" : lang === "en" ? "Demo" : "Демо"}</i>
      </div>
      <div className="sol-ai-demo-chat">
        <div className="sol-ai-demo-message sol-ai-demo-message--user">
          {demo.question}
        </div>
        <div className="sol-ai-demo-message sol-ai-demo-message--assistant">
          {demo.answer.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status, lang }) {
  const labels = STATUS_LABELS[lang] || STATUS_LABELS.kk;
  const color = STATUS_COLOR[status] || "gray";
  return (
    <span className={`sol-status-pill sol-status-pill--${color}`}>
      {labels[status] || status}
    </span>
  );
}

export function SolutionPage() {
  const { solutionId } = useParams();
  const { lang } = useLocale();
  const scenario = SCENARIOS[solutionId];

  if (!scenario) return <Navigate to="/" replace />;

  const { Icon } = scenario;
  const s = scenario[lang] || scenario.kk;
  const connectTo = localStorage.getItem("fb_token") ? "/forms" : "/login";

  return (
    <section className="sol-page">

      <Breadcrumb items={[["FormBridge", "/"], [SOL_NAV[lang] || "Solutions", "/#solutions"], [s.title]]} />

      {/* Hero */}
      <div className="sol-hero">
        <div className="sol-hero-icon"><Icon /></div>
        <h1>{s.title}</h1>
        <p className="sol-hero-sub">{s.subtitle}</p>
        <div className="sol-hero-actions">
          <Link className="primary-btn home-primary" to={connectTo}>{s.connectLabel}</Link>
          <Link className="ghost-btn" to="/">← {s.backLabel}</Link>
        </div>
      </div>

      {/* Benefits */}
      <div className="sol-benefits">
        {s.benefits.map(([BenIcon, title, desc]) => (
          <div key={title} className="sol-benefit-card">
            <div className="sol-benefit-icon"><BenIcon /></div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>

      {/* Status flow */}
      {s.statusFlow.length > 0 && (
        <div className="sol-statuses">
          <div className="sol-statuses-head">
            <h2>{s.statusTitle}</h2>
            <p>{s.statusDesc}</p>
          </div>
          <div className="sol-statuses-flow">
            {s.statusFlow.map((st, i) => (
              <React.Fragment key={st}>
                <StatusPill status={st} lang={lang} />
                {i < s.statusFlow.length - 1 && <span className="sol-status-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* AI block */}
      <div className="sol-ai">
        <div className="sol-ai-copy">
          <div className="sol-ai-badge"><SparklesIcon /><span>ЖИ кемекші</span></div>
          <h2>{s.aiTitle}</h2>
          <ul className="sol-ai-features">
            {s.aiFeatures.map((f) => (
              <li key={f}>
                <CheckCircleIcon />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sol-ai-screenshot">
          <SolutionAiDemo scenarioId={solutionId} lang={lang} />
        </div>
      </div>

      {/* CTA */}
      <div className="sol-cta">
        <h2>{s.title}</h2>
        <p>{s.subtitle}</p>
        <div className="sol-cta-actions">
          <Link className="primary-btn home-primary" to={connectTo}>{s.connectLabel}</Link>
          <Link className="ghost-btn" to="/">← {s.backLabel}</Link>
        </div>
      </div>

    </section>
  );
}
