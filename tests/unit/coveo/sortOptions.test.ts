import { SortBy, SortOrder } from "@coveo/headless";
import { describe, expect, it } from "vitest";
import { POKEMON_FIELDS } from "@/coveo/fields";
import { SORT_OPTIONS } from "@/coveo/sortOptions";

describe("SORT_OPTIONS", () => {
  it("offers exactly Relevance / Name A-Z / Dex number / Base stat total / Speed, in that order", () => {
    expect(SORT_OPTIONS.map((option) => option.label)).toEqual([
      "Relevance",
      "Name A-Z",
      "Dex number",
      "Base stat total",
      "Speed (fastest first)",
    ]);
  });

  it("Relevance uses a real relevancy criterion, not a field sort", () => {
    expect(SORT_OPTIONS[0].criterion).toEqual({ by: SortBy.Relevancy });
  });

  it("every field-based option points at a real POKEMON_FIELDS entry, never an invented field name", () => {
    const realFieldNames = new Set<string>(Object.values(POKEMON_FIELDS));
    for (const option of SORT_OPTIONS.slice(1)) {
      expect(option.criterion.by).toBe(SortBy.Field);
      if (option.criterion.by === SortBy.Field) {
        expect(realFieldNames.has(option.criterion.field)).toBe(true);
      }
    }
  });

  it("sorts Name A-Z ascending, Dex number ascending, and Base stat total descending", () => {
    const nameOption = SORT_OPTIONS.find((o) => o.id === "name-asc");
    expect(nameOption?.criterion).toMatchObject({
      by: SortBy.Field,
      field: POKEMON_FIELDS.name,
      order: SortOrder.Ascending,
    });
  });

  it("sorts Dex number ascending, Base stat total descending, and Speed descending", () => {
    const dexOption = SORT_OPTIONS.find((o) => o.id === "dex-number-asc");
    const statTotalOption = SORT_OPTIONS.find((o) => o.id === "stat-total-desc");
    const speedOption = SORT_OPTIONS.find((o) => o.id === "speed-desc");
    expect(dexOption?.criterion).toMatchObject({ order: SortOrder.Ascending });
    expect(statTotalOption?.criterion).toMatchObject({ order: SortOrder.Descending });
    expect(speedOption?.criterion).toMatchObject({
      by: SortBy.Field,
      field: POKEMON_FIELDS.speed,
      order: SortOrder.Descending,
    });
  });
});
