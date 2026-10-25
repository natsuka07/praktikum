export const ROLES = ["admin", "owner", "customer"] as const;
export type Role = (typeof ROLES)[number];

/** Identitas user yang diambil dari JWT (bukan dari request body). */
export interface AuthUser {
  id: number;
  role: Role;
}
