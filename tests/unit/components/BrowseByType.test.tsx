import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FacetState, FacetValue } from "@coveo/headless";

const { facetMock, buildFacetMock } = vi.hoisted(() => {
  const facetMock: {
    state: FacetState;
    subscribe: (listener: () => void) => () => void;
  } = {
    state: { values: [] } as unknown as FacetState,
    subscribe: vi.fn(() => () => {}),
  };
  const buildFacetMock = vi.fn(() => facetMock);
  return { facetMock, buildFacetMock };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({})),
}));

vi.mock("@coveo/headless", () => ({
  buildFacet: buildFacetMock,
}));

import { BrowseByType } from "@/components/BrowseByType";

function facetValue(value: string, numberOfResults = 5): FacetValue {
  return { value, state: "idle", numberOfResults } as FacetValue;
}

describe("BrowseByType", () => {
  it("renders nothing when the facet has no type values", () => {
    facetMock.state = { values: [] } as unknown as FacetState;
    const { container } = render(<BrowseByType />);
    expect(container).toBeEmptyDOMElement();
  });

  it("builds its facet with an explicit distinct facetId to avoid colliding with /search's Type facet", () => {
    render(<BrowseByType />);
    expect(buildFacetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        options: expect.objectContaining({ field: "pokemontype", facetId: "browse-by-type" }),
      }),
    );
  });

  it("renders a link per type value, into /search pre-filtered to that type", () => {
    facetMock.state = { values: [facetValue("Fire"), facetValue("Water")] } as unknown as FacetState;
    render(<BrowseByType />);
    expect(screen.getByRole("link", { name: /Fire/ })).toHaveAttribute(
      "href",
      "/search?f-pokemontype=Fire",
    );
    expect(screen.getByRole("link", { name: /Water/ })).toHaveAttribute(
      "href",
      "/search?f-pokemontype=Water",
    );
  });

  it("shows the live result count next to each type", () => {
    facetMock.state = { values: [facetValue("Fire", 63)] } as unknown as FacetState;
    render(<BrowseByType />);
    expect(screen.getByText("63")).toBeInTheDocument();
  });
});
