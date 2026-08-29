import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvolutionChain } from "@/components/EvolutionChain";

describe("EvolutionChain", () => {
  it("shows a no-data message when there is neither a from nor any to", () => {
    render(<EvolutionChain to={[]} current="Ditto" />);
    expect(screen.getByText("No evolution data available for Ditto.")).toBeInTheDocument();
  });

  it("renders only the current Pokemon plus a from-link when to is empty", () => {
    render(<EvolutionChain from="Charmander" to={[]} current="Charmeleon" />);
    expect(screen.getByRole("link", { name: "Charmander" })).toHaveAttribute(
      "href",
      "/pokemon/Charmander",
    );
    expect(screen.getByText("Charmeleon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Charmeleon" })).not.toBeInTheDocument();
  });

  it("renders links for every to-evolution, in order", () => {
    render(<EvolutionChain to={["Ivysaur", "Venusaur"]} current="Bulbasaur" />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Ivysaur", "Venusaur"]);
    expect(links[0]).toHaveAttribute("href", "/pokemon/Ivysaur");
    expect(links[1]).toHaveAttribute("href", "/pokemon/Venusaur");
  });

  it("renders a full from -> current -> to chain", () => {
    render(<EvolutionChain from="Charmander" to={["Charizard"]} current="Charmeleon" />);
    expect(screen.getByRole("link", { name: "Charmander" })).toBeInTheDocument();
    expect(screen.getByText("Charmeleon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Charizard" })).toBeInTheDocument();
  });

  it("URL-encodes a name that needs it", () => {
    render(<EvolutionChain to={["Mr. Mime"]} current="X" />);
    expect(screen.getByRole("link", { name: "Mr. Mime" })).toHaveAttribute(
      "href",
      "/pokemon/Mr.%20Mime",
    );
  });
});
