"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function DeleteButton({ action }: { action: () => void | Promise<void> }) {
  const t = useTranslations("operations");

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(t("deleteConfirm"))) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        {t("deleteButton")}
      </Button>
    </form>
  );
}
