import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tier = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
};

export async function Pricing() {
  const t = await getTranslations("pricing");
  const tiers = t.raw("tiers") as Record<"free" | "pro" | "business", Tier>;
  const order: Array<keyof typeof tiers> = ["free", "pro", "business"];

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-3">
        {order.map((key) => {
          const tier = tiers[key];
          const isPopular = key === "pro";

          return (
            <Card
              key={key}
              className={cn(
                "relative h-full",
                isPopular && "ring-2 ring-primary",
              )}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {isPopular && <Badge>{t("popularBadge")}</Badge>}
                </div>
                <CardDescription>{tier.description}</CardDescription>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-muted-foreground">
                      {tier.period}
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                >
                  <Link href="/signup">{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("disclaimer")}
      </p>
    </section>
  );
}
