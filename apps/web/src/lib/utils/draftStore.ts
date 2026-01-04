const DRAFT_PREFIX = "pb_draft_";
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface DraftData {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface DraftMetadata {
  key: string;
  updatedAt: number;
  expiresAt: number;
  fields: string[];
}

function getDraftKey(formType: string, mode: string = "create"): string {
  return `${DRAFT_PREFIX}${formType}_${mode}`;
}

export function saveDraft(
  formType: string,
  data: DraftData,
  mode: string = "create",
): void {
  if (typeof window === "undefined") return;

  const key = getDraftKey(formType, mode);
  const now = Date.now();

  const draft = {
    data,
    updatedAt: now,
    expiresAt: now + DRAFT_EXPIRY_MS,
  };

  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage full or unavailable
  }
}

export function loadDraft(
  formType: string,
  mode: string = "create",
): DraftData | null {
  if (typeof window === "undefined") return null;

  const key = getDraftKey(formType, mode);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const draft = JSON.parse(raw) as {
      data: DraftData;
      updatedAt: number;
      expiresAt: number;
    };

    // Check expiry
    if (Date.now() > draft.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return draft.data;
  } catch {
    return null;
  }
}

export function clearDraft(formType: string, mode: string = "create"): void {
  if (typeof window === "undefined") return;

  const key = getDraftKey(formType, mode);
  localStorage.removeItem(key);
}

export function hasDraft(formType: string, mode: string = "create"): boolean {
  if (typeof window === "undefined") return false;

  const key = getDraftKey(formType, mode);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;

    const draft = JSON.parse(raw) as {
      data: DraftData;
      updatedAt: number;
      expiresAt: number;
    };

    // Check expiry
    if (Date.now() > draft.expiresAt) {
      localStorage.removeItem(key);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getAllDrafts(): DraftMetadata[] {
  if (typeof window === "undefined") return [];

  const drafts: DraftMetadata[] = [];
  const now = Date.now();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(DRAFT_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const draft = JSON.parse(raw) as {
        data: DraftData;
        updatedAt: number;
        expiresAt: number;
      };

      // Remove expired drafts
      if (now > draft.expiresAt) {
        localStorage.removeItem(key);
        continue;
      }

      // Extract form type from key: pb_draft_plugin_create -> plugin
      const match = key.match(
        new RegExp(`^${DRAFT_PREFIX}(.+)_(create|edit)$`),
      );
      if (match) {
        drafts.push({
          key: match[1],
          updatedAt: draft.updatedAt,
          expiresAt: draft.expiresAt,
          fields: Object.keys(draft.data),
        });
      }
    }
  } catch {
    // Ignore errors
  }

  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function clearAllDrafts(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}
