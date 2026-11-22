import { getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/business/current";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/transactions/delete-button";
import { deleteTransaction } from "@/lib/transactions/actions";
import { seedDemoData } from "@/lib/transactions/demo-data";
import { formatTenge } from "@/lib/format";
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
  type TransactionSource,
  type TransactionType,
} from "@/lib/transactions/constants";

const PAGE_SIZE = 50;

type OperationRow = {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  counterparty: string | null;
  source: TransactionSource;
  categories: { slug: string } | null;
};

function monthRange(offsetMonths = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(start), to: iso(end) };
}

type SearchParams = {
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  source?: string;
  page?: string;
};

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { supabase, business } = await requireBusiness();
  const t = await getTranslations("operations");
  const tImports = await getTranslations("imports");
  const tCategories = await getTranslations("categories");

  const defaultRange = monthRange(0);
  const from = params.from || defaultRange.from;
  const to = params.to || defaultRange.to;
  const type = TRANSACTION_TYPES.includes(params.type as TransactionType)
    ? (params.type as TransactionType)
    : undefined;
  const source = TRANSACTION_SOURCES.includes(params.source as TransactionSource)
    ? (params.source as TransactionSource)
    : undefined;
  const category = params.category || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, type")
    .eq("is_system", true)
    .order("slug");

  const { count: totalCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  let query = supabase
    .from("transactions")
    .select("id, date, type, amount, description, counterparty, source, categories(slug)", {
      count: "exact",
    })
    .eq("business_id", business.id)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (type) query = query.eq("type", type);
  if (source) query = query.eq("source", source);
  if (category) query = query.eq("category_id", category);

  const { data: rawTransactions, count: filteredCount } = await query;
  const transactions = rawTransactions as unknown as OperationRow[] | null;

  const isEmptyBusiness = (totalCount ?? 0) === 0;
  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE));

  function categoryLabel(slug: string | null | undefined) {
    if (!slug) return "—";
    return tCategories(slug as Parameters<typeof tCategories>[0]);
  }

  function typeLabel(value: string) {
    return value === "income" ? t("typeOptions.income") : t("typeOptions.expense");
  }

  function sourceLabel(value: string) {
    return t(`sourceOptions.${value}` as Parameters<typeof t>[0]);
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/operations/import">{tImports("title")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/operations/new">{t("addButton")}</Link>
          </Button>
        </div>
      </div>

      {isEmptyBusiness ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p className="text-muted-foreground">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("demoDescription")}</p>
            <form action={seedDemoData}>
              <Button type="submit">{t("demoButton")}</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <form className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("filters.fromLabel")}</label>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("filters.toLabel")}</label>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("filters.typeLabel")}</label>
              <select
                name="type"
                defaultValue={type ?? ""}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">{t("filters.allTypes")}</option>
                <option value="income">{t("typeOptions.income")}</option>
                <option value="expense">{t("typeOptions.expense")}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                {t("filters.categoryLabel")}
              </label>
              <select
                name="category"
                defaultValue={category ?? ""}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">{t("filters.allCategories")}</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c.slug)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                {t("filters.sourceLabel")}
              </label>
              <select
                name="source"
                defaultValue={source ?? ""}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">{t("filters.allSources")}</option>
                {TRANSACTION_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {sourceLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" variant="outline">
              {t("filters.apply")}
            </Button>
            <Button asChild type="button" size="sm" variant="ghost">
              <Link href="/operations">{t("filters.reset")}</Link>
            </Button>
          </form>

          {!transactions || transactions.length === 0 ? (
            <p className="text-muted-foreground">{t("noResults")}</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.date")}</TableHead>
                      <TableHead>{t("table.type")}</TableHead>
                      <TableHead>{t("table.category")}</TableHead>
                      <TableHead>{t("table.description")}</TableHead>
                      <TableHead>{t("table.source")}</TableHead>
                      <TableHead className="text-right">{t("table.amount")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell>{typeLabel(tx.type)}</TableCell>
                        <TableCell>{categoryLabel(tx.categories?.slug)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell>{sourceLabel(tx.source)}</TableCell>
                        <TableCell
                          className={
                            "text-right font-medium " +
                            (tx.type === "income" ? "text-brand" : "text-foreground")
                          }
                        >
                          {tx.type === "income" ? "+" : "−"}
                          {formatTenge(tx.amount)}
                        </TableCell>
                        <TableCell className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/operations/${tx.id}/edit`}>{t("editButton")}</Link>
                          </Button>
                          <DeleteButton action={deleteTransaction.bind(null, tx.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="flex flex-col gap-3 sm:hidden">
                {transactions.map((tx) => (
                  <li key={tx.id}>
                    <Card>
                      <CardContent className="flex flex-col gap-1 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{tx.date}</span>
                          <span
                            className={
                              "font-medium " +
                              (tx.type === "income" ? "text-brand" : "text-foreground")
                            }
                          >
                            {tx.type === "income" ? "+" : "−"}
                            {formatTenge(tx.amount)}
                          </span>
                        </div>
                        <span className="font-medium">{categoryLabel(tx.categories?.slug)}</span>
                        {tx.description && (
                          <span className="text-sm text-muted-foreground">
                            {tx.description}
                          </span>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {sourceLabel(tx.source)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/operations/${tx.id}/edit`}>{t("editButton")}</Link>
                            </Button>
                            <DeleteButton action={deleteTransaction.bind(null, tx.id)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 text-sm">
                  {page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={{
                          pathname: "/operations",
                          query: { ...params, page: String(page - 1) },
                        }}
                      >
                        {t("pagination.prev")}
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      {t("pagination.prev")}
                    </Button>
                  )}
                  <span className="text-muted-foreground">
                    {t("pagination.page", { page, total: totalPages })}
                  </span>
                  {page < totalPages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={{
                          pathname: "/operations",
                          query: { ...params, page: String(page + 1) },
                        }}
                      >
                        {t("pagination.next")}
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      {t("pagination.next")}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
