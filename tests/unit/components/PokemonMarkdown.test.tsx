import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PokemonMarkdown } from "@/components/PokemonMarkdown";

describe("PokemonMarkdown", () => {
  it("renders plain markdown text", () => {
    render(<PokemonMarkdown text="Pikachu is an **Electric**-type Pokemon." />);
    expect(screen.getByText(/Pikachu is an/)).toBeInTheDocument();
    expect(screen.getByText("Electric")).toBeInTheDocument();
  });

  it("forces safe target/rel behavior on links", () => {
    render(<PokemonMarkdown text="[pokemondb](https://pokemondb.net/pokedex/pikachu)" />);
    const link = screen.getByRole("link", { name: "pokemondb" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(link).toHaveAttribute("href", "https://pokemondb.net/pokedex/pikachu");
  });

  it("demotes h1/h2 headings to styled h3 elements", () => {
    render(<PokemonMarkdown text={"# Big Heading\n\nBody text"} />);
    const heading = screen.getByRole("heading", { level: 3, name: "Big Heading" });
    expect(heading).toBeInTheDocument();
  });

  it("parses GFM pipe-table syntax into a styled table", () => {
    const table = "| Stat | Value |\n| --- | --- |\n| HP | 35 |";
    render(<PokemonMarkdown text={table} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    const header = screen.getByRole("columnheader", { name: "Stat" });
    expect(header).toHaveClass("bg-black/5");
    expect(screen.getByRole("cell", { name: "35" })).toBeInTheDocument();
  });

  it("never renders raw HTML embedded in the text as actual elements", () => {
    render(<PokemonMarkdown text={'<script>window.__pwned = true</script>text'} />);
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });
});
