import { getLocale, getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/business/current";
import { updateBusiness } from "@/lib/business/actions";
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

type Props = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const { error, saved } = await searchParams;
  const locale = await getLocale();
  const { business } = await requireBusiness();
  const t = await getTranslations("settings");
  const tOnboarding = await getTranslations("onboarding");

  return (
    <main className="mx-auto flex max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <form action={updateBusiness}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t("error")}
              </p>
            )}
            {saved && !error && (
              <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                {t("saved")}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{tOnboarding("businessNameLabel")}</Label>
              <Input id="name" name="name" defaultValue={business.name} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">{tOnboarding("typeLabel")}</Label>
              <select
                id="type"
                name="type"
                className={selectClassName}
                defaultValue={business.type}
                required
              >
                <option value="ip">{tOnboarding("typeOptions.ip")}</option>
                <option value="too">{tOnboarding("typeOptions.too")}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxRegime">{tOnboarding("taxRegimeLabel")}</Label>
              <select
                id="taxRegime"
                name="taxRegime"
                className={selectClassName}
                defaultValue={business.tax_regime}
                required
              >
                <option value="simplified">{tOnboarding("taxRegimeOptions.simplified")}</option>
                <option value="patent">{tOnboarding("taxRegimeOptions.patent")}</option>
                <option value="retail_tax">{tOnboarding("taxRegimeOptions.retail_tax")}</option>
                <option value="general">{tOnboarding("taxRegimeOptions.general")}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="language">{tOnboarding("languageLabel")}</Label>
              <select
                id="language"
                name="language"
                className={selectClassName}
                defaultValue={locale}
              >
                <option value="ru">{tOnboarding("languageOptions.ru")}</option>
                <option value="kk">{tOnboarding("languageOptions.kk")}</option>
                <option value="en">{tOnboarding("languageOptions.en")}</option>
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
