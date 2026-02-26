import { describe, it, expect } from "vitest";

// Replicate the domain validation logic from lib/auth/config.ts and server/actions/auth.ts
// These are not exported directly, so we test the algorithm as a pure function.

const ALLOWED_EMAIL_DOMAINS = ["stanzasoft.com"];

/**
 * Replicates the isAllowedEmail function from lib/auth/config.ts
 */
function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

/**
 * Replicates the domain check from server/actions/auth.ts (registerUser/loginUser)
 * Returns an error message or null if valid.
 */
function validateEmailDomain(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return "Only @stanzasoft.com email addresses are allowed";
  }
  return null;
}

describe("Domain Validation", () => {
  describe("isAllowedEmail (auth config)", () => {
    describe("valid stanzasoft.com emails", () => {
      it("should accept standard stanzasoft.com email", () => {
        expect(isAllowedEmail("user@stanzasoft.com")).toBe(true);
      });

      it("should accept email with dots in local part", () => {
        expect(isAllowedEmail("first.last@stanzasoft.com")).toBe(true);
      });

      it("should accept email with plus addressing", () => {
        expect(isAllowedEmail("user+tag@stanzasoft.com")).toBe(true);
      });

      it("should accept email with numbers", () => {
        expect(isAllowedEmail("user123@stanzasoft.com")).toBe(true);
      });

      it("should accept email with mixed case domain (case insensitive)", () => {
        expect(isAllowedEmail("user@STANZASOFT.COM")).toBe(true);
        expect(isAllowedEmail("user@StanzaSoft.Com")).toBe(true);
        expect(isAllowedEmail("user@Stanzasoft.COM")).toBe(true);
      });
    });

    describe("invalid domains", () => {
      it("should reject gmail.com", () => {
        expect(isAllowedEmail("user@gmail.com")).toBe(false);
      });

      it("should reject outlook.com", () => {
        expect(isAllowedEmail("user@outlook.com")).toBe(false);
      });

      it("should reject nexus.com (old test domain)", () => {
        expect(isAllowedEmail("admin@nexus.com")).toBe(false);
      });

      it("should reject similar but different domains", () => {
        expect(isAllowedEmail("user@stanzasoft.io")).toBe(false);
        expect(isAllowedEmail("user@stanzasoft.org")).toBe(false);
        expect(isAllowedEmail("user@stanzasoft.net")).toBe(false);
      });

      it("should reject subdomain of allowed domain", () => {
        expect(isAllowedEmail("user@mail.stanzasoft.com")).toBe(false);
      });

      it("should reject domain that contains the allowed domain", () => {
        expect(isAllowedEmail("user@notstanzasoft.com")).toBe(false);
      });

      it("should reject empty domain", () => {
        expect(isAllowedEmail("user@")).toBe(false);
      });
    });

    describe("null/undefined/empty inputs", () => {
      it("should reject null", () => {
        expect(isAllowedEmail(null)).toBe(false);
      });

      it("should reject undefined", () => {
        expect(isAllowedEmail(undefined)).toBe(false);
      });

      it("should reject empty string", () => {
        expect(isAllowedEmail("")).toBe(false);
      });
    });

    describe("malformed emails", () => {
      it("should reject email without @ symbol", () => {
        expect(isAllowedEmail("userstanzasoft.com")).toBe(false);
      });

      it("should reject email with multiple @ symbols", () => {
        // split("@")[1] would give "second" which is not stanzasoft.com
        expect(isAllowedEmail("user@second@stanzasoft.com")).toBe(false);
      });

      it("should reject just a domain name", () => {
        expect(isAllowedEmail("stanzasoft.com")).toBe(false);
      });

      it("should accept email with space in local part (domain still matches)", () => {
        // The isAllowedEmail function only checks domain, not local part validity.
        // "user @stanzasoft.com".split("@")[1] = "stanzasoft.com" which matches.
        expect(isAllowedEmail("user @stanzasoft.com")).toBe(true);
      });
    });
  });

  describe("validateEmailDomain (server actions)", () => {
    it("should return null for valid stanzasoft.com email", () => {
      expect(validateEmailDomain("user@stanzasoft.com")).toBeNull();
    });

    it("should return error message for non-stanzasoft domain", () => {
      const error = validateEmailDomain("user@gmail.com");
      expect(error).toBe(
        "Only @stanzasoft.com email addresses are allowed"
      );
    });

    it("should return error message for empty domain part", () => {
      const error = validateEmailDomain("user@");
      expect(error).not.toBeNull();
    });

    it("should handle case-insensitive domain check", () => {
      expect(validateEmailDomain("user@STANZASOFT.COM")).toBeNull();
      expect(validateEmailDomain("user@StanzaSoft.Com")).toBeNull();
    });
  });

  describe("Domain restriction coverage", () => {
    it("ALLOWED_EMAIL_DOMAINS should only contain stanzasoft.com", () => {
      expect(ALLOWED_EMAIL_DOMAINS).toEqual(["stanzasoft.com"]);
      expect(ALLOWED_EMAIL_DOMAINS).toHaveLength(1);
    });

    it("should consistently reject the same set of domains in both functions", () => {
      const testEmails = [
        "user@gmail.com",
        "user@yahoo.com",
        "user@hotmail.com",
        "admin@nexus.com",
        "user@stanzasoft.io",
      ];

      testEmails.forEach((email) => {
        expect(isAllowedEmail(email)).toBe(false);
        expect(validateEmailDomain(email)).not.toBeNull();
      });
    });

    it("should consistently accept stanzasoft.com in both functions", () => {
      const validEmails = [
        "admin@stanzasoft.com",
        "satyavyshnavi@stanzasoft.com",
        "dev.team@stanzasoft.com",
        "test+filter@stanzasoft.com",
      ];

      validEmails.forEach((email) => {
        expect(isAllowedEmail(email)).toBe(true);
        expect(validateEmailDomain(email)).toBeNull();
      });
    });
  });
});
