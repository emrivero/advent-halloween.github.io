import { describe, expect, it } from "vitest";
import {
  interleaveBlocks,
  isDateString,
  isUuid,
  normalizePlanDays,
  pickEvenlySpacedDays,
  shuffleInPlace,
} from "./plan";

describe("plan helpers", () => {
  it("reconoce UUID válidos y rechaza ids externos", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUuid("tt0133093")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it("valida fechas reales y normaliza su orden", () => {
    expect(isDateString("2026-10-31")).toBe(true);
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("31-10-2026")).toBe(false);
    expect(normalizePlanDays(["2026-10-31", "2026-10-01"])).toEqual([
      "2026-10-01",
      "2026-10-31",
    ]);
    expect(() =>
      normalizePlanDays(["2026-10-01", "2026-10-01"])
    ).toThrow("duplicados");
  });

  it("elige exactamente la cantidad solicitada y reparte las fechas", () => {
    const days = ["01", "02", "03", "04", "05", "06", "07"];
    expect(pickEvenlySpacedDays(days, 3)).toEqual(["01", "03", "05"]);
    expect(pickEvenlySpacedDays(days, 0)).toEqual([]);
    expect(pickEvenlySpacedDays(days, 20)).toEqual(days);
  });

  it("baraja de forma determinista al inyectar el generador", () => {
    expect(shuffleInPlace([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });

  it("intercala bloques sin mutarlos y conserva el orden de cada saga", () => {
    const blocks = [
      ["saga-1", "saga-2", "saga-3"],
      ["single-a"],
      ["single-b"],
    ];
    expect(interleaveBlocks(blocks, () => 0)).toEqual([
      "saga-1",
      "single-a",
      "single-b",
      "saga-2",
      "saga-3",
    ]);
    expect(blocks[0]).toEqual(["saga-1", "saga-2", "saga-3"]);
    expect(interleaveBlocks([], () => 0)).toEqual([]);
  });
});
