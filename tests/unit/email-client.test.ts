import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sendEmail } from "@/lib/email/client";

describe("sendEmail", () => {
  const original = process.env.RESEND_API_KEY;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original;
  });

  it("resolves without throwing when no API key is configured", async () => {
    await expect(
      sendEmail({ to: "a@x.com", subject: "hi", html: "<p>hi</p>" })
    ).resolves.toBeUndefined();
  });
});
