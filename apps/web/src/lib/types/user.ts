export type UserRole = "user" | "contributor" | "moderator" | "admin";

export interface User {
  id: string;
  collectionId?: string;
  collectionName?: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  role?: UserRole;
  created?: string;
  updated?: string;
  emailVisibility?: boolean;
}
