import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvolutionChain } from "@/components/EvolutionChain";

describe("EvolutionChain", () => {
  it("shows a no-data message when there is neither a from nor any to", () => {
    render(<EvolutionChain to={[]} current="Ditto" />);
    expect(screen.getByText("No evolution data available for Ditto.")).toBeInTheDocument();
  });

  it("renders only the current Pokemon plus a from-link when to is empty", () => {
    render(<EvolutionChain from={{ name: "Charmander" }} to={[]} current="Charmeleon" />);
    expect(screen.getByRole("link", { name: "Charmander" })).toHaveAttribute(
      "href",
      "/pokemon/Charmander",
    );
    expect(screen.getByText("Charmeleon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Charmeleon" })).not.toBeInTheDocument();
  });

  it("renders links for every to-evolution, in order", () => {
    render(<EvolutionChain to={[{ name: "Ivysaur" }, { name: "Venusaur" }]} current="Bulbasaur" />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Ivysaur", "Venusaur"]);
    expect(links[0]).toHaveAttribute("href", "/pokemon/Ivysaur");
    expect(links[1]).toHaveAttribute("href", "/pokemon/Venusaur");
  });

  it("renders a full from -> current -> to chain", () => {
    render(
      <EvolutionChain
        from={{ name: "Charmander" }}
        to={[{ name: "Charizard" }]}
        current="Charmeleon"
      />,
    );
    expect(screen.getByRole("link", { name: "Charmander" })).toBeInTheDocument();
    expect(screen.getByText("Charmeleon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Charizard" })).toBeInTheDocument();
  });

  it("URL-encodes a name that needs it", () => {
    render(<EvolutionChain to={[{ name: "Mr. Mime" }]} current="X" />);
    expect(screen.getByRole("link", { name: "Mr. Mime" })).toHaveAttribute(
      "href",
      "/pokemon/Mr.%20Mime",
    );
  });

  it("renders two same-named branches (e.g. regular vs. Alolan Raichu) as separate entries", () => {
    render(
      <EvolutionChain
        to={[
          { name: "Raichu", imageUrl: "https://img.pokemondb.net/sprites/home/normal/2x/raichu.jpg" },
          {
            name: "Raichu",
            imageUrl: "https://img.pokemondb.net/sprites/home/normal/2x/raichu-alolan.jpg",
          },
        ]}
        current="Pikachu"
      />,
    );
    const links = screen.getAllByRole("link", { name: "Raichu" });
    expect(links).toHaveLength(2);
  });

  it("renders a sprite image for a target that has one, and none for a target that doesn't", () => {
    const { container } = render(
      <EvolutionChain
        to={[{ name: "Pikachu", imageUrl: "https://img.pokemondb.net/sprites/home/normal/2x/pikachu.jpg" }]}
        current="Pichu"
      />,
    );
    // alt="" deliberately (see EvolutionChain.tsx) — decorative next to
    // identical visible text, so it has no accessible "img" role to query by.
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img?.getAttribute("src")).toContain("pikachu.jpg");
  });

  it("renders no image at all for a target with no imageUrl", () => {
    const { container } = render(<EvolutionChain to={[{ name: "Ditto" }]} current="X" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
