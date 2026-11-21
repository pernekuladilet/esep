import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .limit(1)
    .maybeSingle();

  if (!business) {
    redirect({ href: "/onboarding", locale });
    return;
  }

  const t = await getTranslations("dashboard");

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("greeting", { name: business.name })}
      </h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          {t("signOut")}
        </Button>
      </form>
    </main>
  );
}
