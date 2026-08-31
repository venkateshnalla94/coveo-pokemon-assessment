import { describe, expect, it, vi } from "vitest";
import type { SearchEngine } from "@coveo/headless";

const { updateAdvancedSearchQueriesMock } = vi.hoisted(() => ({
  updateAdvancedSearchQueriesMock: vi.fn((payload: { aq: string }) => ({
    type: "advancedSearchQueries/update",
    payload,
  })),
}));

vi.mock("@coveo/headless", () => ({
  loadAdvancedSearchQueryActions: vi.fn(() => ({
    updateAdvancedSearchQueries: updateAdvancedSearchQueriesMock,
  })),
}));

import { clearBrowseByTypeFilter } from "@/coveo/advancedSearchQuery";

describe("clearBrowseByTypeFilter", () => {
  it("dispatches updateAdvancedSearchQueries with an empty aq", () => {
    const engine = { dispatch: vi.fn() } as unknown as SearchEngine;

    clearBrowseByTypeFilter(engine);

    expect(updateAdvancedSearchQueriesMock).toHaveBeenCalledWith({ aq: "" });
    expect(engine.dispatch).toHaveBeenCalledWith({
      type: "advancedSearchQueries/update",
      payload: { aq: "" },
    });
  });
});
