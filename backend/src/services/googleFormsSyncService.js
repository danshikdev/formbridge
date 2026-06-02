import { FormIntegration } from "../models/formIntegration.js";
import { Request } from "../models/request.js";
import { getGoogleAccount, getGoogleForm, listGoogleFormResponses } from "./googleService.js";
import { notifyForNewRequests } from "./whatsappNotificationService.js";

function questionMapFromForm(form) {
  const map = new Map();
  for (const item of form.items || []) {
    const question = item.questionItem?.question;
    const questionId = question?.questionId;
    if (!questionId) continue;
    map.set(questionId, item.title || questionId);
  }
  return map;
}

function answerText(answer) {
  if (answer?.textAnswers?.answers?.length) {
    return answer.textAnswers.answers.map((item) => item.value || "").filter(Boolean).join(", ");
  }

  if (answer?.fileUploadAnswers?.answers?.length) {
    return answer.fileUploadAnswers.answers
      .map((item) => item.fileName || item.fileId || "")
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function normalizeResponse(response, form, questionMap) {
  const googleResponseId = response.responseId;
  const responseId = `${form.formId}:${googleResponseId}`;
  const answers = Object.entries(response.answers || {}).map(([questionId, answer]) => ({
    question: questionMap.get(questionId) || questionId,
    answer: answerText(answer),
    questionId
  }));

  return {
    source: "google_forms_api",
    formId: form.formId,
    formTitle: form.formTitle || null,
    responseId,
    respondentEmail: response.respondentEmail || null,
    submittedAt: response.lastSubmittedTime ? new Date(response.lastSubmittedTime) : response.createTime ? new Date(response.createTime) : null,
    answers,
    rawPayload: {
      source: "google_forms_api",
      form: {
        id: form.formId,
        title: form.formTitle || null
      },
      googleResponseId,
      responseId,
      respondentEmail: response.respondentEmail || null,
      submittedAt: response.lastSubmittedTime || response.createTime || null,
      answers,
      googleResponse: response
    },
    status: "new"
  };
}

export async function syncFormIntegration(integrationId) {
  const integration = await FormIntegration.findByPk(integrationId);
  if (!integration) throw new Error("Integration not found");

  const account = integration.googleAccountId
    ? await getGoogleAccount(integration.userId)
    : await getGoogleAccount(integration.userId);

  if (!account) throw new Error("Google account is not connected");

  integration.syncStatus = "syncing";
  integration.lastSyncError = null;
  await integration.save();

  try {
    const googleForm = await getGoogleForm(account, integration.formId);
    const formTitle = googleForm.info?.title || integration.formTitle || "Untitled form";
    const questionMap = questionMapFromForm(googleForm);
    const responses = await listGoogleFormResponses(account, integration.formId);

    let created = 0;
    let skipped = 0;
    const createdRecords = [];

    for (const response of responses) {
      if (!response.responseId) {
        skipped += 1;
        continue;
      }

      const payload = normalizeResponse(response, { ...integration.toJSON(), formTitle }, questionMap);
      const [record, wasCreated] = await Request.findOrCreate({
        where: { responseId: payload.responseId },
        defaults: payload
      });

      if (wasCreated) {
        created += 1;
        createdRecords.push(record);
      } else {
        skipped += 1;
      }
    }

    const lastSyncedAt = new Date();
    integration.formTitle = formTitle;
    integration.googleAccountId = account.id;
    integration.formSchema = {
      info: googleForm.info || null,
      items: (googleForm.items || []).map((item) => ({
        itemId: item.itemId || null,
        title: item.title || "",
        questionId: item.questionItem?.question?.questionId || null,
        type: item.questionItem?.question ? Object.keys(item.questionItem.question).find((key) => key.endsWith("Question")) || null : null
      }))
    };
    integration.setupMode = "forms_api_polling";
    integration.syncEnabled = true;
    integration.syncStatus = "idle";
    integration.lastSyncedAt = lastSyncedAt;
    integration.lastSyncError = null;
    integration.status = "ready";
    integration.healthStatus = "connected";
    integration.lastEventAt = lastSyncedAt;
    integration.setupChecklist = {
      ...(integration.setupChecklist || {}),
      googleAccount: true,
      form: true,
      formSchema: true,
      responses: true,
      polling: true
    };
    await integration.save();

    await notifyForNewRequests(integration.formId, createdRecords);

    return {
      integration,
      created,
      skipped,
      total: responses.length,
      lastSyncedAt
    };
  } catch (err) {
    integration.syncStatus = "error";
    integration.lastSyncError = err.message;
    integration.healthStatus = "broken";
    integration.lastErrorAt = new Date();
    integration.lastErrorReason = err.message;
    await integration.save();
    throw err;
  }
}
