import Anthropic from "@anthropic-ai/sdk";
import { maskPersonalName } from "@/lib/parsers/personal-name";
import { SYSTEM_CATEGORY_SLUGS as SYSTEM_SLUGS, isSystemCategorySlug as isSystemSlug } from "@/lib/categorize/slugs";

export type CategorizeItem = {
  index: number;
  description: string;
  type: "income" | "expense";
};

/**
 * One batched request for every rule-unmatched row in an import. Personal
 * names are masked before anything leaves this process — only merchant/
 * business text (not covered by the mask) is ever sent. Missing API key or
 * any failure degrades to "other" for every item rather than throwing.
 */
export async function categorizeWithClaude(
  items: CategorizeItem[],
): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (items.length === 0) return result;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    for (const item of items) result.set(item.index, "other");
    return result;
  }

  try {
    const client = new Anthropic({ apiKey });
    const masked = items.map((item) => ({
      index: item.index,
      description: maskPersonalName(item.description, item.type === "expense" ? "out" : "in"),
    }));

    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 4096,
      tool_choice: { type: "tool", name: "categorize" },
      tools: [
        {
          name: "categorize",
          description: "Assign one category slug to each transaction by index.",
          input_schema: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    slug: { type: "string", enum: SYSTEM_SLUGS as unknown as string[] },
                  },
                  required: ["index", "slug"],
                },
              },
            },
            required: ["categories"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content:
            `Категоризируй операции малого бизнеса в Казахстане (магазин/кофейня/салон) ` +
            `по одному из slug: ${SYSTEM_SLUGS.join(", ")}. Верни slug для каждого index.\n\n` +
            JSON.stringify(masked),
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use") {
      const input = toolUse.input as { categories?: { index: number; slug: string }[] };
      for (const entry of input.categories ?? []) {
        result.set(entry.index, isSystemSlug(entry.slug) ? entry.slug : "other");
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[categorize] Claude request failed:", (error as Error).message);
    }
  }

  for (const item of items) {
    if (!result.has(item.index)) result.set(item.index, "other");
  }

  return result;
}
