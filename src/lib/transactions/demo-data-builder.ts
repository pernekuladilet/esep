export type DemoRow = {
  date: string;
  type: "income" | "expense";
  slug: string;
  amountTiyn: number;
  description: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Sun=0 .. Sat=6 (matches Date#getDay()). Quiet weekdays, busier Friday,
// busiest on the weekend — a believable coffee-shop weekly rhythm.
const DAY_OF_WEEK_FACTOR = [1.3, 0.85, 0.85, 0.9, 0.95, 1.15, 1.35];

/**
 * Realistic ~2-month transaction history for a coffee shop: daily revenue
 * that follows a day-of-week pattern, rent on the 1st, utilities and taxes
 * once a month, salary twice a month, stock restocking once or twice a
 * week, and the occasional ad/misc expense. A partial (ongoing) month only
 * gets entries up to `today`, never future-dated ones.
 */
export function buildDemoRows(today: Date = new Date()): DemoRow[] {
  const rows: DemoRow[] = [];

  const months = [
    { year: today.getFullYear(), month: today.getMonth() - 1 },
    { year: today.getFullYear(), month: today.getMonth() },
  ].map(({ year, month }) => {
    // Normalize month=-1 into December of the previous year, etc.
    const normalized = new Date(year, month, 1);
    return { year: normalized.getFullYear(), month: normalized.getMonth() };
  });

  for (const { year, month } of months) {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth(year, month);

    // Daily revenue — every day, varying with the day of the week.
    for (let day = 1; day <= lastDay; day++) {
      const weekday = new Date(year, month, day).getDay();
      const factor = DAY_OF_WEEK_FACTOR[weekday];
      const base = randomBetween(16000, 24000);
      const jitter = 0.9 + Math.random() * 0.2;
      const amount = Math.round(base * factor * jitter);
      rows.push({
        date: isoDate(year, month, day),
        type: "income",
        slug: "revenue",
        amountTiyn: amount * 100,
        description: "Выручка за день",
      });
    }

    // Rent — 1st of the month.
    rows.push({
      date: isoDate(year, month, 1),
      type: "expense",
      slug: "rent",
      amountTiyn: randomBetween(145000, 155000) * 100,
      description: "Аренда помещения",
    });

    // Utilities — once a month.
    if (lastDay >= 5) {
      rows.push({
        date: isoDate(year, month, 5),
        type: "expense",
        slug: "utilities",
        amountTiyn: randomBetween(20000, 28000) * 100,
        description: "Коммунальные платежи",
      });
    }

    // Taxes — once a month.
    if (lastDay >= 10) {
      rows.push({
        date: isoDate(year, month, 10),
        type: "expense",
        slug: "taxes",
        amountTiyn: randomBetween(30000, 40000) * 100,
        description: "Налоговый платёж",
      });
    }

    // Salary — twice a month.
    for (const payday of [15, Math.min(28, daysInMonth(year, month))]) {
      if (payday <= lastDay) {
        rows.push({
          date: isoDate(year, month, payday),
          type: "expense",
          slug: "salary",
          amountTiyn: randomBetween(85000, 95000) * 100,
          description: "Зарплата персонала",
        });
      }
    }

    // Restocking — once or twice a week.
    for (let weekStart = 1; weekStart <= lastDay; weekStart += 7) {
      const weekEnd = Math.min(weekStart + 6, lastDay);
      const timesThisWeek = randomInt(1, 2);
      const usedDays = new Set<number>();
      for (let i = 0; i < timesThisWeek && usedDays.size < weekEnd - weekStart + 1; i++) {
        let day = randomInt(weekStart, weekEnd);
        while (usedDays.has(day)) day = randomInt(weekStart, weekEnd);
        usedDays.add(day);
        rows.push({
          date: isoDate(year, month, day),
          type: "expense",
          slug: "cogs",
          amountTiyn: randomBetween(18000, 45000) * 100,
          description: "Закуп кофе и молока",
        });
      }
    }

    // Occasional advertising and misc expenses.
    for (let i = 0; i < randomInt(1, 2); i++) {
      rows.push({
        date: isoDate(year, month, randomInt(1, lastDay)),
        type: "expense",
        slug: "advertising",
        amountTiyn: randomBetween(5000, 15000) * 100,
        description: "Реклама в Instagram",
      });
    }
    for (let i = 0; i < randomInt(1, 2); i++) {
      rows.push({
        date: isoDate(year, month, randomInt(1, lastDay)),
        type: "expense",
        slug: "other",
        amountTiyn: randomBetween(3000, 20000) * 100,
        description: "Прочие расходы",
      });
    }
  }

  return rows;
}
