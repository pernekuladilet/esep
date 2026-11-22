// next/og's ImageResponse (Satori) has no Cyrillic glyphs in its default
// fallback font, so ru/kk text would render as tofu boxes without an
// explicit font. This fetches just the glyphs actually used (via Google
// Fonts' `text` subsetting param) rather than the whole family.
export async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const match = css.match(/src: url\(([^)]+)\)/);
    if (!match) return null;

    const response = await fetch(match[1]);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    // Network hiccup or Google Fonts unreachable at build/request time —
    // the image still renders, just without this font (Latin text is fine
    // either way; only non-Latin glyphs would be affected).
    return null;
  }
}
