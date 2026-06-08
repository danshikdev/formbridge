import "../models/associations.js";
import { sequelize } from "../config/database.js";
import { env } from "../config/env.js";
import { User } from "../models/user.js";
import { FormIntegration } from "../models/formIntegration.js";
import { Request } from "../models/request.js";

const targetEmail = process.env.DEMO_USER_EMAIL || "erdana.tursunov@gmail.com";
const baseSubmittedAt = new Date("2026-05-20T09:00:00+05:00");

const people = [
  ["Алия Тулегенова", "aliya.tulegenova@example.kz", "+7 701 245 18 33"],
  ["Нурислам Бекенов", "nurislam.bekenov@example.kz", "+7 777 504 91 20"],
  ["Дана Ахметова", "dana.akhmetova@example.kz", "+7 705 831 44 09"],
  ["Еркебулан Оразов", "erkebulan.orazov@example.kz", "+7 747 632 77 11"],
  ["Айгерим Садыкова", "aigerim.sadykova@example.kz", "+7 702 119 60 54"],
  ["Арман Касым", "arman.kasym@example.kz", "+7 778 220 15 88"],
  ["Мадина Ибраева", "madina.ibraeva@example.kz", "+7 700 918 33 27"],
  ["Самат Жумабаев", "samat.zhumabayev@example.kz", "+7 707 450 02 19"],
  ["Жанель Нурпеисова", "zhanel.nurpeisova@example.kz", "+7 701 774 65 32"],
  ["Диас Сарсенов", "dias.sarsenov@example.kz", "+7 775 318 46 12"],
  ["Аружан Калиева", "aruzhan.kaliyeva@example.kz", "+7 708 643 21 09"],
  ["Мирас Абдрахманов", "miras.abdrakhmanov@example.kz", "+7 776 902 14 55"]
];

const scenarios = [
  {
    id: "universal",
    title: "Общие обращения — демо",
    statuses: ["new", "in_progress", "done"],
    questions: ["ФИО", "Телефон", "Тема обращения", "Сообщение"],
    values: [
      ["Консультация", "Нужна подробная консультация по услугам"],
      ["Партнерство", "Хотим обсудить возможное сотрудничество"],
      ["Документы", "Подскажите список необходимых документов"],
      ["Обратная связь", "Есть предложение по улучшению сервиса"]
    ]
  },
  {
    id: "admissions",
    title: "Приемная комиссия — демо",
    statuses: ["new", "contacted", "documents_needed", "accepted", "rejected"],
    questions: ["ФИО абитуриента", "Телефон", "Специальность", "Документы"],
    values: [
      ["Информационные системы", "Удостоверение, аттестат, фото 3x4"],
      ["Программное обеспечение", "Удостоверение, аттестат"],
      ["Дизайн", "Полный пакет документов"],
      ["Информационная безопасность", "Удостоверение, медсправка"]
    ]
  },
  {
    id: "hr",
    title: "Подбор сотрудников — демо",
    statuses: ["new", "shortlisted", "interview", "rejected", "hired"],
    questions: ["Имя кандидата", "Телефон", "Вакансия", "Опыт"],
    values: [
      ["Frontend-разработчик", "3 года, React и TypeScript"],
      ["Менеджер по продажам", "2 года в B2B-продажах"],
      ["UX/UI дизайнер", "4 года, есть портфолио"],
      ["Backend-разработчик", "5 лет, Node.js и PostgreSQL"]
    ]
  },
  {
    id: "survey",
    title: "Опрос качества сервиса — демо",
    statuses: ["new"],
    questions: ["Участник", "Email", "Оценка сервиса", "Что улучшить?"],
    values: [
      ["5 из 5", "Все понравилось, добавить мобильное приложение"],
      ["4 из 5", "Ускорить время ответа поддержки"],
      ["3 из 5", "Сделать интерфейс проще"],
      ["5 из 5", "Добавить больше аналитики"]
    ]
  },
  {
    id: "client_requests",
    title: "Заявки клиентов — демо",
    statuses: ["new", "urgent", "in_progress", "waiting_client", "done"],
    questions: ["Клиент", "Телефон", "Тип заявки", "Описание"],
    values: [
      ["Техническая проблема", "Не получается войти в личный кабинет"],
      ["Запрос цены", "Нужен расчет стоимости для команды"],
      ["Настройка интеграции", "Требуется подключить корпоративную форму"],
      ["Обучение", "Нужна демонстрация возможностей продукта"]
    ]
  },
  {
    id: "event",
    title: "Регистрация на конференцию — демо",
    statuses: ["new", "confirmed", "waiting_payment", "cancelled", "attended"],
    questions: ["Участник", "Телефон", "Формат участия", "Комментарий"],
    values: [
      ["Офлайн", "Интересует секция по искусственному интеллекту"],
      ["Онлайн", "Нужна ссылка на трансляцию"],
      ["Офлайн", "Требуется сертификат участника"],
      ["Онлайн", "Планирует участвовать со своей командой"]
    ]
  }
];

