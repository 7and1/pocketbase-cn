export type ShowcaseStatus = "pending" | "approved" | "rejected" | "hidden";

export interface ShowcaseItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  repository?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  views?: number;
  votes?: number;
  content?: string;
  thumbnail?: string;
  screenshots?: string[];
  status?: ShowcaseStatus;
}
