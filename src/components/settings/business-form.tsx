"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { SIMPLIFIED_RATE_OPTIONS } from "@/lib/tax/config";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  business: { name: string; type: string; tax_regime: string; tax_rate: number };
  locale: string;
  hasError?: boolean;
  saved?: boolean;
};

export function BusinessForm({ action, business, locale, hasError, saved }: Props) {
  const t = useTranslations("settings");
  const tOnboarding = useTranslations("onboarding");
  const [taxRegime, setTaxRegime] = useState(business.tax_regime);

  return (
    <form action={action}>
      <CardContent className="flex flex-col gap-4">
        {hasError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t("error")}
          </p>
        )}
        {saved && !hasError && (
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
          <select id="type" name="type" className={selectClassName} defaultValue={business.type} required>
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
            value={taxRegime}
            onChange={(e) => setTaxRegime(e.target.value)}
            required
          >
            <option value="simplified">{tOnboarding("taxRegimeOptions.simplified")}</option>
            <option value="patent">{tOnboarding("taxRegimeOptions.patent")}</option>
            <option value="retail_tax">{tOnboarding("taxRegimeOptions.retail_tax")}</option>
            <option value="general">{tOnboarding("taxRegimeOptions.general")}</option>
          </select>
        </div>

        {taxRegime === "simplified" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taxRate">{t("taxRateLabel")}</Label>
            <select
              id="taxRate"
              name="taxRate"
              className={selectClassName}
              defaultValue={String(business.tax_rate)}
            >
              {SIMPLIFIED_RATE_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="language">{tOnboarding("languageLabel")}</Label>
          <select id="language" name="language" className={selectClassName} defaultValue={locale}>
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
  );
}
