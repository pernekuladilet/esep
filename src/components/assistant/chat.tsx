"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SUMMARY_PERIOD_OPTIONS, type SummaryPeriod } from "@/lib/assistant/constants";

type ChatMessage = { role: "user" | "assistant"; content: string };
type StatusBanner = { type: "limit_reached" | "not_configured" | "error"; limit?: number; used?: number } | null;

const SUGGESTION_KEYS = ["whyProfitDown", "topSpending", "taxToSetAside", "whereToSave"] as const;

type Props = {
  locale: string;
  initialUsed: number;
  limit: number | null;
};

export function Chat({ locale, initialUsed, limit }: Props) {
  const t = useTranslations("assistant");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [periodOption, setPeriodOption] = useState<SummaryPeriod>("thisMonth");
  const [isStreaming, setIsStreaming] = useState(false);
  const [used, setUsed] = useState(initialUsed);
  const [status, setStatus] = useState<StatusBanner>(null);
  const abortRef = useRef<AbortController | null>(null);

  const overLimit = limit !== null && used >= limit;

  async function send(content: string) {
    if (!content.trim() || isStreaming || overLimit) return;

    setStatus(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, periodOption, locale }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessages(nextMessages); // drop the empty assistant placeholder
        if (response.status === 429) {
          setStatus({ type: "limit_reached", limit: data.limit, used: data.used });
        } else if (response.status === 503) {
          setStatus({ type: "not_configured" });
        } else {
          setStatus({ type: "error" });
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      }

      setUsed((prev) => prev + 1);
    } catch {
      setMessages(nextMessages);
      setStatus({ type: "error" });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={periodOption}
            onChange={(e) => setPeriodOption(e.target.value as SummaryPeriod)}
          >
            {SUMMARY_PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`period.${option}`)}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {limit === null ? t("usage.unlimited") : t("usage.count", { used, limit })}
          </span>
        </div>
      </div>

      <Card className="flex min-h-80 flex-col">
        <CardContent className="flex flex-1 flex-col gap-3 py-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {message.content || (isStreaming && index === messages.length - 1 ? "…" : "")}
            </div>
          ))}

          {status && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {status.type === "limit_reached" && t("limitReached")}
              {status.type === "not_configured" && t("notConfigured")}
              {status.type === "error" && t("genericError")}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={isStreaming || overLimit}
            onClick={() => void send(t(`suggestions.${key}`))}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            {t(`suggestions.${key}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          placeholder={t("inputPlaceholder")}
          disabled={isStreaming || overLimit}
          rows={2}
          className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        <Button type="submit" disabled={isStreaming || overLimit || !input.trim()}>
          {isStreaming ? t("sending") : t("send")}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
