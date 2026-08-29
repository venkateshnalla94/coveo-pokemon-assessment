import { describe, expect, it } from "vitest";
import { SPEED_RANGES } from "@/coveo/speedFacetRanges";

describe("SPEED_RANGES", () => {
  it("defines exactly four explicit, contiguous ranges with numeric-only labels", () => {
    expect(SPEED_RANGES.map((r) => r.label)).toEqual(["0-49", "50-89", "90-119", "120+"]);
  });

  it("never uses a qualitative label like Slow/Fast", () => {
    for (const { label } of SPEED_RANGES) {
      expect(label).toMatch(/^\d+(-\d+)?\+?$/);
    }
  });

  it("ranges are contiguous with no gaps or overlaps (end of one == start of the next)", () => {
    for (let i = 0; i < SPEED_RANGES.length - 1; i++) {
      expect(SPEED_RANGES[i].range.end).toBe(SPEED_RANGES[i + 1].range.start);
    }
  });

  it("the last range is end-inclusive (a real upper bound), the others are not", () => {
    expect(SPEED_RANGES.at(-1)?.range.endInclusive).toBe(true);
    for (const { range } of SPEED_RANGES.slice(0, -1)) {
      expect(range.endInclusive).toBeFalsy();
    }
  });
});
