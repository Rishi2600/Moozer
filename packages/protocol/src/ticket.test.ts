import { describe, expect, it } from "vitest";

import { signTicket, verifyTicket } from "./ticket";

const SECRET = "test-secret-that-is-long-enough-123456";
const claims = { userId: "u1", name: "Maya Chen", spaceId: "s1" };

describe("realtime tickets", () => {
  it("verify with the same secret and give back the claims", () => {
    const ticket = verifyTicket(signTicket(claims, SECRET), SECRET);
    expect(ticket).toMatchObject(claims);
  });

  it("are rejected with the wrong secret", () => {
    expect(verifyTicket(signTicket(claims, SECRET), "another-secret-entirely-000000000")).toBeNull();
  });

  it("are rejected when the body is edited", () => {
    const [, signature] = signTicket(claims, SECRET).split(".");
    const forged = Buffer.from(JSON.stringify({ ...claims, spaceId: "s2", exp: 9999999999 })).toString("base64url");
    expect(verifyTicket(`${forged}.${signature}`, SECRET)).toBeNull();
  });

  it("expire after their time to live", () => {
    const issued = Date.UTC(2026, 9, 13, 20, 0, 0);
    const token = signTicket(claims, SECRET, 60, issued);
    expect(verifyTicket(token, SECRET, issued + 59_000)).not.toBeNull();
    expect(verifyTicket(token, SECRET, issued + 61_000)).toBeNull();
  });

  it("reject malformed input", () => {
    expect(verifyTicket("", SECRET)).toBeNull();
    expect(verifyTicket("abc", SECRET)).toBeNull();
    expect(verifyTicket("a.b.c", SECRET)).toBeNull();
  });
});
