export type PluginStatus = "pending" | "approved" | "rejected" | "hidden";

export interface PluginStats {
  downloads_total?: number;
  downloads_weekly?: number;
  views_total?: number;
  views_weekly?: number;
  stars?: number;
}

export interface PluginVersion {
  id: string;
  version: string;
  download_url?: string;
  changelog?: string;
  downloads?: number;
  created?: string | null;
  pocketbase_version?: string;
}

export interface Plugin {
  id: string;
  collectionId?: string;
  collectionName?: string;
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
  stats?: PluginStats;
  versions?: PluginVersion[];
  status?: PluginStatus;
  created?: string;
  updated?: string;
}

export interface PluginListItem extends Plugin {
  downloads_total?: number;
  stars?: number;
}
