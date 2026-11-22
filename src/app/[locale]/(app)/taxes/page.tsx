import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireBusiness } from "@/lib/business/current";
import { ensureTaxReminders } from "@/lib/reminders/tax-reminders";
import {
  getHalfYear,
  getPeriodRange,
  getDeadlines,
  calculateTax,
  getIncomeLimitProgress,
  daysUntil,
  type Half,
} from "@/lib/tax/calculate";
import { formatTenge } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  searchParams: Promise<{ year?: string; half?: string }>;
};

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function DeadlineRow({
  label,
  date,
  locale,
  t,
}: {
  label: string;
  date: Date;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"taxes">>>;
}) {
  const days = daysUntil(date);
  let countdown: string;
  if (days > 0) countdown = t("daysLeft", { count: days });
  else if (days === 0) countdown = t("dueToday");
  else countdown = t("daysOverdue", { count: Math.abs(days) });

  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground">{formatDate(date, locale)}</span>
        <span className={days < 0 ? "font-medium text-destructive" : "font-medium"}>{countdown}</span>
      </span>
    </div>
  );
}

export default async function TaxesPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("taxes");
  const { supabase, business } = await requireBusiness();

  if (business.tax_regime !== "simplified") {
    return (
      <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">{t("onlySimplified")}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  await ensureTaxReminders(supabase, business.id);

  const today = new Date();
  const real = getHalfYear(today);

  let year = Number.parseInt(params.year ?? "", 10) || real.year;
  let half: Half = params.half === "1" || params.half === "2" ? (Number(params.half) as Half) : real.half;

  // Never allow navigating past the real current period.
  if (year > real.year || (year === real.year && half > real.half)) {
    year = real.year;
    half = real.half;
  }
  const isRealCurrent = year === real.year && half === real.half;

  const { startIso, endIso } = getPeriodRange(year, half);
  const { data: periodRows } = await supabase
    .from("transactions")
    .select("amount")
    .eq("business_id", business.id)
    .eq("type", "income")
    .gte("date", startIso)
    .lte("date", endIso);

  const periodIncome = (periodRows ?? []).reduce((acc, r) => acc + (r.amount as number), 0);
  const rate = Number(business.tax_rate);
  const taxDue = calculateTax(periodIncome, rate);

  const { data: yearRows } = await supabase
    .from("transactions")
    .select("amount")
    .eq("business_id", business.id)
    .eq("type", "income")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`);

  const annualIncome = (yearRows ?? []).reduce((acc, r) => acc + (r.amount as number), 0);
  const limitProgress = getIncomeLimitProgress(annualIncome);

  const { reportDate, payDate } = getDeadlines(year, half);

  const prevHalf: { year: number; half: Half } = half === 1 ? { year: year - 1, half: 2 } : { year, half: 1 };
  const nextHalf: { year: number; half: Half } = half === 1 ? { year, half: 2 } : { year: year + 1, half: 1 };

  const periodLabel = half === 1 ? t("periodLabelH1", { year }) : t("periodLabelH2", { year });

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <div className="flex items-center justify-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={{ pathname: "/taxes", query: { year: String(prevHalf.year), half: String(prevHalf.half) } }}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <span className="min-w-40 text-center text-sm font-medium">{periodLabel}</span>
        {isRealCurrent ? (
          <Button variant="ghost" size="icon-sm" disabled>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={{ pathname: "/taxes", query: { year: String(nextHalf.year), half: String(nextHalf.half) } }}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("income")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatTenge(periodIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("rate")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("taxDue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-brand">{formatTenge(taxDue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("setAsideToday")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatTenge(taxDue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("limitProgress", { year })}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span>{formatTenge(annualIncome)}</span>
            <span className="text-muted-foreground">{Math.round(limitProgress.ratio * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={
                "h-full rounded-full " +
                (limitProgress.exceeded
                  ? "bg-destructive"
                  : limitProgress.warnAt80
                    ? "bg-amber-500"
                    : "bg-brand")
              }
              style={{ width: `${Math.min(100, Math.round(limitProgress.ratio * 100))}%` }}
            />
          </div>
          {limitProgress.exceeded && (
            <p className="text-sm font-medium text-destructive">{t("limitWarningExceeded")}</p>
          )}
          {!limitProgress.exceeded && limitProgress.warnAt80 && (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t("limitWarning80")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("deadlines")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <DeadlineRow label={t("reportDeadline")} date={reportDate} locale={locale} t={t} />
          <DeadlineRow label={t("payDeadline")} date={payDate} locale={locale} t={t} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
    </main>
  );
}
