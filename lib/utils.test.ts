import { describe, it, expect } from "vitest";
import { getErrorMessage } from "@/lib/utils";

describe("getErrorMessage", () => {
  it("extracts message from a native Error instance", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("extracts message from a plain object with a message property (Supabase's PostgrestError shape)", () => {
    // This is the exact bug class from the Phase 3 offer-response incident:
    // PostgrestError is a plain object, not `instanceof Error`, so a naive
    // `e instanceof Error ? e.message : fallback` check silently swallows it.
    const postgrestLikeError = { message: "Only the applicant can respond to this offer", code: "P0001" };
    expect(getErrorMessage(postgrestLikeError, "fallback")).toBe("Only the applicant can respond to this offer");
  });

  it("falls back when the thrown value has no usable message", () => {
    expect(getErrorMessage("just a string", "fallback")).toBe("fallback");
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getErrorMessage({ code: "P0001" }, "fallback")).toBe("fallback");
  });

  it("falls back when message property is not a string", () => {
    expect(getErrorMessage({ message: 42 }, "fallback")).toBe("fallback");
  });
});
