export type UserRole = "user" | "contributor" | "moderator" | "admin";

export interface User {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  role?: UserRole;
  [key: string]: any;
}
