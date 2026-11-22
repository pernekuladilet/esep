import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBusiness } from "@/lib/business/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export default async function OnboardingPage() {
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: existingBusiness } = await supabase
    .from("businesses")
    .select("id")
    .limit(1);

  if (existingBusiness && existingBusiness.length > 0) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const t = await getTranslations("onboarding");

  return (
    <main className="mx-auto flex max-w-md flex-1 items-center px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <form action={createBusiness}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{t("businessNameLabel")}</Label>
              <Input
                id="name"
                name="name"
                placeholder={t("businessNamePlaceholder")}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">{t("typeLabel")}</Label>
              <select id="type" name="type" className={selectClassName} required defaultValue="">
                <option value="" disabled>
                  —
                </option>
                <option value="ip">{t("typeOptions.ip")}</option>
                <option value="too">{t("typeOptions.too")}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxRegime">{t("taxRegimeLabel")}</Label>
              <select
                id="taxRegime"
                name="taxRegime"
                className={selectClassName}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  —
                </option>
                <option value="simplified">{t("taxRegimeOptions.simplified")}</option>
                <option value="patent">{t("taxRegimeOptions.patent")}</option>
                <option value="retail_tax">{t("taxRegimeOptions.retail_tax")}</option>
                <option value="general">{t("taxRegimeOptions.general")}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="language">{t("languageLabel")}</Label>
              <select
                id="language"
                name="language"
                className={selectClassName}
                defaultValue={locale}
              >
                <option value="ru">{t("languageOptions.ru")}</option>
                <option value="kk">{t("languageOptions.kk")}</option>
                <option value="en">{t("languageOptions.en")}</option>
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              {t("submit")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
