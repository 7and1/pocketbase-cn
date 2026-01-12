/**
 * Escape HTML special characters to prevent XSS attacks.
 * Use this for displaying user-generated content that should NOT contain HTML.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Unescape HTML entities (for display purposes only).
 */
export function unescapeHtml(text: string): string {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.documentElement.textContent || "";
}
