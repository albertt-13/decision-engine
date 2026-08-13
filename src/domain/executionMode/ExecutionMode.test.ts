import { describe, expect, it } from "vitest";
import { isValidExecutionMode, isWithinLiveModeGuardrail } from "./ExecutionMode.js";

describe("isValidExecutionMode", () => {
  it("acepta SHADOW y LIVE", () => {
    expect(isValidExecutionMode("SHADOW")).toBe(true);
    expect(isValidExecutionMode("LIVE")).toBe(true);
  });

  it("rechaza cualquier otro valor", () => {
    expect(isValidExecutionMode("shadow")).toBe(false);
    expect(isValidExecutionMode("")).toBe(false);
    expect(isValidExecutionMode("PAUSED")).toBe(false);
  });
});

describe("isWithinLiveModeGuardrail", () => {
  it("permite ejecutar si todavía no se llegó al máximo", () => {
    expect(isWithinLiveModeGuardrail(5, 20)).toBe(true);
  });

  it("bloquea al llegar al máximo", () => {
    expect(isWithinLiveModeGuardrail(20, 20)).toBe(false);
  });

  it("bloquea si ya se pasó del máximo", () => {
    expect(isWithinLiveModeGuardrail(25, 20)).toBe(false);
  });
});
