import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Esep
      </Link>
      <LocaleSwitcher />
    </header>
  );
}
