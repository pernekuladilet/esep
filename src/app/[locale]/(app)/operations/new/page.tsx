import { requireBusiness } from "@/lib/business/current";
import { createTransaction } from "@/lib/transactions/actions";
import { TransactionForm } from "@/components/transactions/transaction-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewOperationPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const { supabase } = await requireBusiness();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, type")
    .eq("is_system", true)
    .order("slug");

  return (
    <main className="mx-auto flex max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <TransactionForm
        categories={categories ?? []}
        action={createTransaction}
        hasError={Boolean(error)}
      />
    </main>
  );
}
