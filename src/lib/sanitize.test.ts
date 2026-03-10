import { describe, it, expect } from "vitest";
import { sanitizeBusinessReason } from "./sanitize";

describe("sanitizeBusinessReason", () => {
  it("returns empty string for undefined", () => {
    expect(sanitizeBusinessReason(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(sanitizeBusinessReason(null)).toBe("");
  });

  it("returns empty string for non-string types", () => {
    expect(sanitizeBusinessReason(42)).toBe("");
    expect(sanitizeBusinessReason(true)).toBe("");
    expect(sanitizeBusinessReason({})).toBe("");
    expect(sanitizeBusinessReason([])).toBe("");
  });

  it("trims whitespace", () => {
    expect(sanitizeBusinessReason("  Client meeting  ")).toBe("Client meeting");
    expect(sanitizeBusinessReason("\t\n  x  \n")).toBe("x");
  });

  it("caps at 50 characters", () => {
    const long = "a".repeat(60);
    expect(sanitizeBusinessReason(long)).toHaveLength(50);
    expect(sanitizeBusinessReason(long)).toBe("a".repeat(50));
  });

  it("strips control characters and DEL", () => {
    expect(sanitizeBusinessReason("foo\u0000bar")).toBe("foobar");
    expect(sanitizeBusinessReason("a\u001Fb")).toBe("ab");
    expect(sanitizeBusinessReason("x\u007Fy")).toBe("xy");
    expect(sanitizeBusinessReason("meet\u0001ing")).toBe("meeting");
  });

  it("leaves normal text unchanged when under 50 chars", () => {
    const normal = "Client meeting downtown";
    expect(sanitizeBusinessReason(normal)).toBe(normal);
  });

  it("trims then strips control chars then slices", () => {
    const withControl = "  " + "x".repeat(45) + "\u0000" + "y".repeat(10) + "  ";
    const stripped = "x".repeat(45) + "y".repeat(10);
    expect(sanitizeBusinessReason(withControl)).toBe(stripped.slice(0, 50));
  });
});
