"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Catches render/action errors anywhere under a locale — in particular a
// stale Server Action reference after a new deployment (the browser still
// has the previous build's JS, whose action IDs the new deployment no
// longer recognizes). A plain `reset()` re-renders the same stale client
// tree and wouldn't fix that; only an actual reload fetches the new bundle.
export default function LocaleError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    console.error("[error-boundary]", error.message, error.digest ? `(digest: ${error.digest})` : "");
  }, [error]);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo className="h-8 w-auto" />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Button onClick={() => window.location.reload()}>{t("reloadButton")}</Button>
    </main>
  );
}
