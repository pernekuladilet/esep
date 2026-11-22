"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type Props = {
  action: () => void | Promise<void>;
  label?: string;
  confirmText?: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

export function DeleteButton({ action, label, confirmText, variant = "ghost" }: Props) {
  const t = useTranslations("operations");

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText ?? t("deleteConfirm"))) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant={variant} size="sm">
        {label ?? t("deleteButton")}
      </Button>
    </form>
  );
}
