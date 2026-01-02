export type PluginStatus = "pending" | "approved" | "rejected" | "hidden";

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  category?: string;
  repository?: string;
  homepage?: string;
  readme?: string;
  tags?: string[];
  license?: string;
  icon?: string;
  screenshots?: string[];
  featured?: boolean;
  verified?: boolean;
  github_stars?: number;
  github_updated_at?: string | null;
  stats?: {
    downloads_total?: number;
    downloads_weekly?: number;
    views_total?: number;
    views_weekly?: number;
    stars?: number;
  };
  versions?: Array<{
    id: string;
    version: string;
    download_url?: string;
    changelog?: string;
    downloads?: number;
    created?: string | null;
  }>;
}
