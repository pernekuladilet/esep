import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { loadGoogleFont } from "@/lib/og-font";

export const alt = "Esep";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = "Esep";
  const tagline = t("description");

  const fontData = await loadGoogleFont("Noto Sans", `${title}${tagline}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #0f766e 0%, #0f172a 70%)",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 700,
              color: "#0f766e",
            }}
          >
            E
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#ffffff" }}>
            {title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#ccfbf1",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans", data: fontData, style: "normal", weight: 700 }]
        : undefined,
    },
  );
}
