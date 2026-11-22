"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/business/current";
import { tengeToTiyn } from "@/lib/format";
import { TRANSACTION_TYPES, type TransactionType } from "@/lib/transactions/constants";

type TransactionInput = {
  date: string;
  type: TransactionType;
  categoryId: string;
  amountTiyn: number;
  description: string | null;
  counterparty: string | null;
};

function parseInput(formData: FormData): TransactionInput | null {
  const date = String(formData.get("date") ?? "");
  const type = String(formData.get("type") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const amountTiyn = tengeToTiyn(String(formData.get("amount") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const counterparty = String(formData.get("counterparty") ?? "").trim();

  if (
    !date ||
    !TRANSACTION_TYPES.includes(type as TransactionType) ||
    !categoryId ||
    amountTiyn === null ||
    amountTiyn <= 0
  ) {
    return null;
  }

  return {
    date,
    type: type as TransactionType,
    categoryId,
    amountTiyn,
    description: description || null,
    counterparty: counterparty || null,
  };
}

export async function createTransaction(formData: FormData) {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  const input = parseInput(formData);
  if (!input) {
    redirect({ href: "/operations/new?error=1", locale });
    return;
  }

  const { error } = await supabase.from("transactions").insert({
    business_id: business.id,
    date: input.date,
    type: input.type,
    category_id: input.categoryId,
    amount: input.amountTiyn,
    description: input.description,
    counterparty: input.counterparty,
    source: "manual",
  });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[transactions] createTransaction failed:", error.message);
    }
    redirect({ href: "/operations/new?error=1", locale });
    return;
  }

  redirect({ href: "/operations", locale });
}

export async function updateTransaction(id: string, formData: FormData) {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  const input = parseInput(formData);
  if (!input) {
    redirect({ href: `/operations/${id}/edit?error=1`, locale });
    return;
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      date: input.date,
      type: input.type,
      category_id: input.categoryId,
      amount: input.amountTiyn,
      description: input.description,
      counterparty: input.counterparty,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[transactions] updateTransaction failed:", error.message);
    }
    redirect({ href: `/operations/${id}/edit?error=1`, locale });
    return;
  }

  redirect({ href: "/operations", locale });
}

export async function deleteTransaction(id: string) {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  await supabase.from("transactions").delete().eq("id", id).eq("business_id", business.id);

  redirect({ href: "/operations", locale });
}
