import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimilarPokemon } from "@/components/SimilarPokemon";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SimilarPokemon", () => {
  it("renders a loading skeleton immediately on mount", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})), // never resolves — stay in loading
    );

    render(<SimilarPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);

    expect(screen.getByText("Similar to Eevee")).toBeInTheDocument();
    // The skeleton is aria-hidden and has no accessible text; assert it's
    // present by absence of any card/error content instead.
    expect(screen.queryByText("View Pokemon")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load similar Pokemon right now."),
    ).not.toBeInTheDocument();
  });

  it("renders same-type cards with real data on success", async () => {
    const items = [
      {
        name: "Flareon",
        imageUrl: "https://img.pokemondb.net/sprites/flareon.png",
        dexNumber: "136",
        types: ["Fire"],
        stats: { hp: 65, attack: 130, defense: 60, spAtk: 95, spDef: 110, speed: 65 },
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) }),
    );

    render(<SimilarPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);

    await waitFor(() => expect(screen.getByText("Flareon")).toBeInTheDocument());
    expect(screen.getByText("#136")).toBeInTheDocument();
    expect(screen.getByText("Fire")).toBeInTheDocument();
    // Two highest real stats: Attack (130) and Sp. Def (110).
    expect(screen.getByText("Strong in: Attack, Sp. Def")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Pokemon" })).toHaveAttribute(
      "href",
      "/pokemon/Flareon",
    );
  });

  it("shows a distinct empty message when the request succeeds with zero items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }),
    );

    render(<SimilarPokemon pokemonName="Ditto" pokemonTypes={["Normal"]} />);

    await waitFor(() =>
      expect(screen.getByText("No similar Pokemon found for Ditto.")).toBeInTheDocument(),
    );
  });

  it("shows a distinct error message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    render(<SimilarPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);

    await waitFor(() =>
      expect(screen.getByText("Couldn't load similar Pokemon right now.")).toBeInTheDocument(),
    );
  });

  it("shows a distinct error message on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<SimilarPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);

    await waitFor(() =>
      expect(screen.getByText("Couldn't load similar Pokemon right now.")).toBeInTheDocument(),
    );
  });
});