function answersFor(scenario, person, index) {
  const values = scenario.values[index % scenario.values.length];
  return [
    { question: scenario.questions[0], answer: person[0], questionId: `${scenario.id}-name` },
    { question: scenario.questions[1], answer: scenario.id === "survey" ? person[1] : person[2], questionId: `${scenario.id}-contact` },
    { question: scenario.questions[2], answer: values[0], questionId: `${scenario.id}-category` },
    { question: scenario.questions[3], answer: values[1], questionId: `${scenario.id}-details` }
  ];
}

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: env.db.syncAlter });

  const user = await User.findOne({ where: { email: targetEmail } });
  if (!user) throw new Error(`User not found: ${targetEmail}`);

  let createdForms = 0;
  let createdRequests = 0;

  for (const scenario of scenarios) {
    const formId = `demo-${scenario.id}-erdana-2026`;
    const formUrl = `https://docs.google.com/forms/d/${formId}/edit`;
    const formSchema = {
      info: { title: scenario.title, documentTitle: scenario.title },
      items: scenario.questions.map((title, index) => ({
        itemId: `${scenario.id}-item-${index + 1}`,
        title,
        questionId: `${scenario.id}-question-${index + 1}`,
        type: "textQuestion"
      }))
    };

    const [integration, wasCreated] = await FormIntegration.findOrCreate({
      where: { formId },
      defaults: { userId: user.id, formId, formTitle: scenario.title, formUrl }
    });
    if (wasCreated) createdForms += 1;

    await integration.update({
      userId: user.id,
      googleAccountId: null,
      formTitle: scenario.title,
      formUrl,
      setupMode: "seed_demo",
      status: "ready",
      healthStatus: "connected",
      syncEnabled: false,
      syncStatus: "idle",
      lastSyncError: null,
      scenario: scenario.id,
      scenarioConfiguredAt: integration.scenarioConfiguredAt || new Date(),
      formSchema,
      setupChecklist: { form: true, formSchema: true, responses: true, demoData: true }
    });

    for (const [index, person] of people.entries()) {
      const responseId = `${formId}:seed:${String(index + 1).padStart(2, "0")}`;
      const submittedAt = new Date(baseSubmittedAt.getTime() + (index * 31 + scenarios.indexOf(scenario) * 7) * 60 * 60 * 1000);
      const answers = answersFor(scenario, person, index);
      const payload = {
        source: "seed_demo",
        form: { id: formId, title: scenario.title },
        responseId,
        respondentEmail: person[1],
        submittedAt: submittedAt.toISOString(),
        answers
      };

      const [request, requestWasCreated] = await Request.findOrCreate({
        where: { responseId },
        defaults: {
          source: "seed_demo",
          formId,
          formTitle: scenario.title,
          responseId,
          respondentEmail: person[1],
          submittedAt,
          answers,
          rawPayload: payload,
          status: scenario.statuses[index % scenario.statuses.length]
        }
      });
      if (requestWasCreated) createdRequests += 1;

      await request.update({
        source: "seed_demo",
        formId,
        formTitle: scenario.title,
        respondentEmail: person[1],
        submittedAt,
        answers,
        rawPayload: payload,
        status: scenario.statuses[index % scenario.statuses.length]
      });
    }
  }

  console.log(`Scenario demos ready for ${targetEmail}: ${createdForms} new forms, ${createdRequests} new responses.`);
  console.log(`Stable total: ${scenarios.length} forms, ${scenarios.length * people.length} responses.`);
}

seed()
  .catch((error) => {
    console.error("Scenario demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
