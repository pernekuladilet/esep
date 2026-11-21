import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function Hero() {
  const t = await getTranslations("hero");
  const tCommon = await getTranslations("common");

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 md:grid-cols-2 md:gap-12">
      <div className="flex flex-col items-start gap-5 text-left">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {t("eyebrow")}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <a href="#pricing">{tCommon("startFree")}</a>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <a href="#how">{t("ctaSecondary")}</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t("note")}</p>
      </div>

      <div className="hidden md:block" aria-hidden="true">
        <svg viewBox="0 0 360 260" className="w-full text-brand">
          <rect
            x="0.5"
            y="0.5"
            width="359"
            height="259"
            rx="20"
            fill="var(--card)"
            stroke="var(--border)"
          />
          <path
            d="M32 190 L96 150 L150 172 L214 100 L268 122 L328 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g fill="currentColor">
            <circle cx="32" cy="190" r="5" />
            <circle cx="96" cy="150" r="5" />
            <circle cx="150" cy="172" r="5" />
            <circle cx="214" cy="100" r="5" />
            <circle cx="268" cy="122" r="5" />
            <circle cx="328" cy="60" r="5" />
          </g>
          <path
            d="M32 190 L96 150 L150 172 L214 100 L268 122 L328 60 L328 210 L32 210 Z"
            fill="currentColor"
            opacity="0.08"
          />
        </svg>
      </div>
    </section>
  );
}
