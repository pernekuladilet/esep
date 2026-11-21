import { getTranslations } from "next-intl/server";
import { signIn } from "@/lib/auth/actions";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_CODES = ["invalidCredentials", "emailTaken", "weakPassword", "generic"] as const;
type ErrorCode = (typeof ERROR_CODES)[number];

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const errorCode = ERROR_CODES.find((code) => code === error) as ErrorCode | undefined;
  const t = await getTranslations("auth.login");
  const tErrors = await getTranslations("auth.errors");

  return (
    <main className="mx-auto flex max-w-sm flex-1 items-center px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <form action={signIn}>
          <CardContent className="flex flex-col gap-4">
            {errorCode && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {tErrors(errorCode)}
              </p>
            )}
            {next && <input type="hidden" name="next" value={next} />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input id="email" name="email" type="email" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button type="submit" className="w-full">
              {t("submit")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-foreground underline underline-offset-4">
                {t("signupLink")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
