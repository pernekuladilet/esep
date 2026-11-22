import { notFound } from "next/navigation";

// Catches any path under a valid locale that doesn't match a real route.
// Without this, Next's router resolves "no match" before ever reaching the
// nested [locale]/not-found.tsx boundary and falls back to its own generic,
// unstyled 404 — explicitly calling notFound() from a child page is what
// actually triggers the sibling not-found.tsx (documented next-intl pattern).
export default function CatchAll() {
  notFound();
}
