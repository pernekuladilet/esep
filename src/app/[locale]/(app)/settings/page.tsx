import { getLocale, getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/business/current";
import { updateBusiness } from "@/lib/business/actions";
import { deleteDemoData } from "@/lib/transactions/demo-data";
import { DeleteButton } from "@/components/transactions/delete-button";
import { BusinessForm } from "@/components/settings/business-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string; demoDeleted?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const { error, saved, demoDeleted } = await searchParams;
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();
  const t = await getTranslations("settings");

  const { count: demoCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("source", "demo");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <BusinessForm
          action={updateBusiness}
          business={business}
          locale={locale}
          hasError={Boolean(error)}
          saved={Boolean(saved)}
        />
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{t("demoData.title")}</CardTitle>
          <CardDescription>{t("demoData.subtitle")}</CardDescription>
        </CardHeader>
        {demoDeleted && (
          <CardContent>
            <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              {t("demoData.deleted")}
            </p>
          </CardContent>
        )}
        <CardFooter>
          {demoCount && demoCount > 0 ? (
            <DeleteButton
              action={deleteDemoData}
              variant="destructive"
              label={t("demoData.deleteButton")}
              confirmText={t("demoData.deleteConfirm")}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("demoData.none")}</p>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
