import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const links = [
    { href: "#how", label: tNav("how") },
    { href: "#features", label: tNav("features") },
    { href: "#audience", label: tNav("audience") },
    { href: "#pricing", label: tNav("pricing") },
    { href: "#faq", label: tNav("faq") },
  ];

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo className="h-7 w-auto" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("tagline")}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        {t("rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
