import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export async function Header() {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");

  const links = [
    { href: "#how", label: t("how") },
    { href: "#features", label: t("features") },
    { href: "#audience", label: t("audience") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Esep">
          <Logo className="h-7 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/signup">{tCommon("startFree")}</Link>
          </Button>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
