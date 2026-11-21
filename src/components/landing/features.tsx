import { getTranslations } from "next-intl/server";
import {
  Wallet,
  UploadCloud,
  Sparkles,
  Calculator,
  BellRing,
  FileText,
  MessageCircle,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeatureItem = { title: string; description: string };

const icons: LucideIcon[] = [
  Wallet,
  UploadCloud,
  Sparkles,
  Calculator,
  BellRing,
  FileText,
  MessageCircle,
  Building2,
];

export async function Features() {
  const t = await getTranslations("features");
  const items = t.raw("items") as FeatureItem[];

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <li key={item.title}>
              <Card className="h-full">
                <CardHeader>
                  <Icon className="size-5 text-brand" aria-hidden="true" />
                  <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.description}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
