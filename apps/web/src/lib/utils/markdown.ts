import { marked } from "marked";
import { sanitizeRichHtml } from "@/lib/utils/sanitize";

marked.setOptions({
  mangle: false,
  headerIds: true,
});

export function renderMarkdownSafe(markdown: string) {
  const raw = marked.parse(markdown || "");
  return sanitizeRichHtml(String(raw || ""));
}
