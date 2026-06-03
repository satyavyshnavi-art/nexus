import { describe, it, expect } from "vitest";
import {
  buildReviewerAssignedEmail,
  shouldNotifyReviewer,
} from "@/lib/email/templates";

describe("buildReviewerAssignedEmail", () => {
  const input = {
    reviewerName: "Asha",
    taskTitle: "Fix login redirect",
    taskType: "bug",
    priority: "high",
    projectName: "Nexus",
    assignedByName: "Vyshnavi",
    taskUrl: "https://app.example.com/projects/p1?task=t1",
  };

  it("puts the task title in the subject", () => {
    const { subject } = buildReviewerAssignedEmail(input);
    expect(subject).toContain("Fix login redirect");
  });

  it("includes the task link in the html", () => {
    const { html } = buildReviewerAssignedEmail(input);
    expect(html).toContain("https://app.example.com/projects/p1?task=t1");
  });

  it("includes project name and assigner in the html", () => {
    const { html } = buildReviewerAssignedEmail(input);
    expect(html).toContain("Nexus");
    expect(html).toContain("Vyshnavi");
  });

  it("omits the priority row when priority is null", () => {
    const { html } = buildReviewerAssignedEmail({ ...input, priority: null });
    expect(html).not.toContain("Priority");
  });
});

describe("shouldNotifyReviewer", () => {
  it("returns true for a normal assignment", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: "u2",
        reviewerEmail: "u2@x.com",
      })
    ).toBe(true);
  });

  it("returns false when assigning yourself", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: "u1",
        reviewerEmail: "u1@x.com",
      })
    ).toBe(false);
  });

  it("returns false when reviewerId is null", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: null,
        reviewerEmail: "u2@x.com",
      })
    ).toBe(false);
  });

  it("returns false when reviewer has no email", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: "u2",
        reviewerEmail: null,
      })
    ).toBe(false);
  });
});
