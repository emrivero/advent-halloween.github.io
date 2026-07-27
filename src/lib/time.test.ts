import { afterEach, describe, expect, it, vi } from "vitest";
import { getEffectiveToday } from "./time";

describe("getEffectiveToday", () => {
  afterEach(() => vi.useRealTimers());

  it("usa el día civil de Madrid antes y después de medianoche local", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-24T22:30:00Z"));
    expect(await getEffectiveToday()).toBe("2026-10-25");

    vi.setSystemTime(new Date("2026-12-31T23:30:00Z"));
    expect(await getEffectiveToday()).toBe("2027-01-01");
  });
});
