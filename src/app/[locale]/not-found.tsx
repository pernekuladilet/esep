import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("title") };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo className="h-8 w-auto" />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Button asChild>
        <Link href="/">{t("backLink")}</Link>
      </Button>
    </main>
  );
}
