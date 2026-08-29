import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AutomaticFacet, AutomaticFacetGeneratorState, FacetValue } from "@coveo/headless";
import { POKEMON_FIELDS } from "@/coveo/fields";

const { generatorMock, buildAutomaticFacetGeneratorMock } = vi.hoisted(() => {
  const generatorMock: {
    state: AutomaticFacetGeneratorState;
    subscribe: (listener: () => void) => () => void;
  } = {
    state: { automaticFacets: [] },
    subscribe: vi.fn(() => () => {}),
  };
  const buildAutomaticFacetGeneratorMock = vi.fn(() => generatorMock);
  return { generatorMock, buildAutomaticFacetGeneratorMock };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({})),
}));

vi.mock("@coveo/headless", () => ({
  buildAutomaticFacetGenerator: buildAutomaticFacetGeneratorMock,
}));

import { AutomaticFacets } from "@/components/AutomaticFacets";

function facetValue(value: string, overrides: Partial<FacetValue> = {}): FacetValue {
  return { value, state: "idle", numberOfResults: 5, ...overrides } as FacetValue;
}

function makeFacet(
  field: string,
  label: string,
  values: FacetValue[],
  toggleSelect = vi.fn(),
): AutomaticFacet {
  return {
    state: { field, label, values },
    toggleSelect,
    deselectAll: vi.fn(),
  } as unknown as AutomaticFacet;
}

function rowFor(text: string): HTMLElement {
  const row = screen.getByText(text).closest("li");
  if (!row) {
    throw new Error(`No <li> row found for "${text}"`);
  }
  return row;
}

describe("AutomaticFacets", () => {
  beforeEach(() => {
    generatorMock.state = { automaticFacets: [] };
  });

  it("renders nothing when the generator has no automatic facets", () => {
    const { container } = render(<AutomaticFacets />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one fieldset per automatic facet, using its label as the legend", () => {
    generatorMock.state = {
      automaticFacets: [
        makeFacet(POKEMON_FIELDS.generation, "Generation", [facetValue("Generation 9")]),
        makeFacet(POKEMON_FIELDS.eggGroups, "Egg Groups", [facetValue("Field")]),
      ],
    };
    render(<AutomaticFacets />);
    expect(screen.getByText("Generation")).toBeInTheDocument();
    expect(screen.getByText("Egg Groups")).toBeInTheDocument();
  });

  it("renders a color-coded Chip for type/weaknesses/resistances fields", () => {
    generatorMock.state = {
      automaticFacets: [makeFacet(POKEMON_FIELDS.type, "Type", [facetValue("Fire")])],
    };
    render(<AutomaticFacets />);
    const chip = screen.getByText("Fire");
    expect(chip).toHaveAttribute("data-variant", "type");
  });

  it("renders plain text (no Chip) for a non-color field like Generation", () => {
    generatorMock.state = {
      automaticFacets: [
        makeFacet(POKEMON_FIELDS.generation, "Generation", [facetValue("Generation 9")]),
      ],
    };
    render(<AutomaticFacets />);
    const text = screen.getByText("Generation 9");
    expect(text).not.toHaveAttribute("data-variant");
  });

  it("checks the checkbox for a selected value and calls toggleSelect with the exact value object", async () => {
    const user = userEvent.setup();
    const toggleSelect = vi.fn();
    const selected = facetValue("Fire", { state: "selected" });
    const idle = facetValue("Water");
    generatorMock.state = {
      automaticFacets: [makeFacet(POKEMON_FIELDS.type, "Type", [selected, idle], toggleSelect)],
    };
    render(<AutomaticFacets />);
    expect(within(rowFor("Fire")).getByRole("checkbox")).toBeChecked();
    expect(within(rowFor("Water")).getByRole("checkbox")).not.toBeChecked();

    await user.click(within(rowFor("Water")).getByRole("checkbox"));
    expect(toggleSelect).toHaveBeenCalledWith(idle);
  });

  it("shows numberOfResults next to each value", () => {
    generatorMock.state = {
      automaticFacets: [
        makeFacet(POKEMON_FIELDS.generation, "Generation", [
          facetValue("Generation 9", { numberOfResults: 120 }),
        ]),
      ],
    };
    render(<AutomaticFacets />);
    expect(screen.getByText("120")).toBeInTheDocument();
  });
});
