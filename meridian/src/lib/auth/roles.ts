import type { UserRole } from "@/types/database";

export const ROLE_HOME: Record<UserRole, string> = {
  investor: "/investor/dashboard",
  broker: "/broker/dashboard",
  developer: "/developer/dashboard",
  admin: "/admin/dashboard",
};

export const ROLE_PATH_PREFIX: Record<UserRole, string> = {
  investor: "/investor",
  broker: "/broker",
  developer: "/developer",
  admin: "/admin",
};

export function roleForPath(pathname: string): UserRole | null {
  for (const [role, prefix] of Object.entries(ROLE_PATH_PREFIX) as [UserRole, string][]) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}
