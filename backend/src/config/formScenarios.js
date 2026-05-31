export const SCENARIO_IDS = ["universal", "admissions", "hr", "survey", "client_requests", "event"];

export const formScenarios = {
  universal: {
    id: "universal",
    title: { kk: "Жалпылама режим", ru: "Универсальный режим", en: "Universal mode" },
    shortDescription: {
      kk: "Кез келген форма үшін стандартты режим",
      ru: "Стандартный режим для любой формы",
      en: "Standard mode for any form"
    },
    workspaceTitle: { kk: "Өтініштер", ru: "Заявки", en: "Submissions" },
    primaryGoal: {
      kk: "Форма жауаптарын жалпылама өңдеу",
      ru: "Универсальная обработка ответов формы",
      en: "General form responses processing"
    },
    statusFlow: ["new", "in_progress", "done"],
    aiRolePrompt: "You are a CRM assistant helping process form submissions. Analyze the provided form responses and help the user understand and act on them.",
    suggestedQuestions: {
      kk: ["Форма бойынша қысқаша есеп жасаңыз", "Қандай жауаптар назар аударуды қажет ете?", "7 күн ішінде не өзгерді?"],
      ru: ["Сделай краткий отчет по форме", "Какие ответы требуют внимания?", "Что изменилось за последние 7 дней?"],
      en: ["Make a brief report for this form", "Which answers need attention?", "What changed in the last 7 days?"]
    }
  },
  admissions: {
    id: "admissions",
    title: { kk: "Қабылдау комиссиясы", ru: "Приемная комиссия", en: "Admissions" },
    shortDescription: {
      kk: "Колледж/университет өтініштерін өңдеу",
      ru: "Обработка заявок на поступление",
      en: "College / university application processing"
    },
    workspaceTitle: { kk: "Абитуриенттер", ru: "Абитуриенты", en: "Applicants" },
    primaryGoal: {
      kk: "Абитуриент өтініштерін жылдам өңдеу",
      ru: "Быстро обработать заявки абитуриентов",
      en: "Process applicant submissions quickly"
    },
    statusFlow: ["new", "contacted", "documents_needed", "accepted", "rejected"],
    aiRolePrompt: "You are an admissions office assistant. Help process applicant submissions, identify missing documents, prioritize follow-ups, and summarize the applicant pool.",
    suggestedQuestions: {
      kk: ["Абитуриенттер бойынша жиынтық жасаңыз", "Қандай өтініштер байланысуды қажет ете?", "Қандай деректер жетіспейді?"],
      ru: ["Сделай сводку по абитуриентам", "Какие заявки требуют связи?", "Каких данных не хватает?"],
      en: ["Summarize all applicants", "Which applications need follow-up?", "What data is missing?"]
    }
  },
  hr: {
    id: "hr",
    title: { kk: "HR / Рекрутинг", ru: "HR / Рекрутинг", en: "HR / Recruiting" },
    shortDescription: {
      kk: "Үміткерлерді іріктеу және рекрутинг",
      ru: "Отбор кандидатов и рекрутинг",
      en: "Candidate screening and recruiting"
    },
    workspaceTitle: { kk: "Үміткерлер", ru: "Кандидаты", en: "Candidates" },
    primaryGoal: {
      kk: "Үздік үміткерлерді іріктеу",
      ru: "Отобрать подходящих кандидатов",
      en: "Screen and select the best candidates"
    },
    statusFlow: ["new", "shortlisted", "interview", "rejected", "hired"],
    aiRolePrompt: "You are an HR recruiter assistant. Help screen candidates, create shortlists, identify the most promising applicants, and suggest who needs follow-up.",
    suggestedQuestions: {
      kk: ["Үздік үміткерлер кімдер?", "Shortlist жасаңыз", "Қандай үміткерлер нақтылауды қажет ете?"],
      ru: ["Кто лучшие кандидаты?", "Сделай shortlist", "Какие кандидаты требуют уточнения?"],
      en: ["Who are the top candidates?", "Make a shortlist", "Which candidates need clarification?"]
    }
  },
  survey: {
    id: "survey",
    title: { kk: "Сауалнама", ru: "Опрос", en: "Survey" },
    shortDescription: {
      kk: "Сауалнама және зерттеу нәтижелерін талдау",
      ru: "Анализ результатов опроса и исследования",
      en: "Survey and research results analysis"
    },
    workspaceTitle: { kk: "Жауаптар", ru: "Ответы", en: "Responses" },
    primaryGoal: {
      kk: "Сауалнама нәтижелерін түсіну және қорытынды шығару",
      ru: "Понять результаты опроса и сформировать выводы",
      en: "Understand survey results and draw conclusions"
    },
    statusFlow: [],
    aiRolePrompt: "You are a survey analysis assistant. Analyze the form responses, find patterns, identify the most common answers, and prepare clear, structured conclusions and summaries.",
    suggestedQuestions: {
      kk: ["Сауалнама бойынша қорытынды жасаңыз", "Қандай жауаптар жиі кездеседі?", "Есеп мәтінін дайындаңыз"],
      ru: ["Сделай выводы по опросу", "Какие ответы встречаются чаще всего?", "Подготовь текст отчета"],
      en: ["Summarize the survey results", "What are the most common answers?", "Prepare a report"]
    }
  },
  client_requests: {
    id: "client_requests",
    title: { kk: "Клиент өтініштері", ru: "Клиентские заявки", en: "Client requests" },
    shortDescription: {
      kk: "Клиент өтініштерін және тапсырыстарды өңдеу",
      ru: "Обработка клиентских заявок и обращений",
      en: "Client request and order processing"
    },
    workspaceTitle: { kk: "Клиент өтініштері", ru: "Заявки клиентов", en: "Client requests" },
    primaryGoal: {
      kk: "Клиент өтініштерін жоғалтпау",
      ru: "Не потерять клиентские обращения",
      en: "Never miss a client request"
    },
    statusFlow: ["new", "urgent", "in_progress", "waiting_client", "done"],
    aiRolePrompt: "You are a customer support assistant. Help prioritize urgent client requests, summarize the support queue, and identify who needs the most immediate response.",
    suggestedQuestions: {
      kk: ["Қандай өтініштер шұғыл?", "Менеджерге жиынтық жасаңыз", "Кімге бірінші жауап беру керек?"],
      ru: ["Какие заявки срочные?", "Сделай сводку для менеджера", "Кому нужно ответить первым?"],
      en: ["Which requests are urgent?", "Make a manager summary", "Who needs a reply first?"]
    }
  },
  event: {
    id: "event",
    title: { kk: "Іс-шара тіркеу", ru: "Регистрация на мероприятие", en: "Event registration" },
    shortDescription: {
      kk: "Іс-шараға қатысушыларды тіркеу",
      ru: "Управление регистрациями участников",
      en: "Manage event participant registrations"
    },
    workspaceTitle: { kk: "Қатысушылар", ru: "Участники", en: "Participants" },
    primaryGoal: {
      kk: "Іс-шара қатысушыларын басқару",
      ru: "Управлять регистрациями участников",
      en: "Manage event registrations efficiently"
    },
    statusFlow: ["new", "confirmed", "waiting_payment", "cancelled", "attended"],
    aiRolePrompt: "You are an event coordinator assistant. Help manage participant registrations, identify who needs confirmation, and prepare organizer reports and lists.",
    suggestedQuestions: {
      kk: ["Қанша қатысушы тіркелді?", "Кімдерді растау керек?", "Ұйымдастырушыға тізім жасаңыз"],
      ru: ["Сколько участников зарегистрировалось?", "Кого нужно подтвердить?", "Сделай список для организатора"],
      en: ["How many registered?", "Who needs confirmation?", "Make a list for the organizer"]
    }
  }
};

export function getScenario(id) {
  return formScenarios[id] || formScenarios.universal;
}
