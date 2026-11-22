import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/business/current";
import { updateTransaction } from "@/lib/transactions/actions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { tiynToTengeInput } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditOperationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();

  const [{ data: transaction }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, date, type, category_id, amount, description, counterparty")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase.from("categories").select("id, slug, type").eq("is_system", true).order("slug"),
  ]);

  if (!transaction) {
    notFound();
  }

  const action = updateTransaction.bind(null, id);

  return (
    <main className="mx-auto flex max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <TransactionForm
        categories={categories ?? []}
        action={action}
        hasError={Boolean(error)}
        initialValues={{
          date: transaction.date,
          type: transaction.type,
          categoryId: transaction.category_id ?? "",
          amount: tiynToTengeInput(transaction.amount),
          description: transaction.description ?? "",
          counterparty: transaction.counterparty ?? "",
        }}
      />
    </main>
  );
}
