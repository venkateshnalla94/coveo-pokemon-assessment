import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchBoxState } from "@coveo/headless";

const { searchBoxMock } = vi.hoisted(() => {
  const searchBoxMock: {
    state: SearchBoxState;
    subscribe: (listener: () => void) => () => void;
    updateText: ReturnType<typeof vi.fn>;
    selectSuggestion: ReturnType<typeof vi.fn>;
    submit: ReturnType<typeof vi.fn>;
    showSuggestions: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  } = {
    state: {
      value: "",
      suggestions: [],
      isLoading: false,
      isLoadingSuggestions: false,
      searchBoxId: "search-box",
    },
    subscribe: vi.fn(() => () => {}),
    updateText: vi.fn(),
    selectSuggestion: vi.fn(),
    submit: vi.fn(),
    showSuggestions: vi.fn(),
    clear: vi.fn(),
  };
  return { searchBoxMock };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({})),
}));

vi.mock("@/coveo/config", () => ({
  isCoveoConfigured: vi.fn(() => true),
}));

vi.mock("@coveo/headless", () => ({
  buildSearchBox: vi.fn(() => searchBoxMock),
}));

import { SearchBox } from "@/components/SearchBox";

function suggestion(rawValue: string) {
  return { rawValue, highlightedValue: rawValue };
}

describe("SearchBox — typeahead keyboard traversal", () => {
  beforeEach(() => {
    searchBoxMock.state = {
      value: "",
      suggestions: [suggestion("pikachu"), suggestion("eevee"), suggestion("charizard")],
      isLoading: false,
      isLoadingSuggestions: false,
      searchBoxId: "search-box",
    };
    searchBoxMock.updateText.mockClear();
    searchBoxMock.selectSuggestion.mockClear();
    searchBoxMock.submit.mockClear();
    searchBoxMock.showSuggestions.mockClear();
  });

  it("renders the input as a combobox collapsed until focused", () => {
    render(<SearchBox />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("expands the listbox on focus and calls showSuggestions()", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    await user.click(screen.getByRole("combobox"));

    expect(searchBoxMock.showSuggestions).toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true");
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("closes the listbox on blur", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchBox />
        <button type="button">elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
  });

  it("ArrowDown/ArrowUp move aria-activedescendant across options, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    const input = screen.getByRole("combobox");
    await user.click(input);

    const options = screen.getAllByRole("option");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[0]!.id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1]!.id);

    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[2]!.id);

    // Already at the last option — ArrowDown does not wrap past the end.
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[2]!.id);

    await user.keyboard("{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1]!.id);
  });

  it("Escape closes the listbox without clearing the query", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(searchBoxMock.clear).not.toHaveBeenCalled();
  });

  it("Enter with a highlighted option selects that suggestion, not a raw submit", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    const input = screen.getByRole("combobox");
    await user.click(input);

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(searchBoxMock.selectSuggestion).toHaveBeenCalledWith("eevee");
    expect(searchBoxMock.submit).not.toHaveBeenCalled();
  });

  it("Enter with nothing highlighted submits the typed query instead", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    const input = screen.getByRole("combobox");
    await user.click(input);

    await user.keyboard("{Enter}");

    expect(searchBoxMock.submit).toHaveBeenCalledTimes(1);
    expect(searchBoxMock.selectSuggestion).not.toHaveBeenCalled();
  });

  it("clicking a suggestion selects it via mouse, using onMouseDown to survive the blur race", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    await user.click(screen.getByRole("combobox"));

    await user.click(screen.getByText("charizard"));
    expect(searchBoxMock.selectSuggestion).toHaveBeenCalledWith("charizard");
  });

  it("typing calls searchBox.updateText with the new value", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    await user.type(screen.getByRole("combobox"), "p");
    expect(searchBoxMock.updateText).toHaveBeenCalledWith("p");
  });
});
