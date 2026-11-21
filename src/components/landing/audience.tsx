import { getTranslations } from "next-intl/server";
import { Store, Coffee, Scissors, ShoppingBag, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Segment = { title: string; description: string };

const icons: LucideIcon[] = [Store, Coffee, Scissors, ShoppingBag];

export async function Audience() {
  const t = await getTranslations("audience");
  const segments = t.raw("segments") as Segment[];

  return (
    <section id="audience" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((segment, index) => {
          const Icon = icons[index % icons.length];
          return (
            <li key={segment.title}>
              <Card className="h-full">
                <CardHeader>
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent">
                    <Icon className="size-5 text-accent-foreground" aria-hidden="true" />
                  </span>
                  <CardTitle className="mt-2 text-base">{segment.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {segment.description}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
