import "../models/associations.js";
import { sequelize } from "../config/database.js";
import { env } from "../config/env.js";
import { User } from "../models/user.js";
import { GoogleAccount } from "../models/googleAccount.js";
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
    formId: "159zxqVr48py9P1XYO98ntCloTKI6i2RowoUBSy4HB7M",
    title: "Курсқа тіркелу",
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
    formId: "1s41ZV6bSAUBq97AcPO4BVvCBOqlPJjik3Uo8F11ljhA",
    title: "Студентті тіркеу",
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
    formId: "1-YyUcB98UrqZeTvLKqIIzXKmGOJTjTtJTLKaeYtLFpw",
    title: "Жұмысқа өтінім",
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
    formId: "1qKUHGZNlkfFu6ZrmdF7BoRrsW9BP9ZEZKeckx3t8l8g",
    title: "Кері байланыс формасы",
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
    formId: "1J3TGUQFalaRJoFnqbEzimoFte_xM9ejKjF188aOIF60",
    title: "Байланыс формасы",
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
    formId: "1JfSYWW8eYmyhDxTXmv3FaQRMXSSSqR0nDW-z7ztx2s0",
    title: "Іс-шараға тіркелу",
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
  const googleAccount = await GoogleAccount.findOne({ where: { userId: user.id } });
  if (!googleAccount) throw new Error(`Google account not found for: ${targetEmail}`);

  let createdForms = 0;
  let createdRequests = 0;

  for (const scenario of scenarios) {
    const formId = scenario.formId;
    const formUrl = `https://docs.google.com/forms/d/${formId}/edit`;

    const [integration, wasCreated] = await FormIntegration.findOrCreate({
      where: { formId },
      defaults: {
        userId: user.id,
        googleAccountId: googleAccount.id,
        formId,
        formTitle: scenario.title,
        formUrl,
        setupMode: "forms_api_polling",
        status: "ready",
        healthStatus: "connected",
        syncEnabled: true
      }
    });
    if (wasCreated) createdForms += 1;

    await integration.update({
      userId: user.id,
      googleAccountId: googleAccount.id,
      formTitle: scenario.title,
      formUrl,
      setupMode: "forms_api_polling",
      status: "ready",
      healthStatus: "connected",
      syncEnabled: true,
      syncStatus: "idle",
      lastSyncError: null,
      scenario: scenario.id,
      scenarioConfiguredAt: integration.scenarioConfiguredAt || new Date(),
      setupChecklist: { ...(integration.setupChecklist || {}), googleAccount: true, form: true, responses: true, polling: true }
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

  const legacyFormIds = scenarios.map((scenario) => `demo-${scenario.id}-erdana-2026`);
  const removedLegacyRequests = await Request.destroy({ where: { formId: legacyFormIds } });
  const removedLegacyForms = await FormIntegration.destroy({
    where: { userId: user.id, formId: legacyFormIds, setupMode: "seed_demo" }
  });

  console.log(`Scenario demo responses ready for ${targetEmail}: ${createdForms} connected forms, ${createdRequests} new responses.`);
  console.log(`Stable total: ${scenarios.length} Google forms, ${scenarios.length * people.length} seed responses.`);
  console.log(`Legacy cleanup: ${removedLegacyForms} FormBridge-only forms, ${removedLegacyRequests} responses removed.`);
}

seed()
  .catch((error) => {
    console.error("Scenario demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
