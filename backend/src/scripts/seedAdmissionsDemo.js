import "../models/user.js";
import "../models/googleAccount.js";
import "../models/formIntegration.js";
import "../models/request.js";
import "../models/integrationEvent.js";
import "../models/notificationSettings.js";
import "../models/formFeedback.js";
import { sequelize } from "../config/database.js";
import { env } from "../config/env.js";
import { FormIntegration } from "../models/formIntegration.js";
import { Request } from "../models/request.js";

const formId = process.env.DEMO_ADMISSIONS_FORM_ID || "demo-college-admissions-2026";
const formTitle = process.env.DEMO_ADMISSIONS_FORM_TITLE || "Прием заявлений в колледж";
const formUrl = process.env.DEMO_ADMISSIONS_FORM_URL || "https://forms.google.com/demo-college-admissions";
const sheetUrl = process.env.DEMO_ADMISSIONS_SHEET_URL || "https://docs.google.com/spreadsheets/d/demo-college-admissions";

const baseSubmittedAt = new Date("2026-05-28T10:00:00+05:00");

const applicants = [
  {
    name: "Алия Сериковна Тулегенова",
    email: "aliya.tulegenova@example.kz",
    phone: "+7 701 245 18 33",
    specialty: "Информационные системы",
    documents: "Удостоверение, аттестат, фото 3x4",
    comment: "Интересуется грантом и общежитием",
    status: "new"
  },
  {
    name: "Нурислам Канатович Бекенов",
    email: "nurislam.bekenov@example.kz",
    phone: "+7 777 504 91 20",
    specialty: "Программное обеспечение",
    documents: "Удостоверение, аттестат",
    comment: "Не хватает фото 3x4",
    status: "documents_needed"
  },
  {
    name: "Дана Маратовна Ахметова",
    email: "dana.akhmetova@example.kz",
    phone: "+7 705 831 44 09",
    specialty: "Дизайн",
    documents: "Полный пакет документов",
    comment: "Портфолио отправлено на почту",
    status: "accepted"
  },
  {
    name: "Еркебулан Талгатович Оразов",
    email: "erkebulan.orazov@example.kz",
    phone: "+7 747 632 77 11",
    specialty: "Информационная безопасность",
    documents: "Удостоверение, аттестат, медсправка",
    comment: "Связались, ожидает консультацию по оплате",
    status: "contacted"
  },
  {
    name: "Айгерим Болатовна Садыкова",
    email: "aigerim.sadykova@example.kz",
    phone: "+7 702 119 60 54",
    specialty: "Бухгалтерский учет",
    documents: "Удостоверение",
    comment: "Нужен аттестат и фото",
    status: "documents_needed"
  },
  {
    name: "Арман Ерланович Касым",
    email: "arman.kasym@example.kz",
    phone: "+7 778 220 15 88",
    specialty: "Программное обеспечение",
    documents: "Полный пакет документов",
    comment: "Готов к собеседованию",
    status: "contacted"
  },
  {
    name: "Мадина Руслановна Ибраева",
    email: "madina.ibraeva@example.kz",
    phone: "+7 700 918 33 27",
    specialty: "Маркетинг",
    documents: "Удостоверение, аттестат, фото 3x4",
    comment: "Просит перезвонить после 16:00",
    status: "new"
  },
  {
    name: "Самат Аскарович Жумабаев",
    email: "samat.zhumabayev@example.kz",
    phone: "+7 707 450 02 19",
    specialty: "Электроснабжение",
    documents: "Полный пакет документов",
    comment: "Принят после проверки документов",
    status: "accepted"
  },
  {
    name: "Жанель Мураткызы Нурпеисова",
    email: "zhanel.nurpeisova@example.kz",
    phone: "+7 701 774 65 32",
    specialty: "Информационные системы",
    documents: "Удостоверение, аттестат",
    comment: "Нужно донести медсправку",
    status: "documents_needed"
  }
];

function buildAnswers(applicant) {
  return [
    { question: "ФИО абитуриента", answer: applicant.name },
    { question: "Телефон", answer: applicant.phone },
    { question: "Email", answer: applicant.email },
    { question: "Выбранная специальность", answer: applicant.specialty },
    { question: "Документы", answer: applicant.documents },
    { question: "Комментарий", answer: applicant.comment }
  ];
}

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: env.db.syncAlter });

  const [integration] = await FormIntegration.findOrCreate({
    where: { formId },
    defaults: {
      formId,
      formTitle,
      formUrl,
      sheetUrl,
      status: "ready",
      healthStatus: "connected",
      setupMode: "manual",
      scenario: "admissions",
      scenarioConfiguredAt: new Date(),
      setupChecklist: {
        sheetLinked: true,
        appsScriptApiChecked: true,
        triggerInstalled: true
      }
    }
  });

  integration.formTitle = formTitle;
  integration.formUrl = formUrl;
  integration.sheetUrl = sheetUrl;
  integration.status = "ready";
  integration.healthStatus = "connected";
  integration.scenario = "admissions";
  integration.scenarioConfiguredAt = integration.scenarioConfiguredAt || new Date();
  await integration.save();

  let created = 0;
  for (const [index, applicant] of applicants.entries()) {
    const submittedAt = new Date(baseSubmittedAt.getTime() + index * 26 * 60 * 60 * 1000);
    const responseId = `${formId}-seed-${String(index + 1).padStart(2, "0")}`;
    const answers = buildAnswers(applicant);
    const [, wasCreated] = await Request.findOrCreate({
      where: { responseId },
      defaults: {
        source: "google_forms",
        formId,
        formTitle,
        responseId,
        respondentEmail: applicant.email,
        submittedAt,
        answers,
        rawPayload: {
          source: "seed",
          form: { id: formId, title: formTitle },
          responseId,
          respondentEmail: applicant.email,
          submittedAt: submittedAt.toISOString(),
          answers
        },
        status: applicant.status
      }
    });
    if (wasCreated) created += 1;
  }

  console.log(`Admissions demo seed ready: ${created} new requests, ${applicants.length} total seed rows for formId=${formId}`);
}

seed()
  .catch((error) => {
    console.error("Admissions demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
