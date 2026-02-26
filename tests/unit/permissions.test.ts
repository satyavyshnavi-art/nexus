import { describe, it, expect } from "vitest";
import {
  canCreateTasks,
  canLinkGitHub,
  canViewReports,
  canManageSprintSettings,
} from "@/lib/auth/permissions";

// Use string literals matching the Prisma UserRole enum values
type UserRole = "admin" | "developer" | "reviewer";

describe("Permission Functions", () => {
  const allRoles: UserRole[] = ["admin", "developer", "reviewer"];

  describe("canCreateTasks", () => {
    it("should return true for admin", () => {
      expect(canCreateTasks("admin")).toBe(true);
    });

    it("should return true for developer", () => {
      expect(canCreateTasks("developer")).toBe(true);
    });

    it("should return true for reviewer", () => {
      expect(canCreateTasks("reviewer")).toBe(true);
    });

    it("should return true for all three roles", () => {
      allRoles.forEach((role) => {
        expect(canCreateTasks(role)).toBe(true);
      });
    });
  });

  describe("canLinkGitHub", () => {
    it("should return true for admin", () => {
      expect(canLinkGitHub("admin")).toBe(true);
    });

    it("should return true for developer", () => {
      expect(canLinkGitHub("developer")).toBe(true);
    });

    it("should return false for reviewer", () => {
      expect(canLinkGitHub("reviewer")).toBe(false);
    });

    it("should only allow admin and developer", () => {
      const allowed = allRoles.filter((role) => canLinkGitHub(role));
      expect(allowed).toEqual(["admin", "developer"]);
    });
  });

  describe("canViewReports", () => {
    it("should return true for admin", () => {
      expect(canViewReports("admin")).toBe(true);
    });

    it("should return true for developer", () => {
      expect(canViewReports("developer")).toBe(true);
    });

    it("should return false for reviewer", () => {
      expect(canViewReports("reviewer")).toBe(false);
    });

    it("should only allow admin and developer", () => {
      const allowed = allRoles.filter((role) => canViewReports(role));
      expect(allowed).toEqual(["admin", "developer"]);
    });
  });

  describe("canManageSprintSettings", () => {
    it("should return true for admin", () => {
      expect(canManageSprintSettings("admin")).toBe(true);
    });

    it("should return false for developer", () => {
      expect(canManageSprintSettings("developer")).toBe(false);
    });

    it("should return false for reviewer", () => {
      expect(canManageSprintSettings("reviewer")).toBe(false);
    });

    it("should only allow admin", () => {
      const allowed = allRoles.filter((role) =>
        canManageSprintSettings(role)
      );
      expect(allowed).toEqual(["admin"]);
    });
  });

  describe("Permission hierarchy consistency", () => {
    it("admin should have all permissions", () => {
      expect(canCreateTasks("admin")).toBe(true);
      expect(canLinkGitHub("admin")).toBe(true);
      expect(canViewReports("admin")).toBe(true);
      expect(canManageSprintSettings("admin")).toBe(true);
    });

    it("developer should have create, link, and report permissions but not sprint settings", () => {
      expect(canCreateTasks("developer")).toBe(true);
      expect(canLinkGitHub("developer")).toBe(true);
      expect(canViewReports("developer")).toBe(true);
      expect(canManageSprintSettings("developer")).toBe(false);
    });

    it("reviewer should only have create tasks permission", () => {
      expect(canCreateTasks("reviewer")).toBe(true);
      expect(canLinkGitHub("reviewer")).toBe(false);
      expect(canViewReports("reviewer")).toBe(false);
      expect(canManageSprintSettings("reviewer")).toBe(false);
    });
  });
});
