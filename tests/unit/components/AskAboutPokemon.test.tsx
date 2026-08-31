import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AskAboutPokemon } from "@/components/AskAboutPokemon";

afterEach(() => {
  vi.unstubAllGlobals();
});

function askQuestion(question: string) {
  fireEvent.change(screen.getByPlaceholderText(/how does/), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
}

describe("AskAboutPokemon", () => {
  it("stays idle (no results region visible) until a question is asked", () => {
    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);

    expect(screen.getByRole("button", { name: "Ask" })).toBeInTheDocument();
    expect(screen.queryByText("No relevant passages found for that question.")).not.toBeInTheDocument();
  });

  it("shows a loading skeleton immediately after asking", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})), // never resolves — stay in loading
    );

    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);
    askQuestion("How does it evolve?");

    expect(screen.getByRole("button", { name: "Asking..." })).toBeInTheDocument();
  });

  it("shows real passages with scores on success", async () => {
    const items = [
      {
        text: "Eevee evolves into one of several Eeveelutions.",
        relevanceScore: 0.873,
        document: { title: "Eevee Pokedex", primaryid: "doc-1" },
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) }));

    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);
    askQuestion("How does it evolve?");

    await waitFor(() =>
      expect(
        screen.getByText("Eevee evolves into one of several Eeveelutions."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Relevance: 87.3%")).toBeInTheDocument();
  });

  it("shows a distinct empty message when the request succeeds with zero passages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }));

    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);
    askQuestion("How does it evolve?");

    await waitFor(() =>
      expect(screen.getByText("No relevant passages found for that question.")).toBeInTheDocument(),
    );
  });

  it("shows a distinct error message on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);
    askQuestion("How does it evolve?");

    await waitFor(() =>
      expect(screen.getByText("Network error — could not reach the server.")).toBeInTheDocument(),
    );
  });
});
