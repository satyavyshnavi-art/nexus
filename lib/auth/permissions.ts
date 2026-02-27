import type { UserRole } from "@prisma/client";

export function canCreateTasks(role: UserRole): boolean {
  return role === "admin" || role === "developer" || role === "reviewer";
}

export function canLinkGitHub(role: UserRole): boolean {
  return role === "admin" || role === "developer";
}

export function canViewReports(role: UserRole): boolean {
  return role === "admin" || role === "developer";
}

export function canManageSprintSettings(role: UserRole): boolean {
  return role === "admin";
}

export function canGenerateAISprint(role: UserRole): boolean {
  return role === "admin" || role === "developer" || role === "reviewer";
}
