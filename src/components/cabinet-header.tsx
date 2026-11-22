import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export async function CabinetHeader({ businessName }: { businessName: string }) {
  const t = await getTranslations("cabinetNav");

  const links = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/operations", label: t("operations") },
    { href: "/taxes", label: t("taxes") },
    { href: "/reminders", label: t("reminders") },
    { href: "/assistant", label: t("assistant") },
    { href: "/settings", label: t("settings") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="Esep">
            <Logo className="h-7 w-auto" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground md:inline">
            {businessName}
          </span>
          <LocaleSwitcher />
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              {t("signOut")}
            </Button>
          </form>
        </div>
      </div>
      <nav className="flex items-center gap-4 overflow-x-auto border-t px-4 py-2 text-sm font-medium text-nowrap text-muted-foreground md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="shrink-0 hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
