// Единственное место в проекте, где хранятся налоговые ставки, пороги и сроки.
// Налоговый кодекс РК обновлён с 2026 года — значения ниже взяты из открытых
// источников и ОБЯЗАТЕЛЬНО требуют ручной проверки на kgd.gov.kz перед
// использованием в проде. Расчёт в интерфейсе всегда помечается как справочный.

/** МРП на 2026 год, в тиынах (1 тенге = 100 тиын). Источник: kgd.gov.kz — ПРОВЕРИТЬ ВРУЧНУЮ. */
export const MRP_TIYN = 432_500; // 4 325 ₸

// Упрощённая декларация (СНР, форма 910.00).
// Источники: finance.kz/articles/forma-910-00-kazakhstan-2026,
// finance.kz/articles/uproshchyonnaya-deklaratsiya-kazakhstan-2026 — ПРОВЕРИТЬ ВРУЧНУЮ.

/** Базовая ставка 4% от дохода без учёта расходов; маслихат может менять ±50% (2–6%). */
export const SIMPLIFIED_RATE_OPTIONS = [2, 4, 6] as const;
export type SimplifiedRate = (typeof SIMPLIFIED_RATE_OPTIONS)[number];
export const SIMPLIFIED_DEFAULT_RATE_PERCENT: SimplifiedRate = 4;

/** Лимит дохода для упрощёнки — 600 000 МРП в год. Источник: cdb.kz/article/show/17551 — ПРОВЕРИТЬ ВРУЧНУЮ. */
export const SIMPLIFIED_INCOME_LIMIT_MRP = 600_000;
export const SIMPLIFIED_INCOME_LIMIT_TIYN = MRP_TIYN * SIMPLIFIED_INCOME_LIMIT_MRP; // 259 500 000 000 (2 595 000 000 ₸)

/**
 * Налоговый период упрощёнки — полугодие.
 * I полугодие (янв–июн): сдать форму 910.00 до 15.08, уплатить до 25.08 того же года.
 * II полугодие (июл–дек): сдать до 15.02, уплатить до 25.02 СЛЕДУЮЩЕГО года.
 * Источники: finance.kz/articles/forma-910-00-kazakhstan-2026,
 * finance.kz/articles/uproshchyonnaya-deklaratsiya-kazakhstan-2026 — ПРОВЕРИТЬ ВРУЧНУЮ.
 */
export const SIMPLIFIED_DEADLINES = {
  1: { reportMonthDay: "08-15", payMonthDay: "08-25", deadlineYearOffset: 0 },
  2: { reportMonthDay: "02-15", payMonthDay: "02-25", deadlineYearOffset: 1 },
} as const;

/**
 * Соцплатежи ИП за себя (ОПВ, СО, ВОСМС) — ставки не подтверждены для 2026 года,
 * расчёт по ним НЕ ведётся нигде в коде, пока поля не заполнены реальными значениями.
 * TODO: уточнить ставки и пороги на kgd.gov.kz / gfss.kz.
 */
export const SELF_SOCIAL_PAYMENTS = {
  opvPercent: null as number | null, // TODO: уточнить ставку ОПВ ИП за себя
  soPercent: null as number | null, // TODO: уточнить ставку СО ИП за себя
  vosmsPercent: null as number | null, // TODO: уточнить ставку ВОСМС ИП за себя
};
