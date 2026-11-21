"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const localeNames: Record<string, string> = {
  ru: "Русский",
  kk: "Қазақша",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function onChange(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- pathname comes from next-intl's typed navigation
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <Select value={locale} onValueChange={onChange}>
      <SelectTrigger aria-label={t("label")} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {routing.locales.map((value) => (
          <SelectItem key={value} value={value}>
            {localeNames[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
