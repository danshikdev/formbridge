import { translations } from "./i18n";

export const STATUS_LANGS = ["kk", "ru", "en"];

const BUILT_IN_STATUS_KEYS = [
  "new",
  "in_progress",
  "done",
  "test",
  "contacted",
  "documents_needed",
  "accepted",
  "rejected",
  "shortlisted",
  "interview",
  "hired",
  "urgent",
  "waiting_client",
  "confirmed",
  "waiting_payment",
  "cancelled",
  "attended"
];

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function builtInStatusLabel(key, lang) {
  const t = translations[lang] || translations.kk || {};
  const map = {
    new: t.new,
    in_progress: t.inProgress,
    done: t.done,
    test: t.test,
    contacted: t.statusContacted,
    documents_needed: t.statusDocumentsNeeded,
    accepted: t.statusAccepted,
    rejected: t.statusRejected,
    shortlisted: t.statusShortlisted,
    interview: t.statusInterview,
    hired: t.statusHired,
    urgent: t.statusUrgent,
    waiting_client: t.statusWaitingClient,
    confirmed: t.statusConfirmed,
    waiting_payment: t.statusWaitingPayment,
    cancelled: t.statusCancelled,
    attended: t.statusAttended
  };
  return trimString(map[key]) || key;
}

function builtInStatusTranslations(key) {
  const next = {};
  for (const lang of STATUS_LANGS) {
    next[lang] = builtInStatusLabel(key, lang);
  }
  return next;
}

export function normalizeStatusTranslations(value, fallback = "") {
  const next = {};
  for (const lang of STATUS_LANGS) {
    next[lang] = trimString(value?.[lang]) || "";
  }

  const fallbackLabel = trimString(fallback);
  if (fallbackLabel) {
    for (const lang of STATUS_LANGS) {
      if (!next[lang]) next[lang] = fallbackLabel;
    }
  }

  return next;
}

export function resolveStatusLabel(status, lang = "ru") {
  const translationsMap = normalizeStatusTranslations(status?.translations, status?.label);
  return (
    translationsMap[lang]
    || trimString(status?.label)
    || translationsMap.ru
    || translationsMap.kk
    || translationsMap.en
    || trimString(status?.key)
  );
}

export function normalizeCustomStatus(status) {
  const key = trimString(status?.key);
  const builtIn = BUILT_IN_STATUS_KEYS.includes(key) ? builtInStatusTranslations(key) : null;
  const translationsMap = normalizeStatusTranslations(
    status?.translations,
    trimString(status?.label) || (builtIn ? builtIn.ru || builtIn.kk || builtIn.en : "")
  );

  if (builtIn) {
    for (const lang of STATUS_LANGS) {
      if (!translationsMap[lang]) translationsMap[lang] = builtIn[lang];
    }
  }

  return {
    key,
    label: resolveStatusLabel({ key, label: status?.label, translations: translationsMap }, "ru"),
    translations: translationsMap
  };
}

export function createDefaultStatus(key) {
  return normalizeCustomStatus({
    key,
    translations: builtInStatusTranslations(key)
  });
}
