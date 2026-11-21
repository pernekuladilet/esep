import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 32"
      role="img"
      aria-label="Esep"
      className={cn("h-6 w-auto text-brand", className)}
    >
      <rect x="0" y="0" width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M8 17.5L13 22.5L24 10"
        fill="none"
        stroke="var(--brand-foreground)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="42"
        y="23"
        fontSize="20"
        fontWeight="600"
        letterSpacing="-0.02em"
        fill="currentColor"
        fontFamily="var(--font-sans), ui-sans-serif, system-ui, sans-serif"
      >
        Esep
      </text>
    </svg>
  );
}
