import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NumericFacetState, NumericFacetValue } from "@coveo/headless";
import { SPEED_RANGES } from "@/coveo/speedFacetRanges";

const { facetMock } = vi.hoisted(() => {
  const facetMock: {
    state: NumericFacetState;
    subscribe: (listener: () => void) => () => void;
    toggleSelect: ReturnType<typeof vi.fn>;
  } = {
    state: { values: [] } as unknown as NumericFacetState,
    subscribe: vi.fn(() => () => {}),
    toggleSelect: vi.fn(),
  };
  return { facetMock };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({})),
}));

vi.mock("@coveo/headless", async (importOriginal) => {
  // Partial mock: only buildNumericFacet is faked (the controller boundary).
  // buildNumericRange stays real so SPEED_RANGES (imported by both this test
  // and FacetSpeed.tsx) keeps working unmodified.
  const actual = await importOriginal<typeof import("@coveo/headless")>();
  return {
    ...actual,
    buildNumericFacet: vi.fn(() => facetMock),
  };
});

import { FacetSpeed } from "@/components/FacetSpeed";

function value(index: number, overrides: Partial<NumericFacetValue> = {}): NumericFacetValue {
  const range = SPEED_RANGES[index]!.range;
  return {
    start: range.start,
    end: range.end,
    endInclusive: range.endInclusive ?? false,
    state: "idle",
    numberOfResults: 10,
    ...overrides,
  } as NumericFacetValue;
}

// The label wraps both the range text and the result-count span, so
// getByLabelText's exact-match accessible name never equals just the range
// text ("0-49") — find the row by its visible range text instead, then the
// checkbox within that row.
function checkboxFor(rangeLabel: string): HTMLElement {
  const row = screen.getByText(rangeLabel).closest("li");
  if (!row) {
    throw new Error(`No <li> row found for range label "${rangeLabel}"`);
  }
  return within(row).getByRole("checkbox");
}

describe("FacetSpeed", () => {
  beforeEach(() => {
    facetMock.toggleSelect.mockClear();
  });

  it("renders nothing when the facet has no values", () => {
    facetMock.state = { values: [] } as unknown as NumericFacetState;
    const { container } = render(<FacetSpeed />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a checkbox per range, using SPEED_RANGES' human label", () => {
    facetMock.state = { values: [value(0), value(1)] } as unknown as NumericFacetState;
    render(<FacetSpeed />);
    expect(checkboxFor("0-49")).toBeInTheDocument();
    expect(checkboxFor("50-89")).toBeInTheDocument();
  });

  it("falls back to a computed start-end label for a range not in SPEED_RANGES", () => {
    facetMock.state = {
      values: [{ start: 5, end: 15, endInclusive: false, state: "idle", numberOfResults: 2 }],
    } as unknown as NumericFacetState;
    render(<FacetSpeed />);
    expect(checkboxFor("5-15")).toBeInTheDocument();
  });

  it("checks the checkbox for a selected range value", () => {
    facetMock.state = {
      values: [value(0, { state: "selected" }), value(1)],
    } as unknown as NumericFacetState;
    render(<FacetSpeed />);
    expect(checkboxFor("0-49")).toBeChecked();
    expect(checkboxFor("50-89")).not.toBeChecked();
  });

  it("calls facet.toggleSelect(value) with the exact value object when a checkbox is clicked", async () => {
    const user = userEvent.setup();
    const v = value(0);
    facetMock.state = { values: [v] } as unknown as NumericFacetState;
    render(<FacetSpeed />);
    await user.click(checkboxFor("0-49"));
    expect(facetMock.toggleSelect).toHaveBeenCalledWith(v);
  });

  it("shows the numberOfResults next to each range", () => {
    facetMock.state = { values: [value(0, { numberOfResults: 42 })] } as unknown as NumericFacetState;
    render(<FacetSpeed />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
