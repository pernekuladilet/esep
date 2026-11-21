import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        {t("description")}
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        {t("footer", { year: new Date().getFullYear() })}
      </p>
    </main>
  );
}
