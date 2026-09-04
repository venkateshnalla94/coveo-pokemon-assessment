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

  it("shows the generic ask error message on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);
    askQuestion("How does it evolve?");

    await waitFor(() =>
      expect(
        screen.getByText("Couldn't get an answer right now. Please try again."),
      ).toBeInTheDocument(),
    );
  });

  it("shows the generic ask error message on an API error response, never the raw error body", async () => {
    // /api/passages returns { error: { code, message } } — an object, not a
    // string. Regression guard for the bug where this component typed it as
    // a string and rendered it directly, which crashes React ("Objects are
    // not valid as a React child") on any real API failure.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { code: "INVALID_BODY", message: "`query` must be a non-empty string." } }),
      }),
    );

    render(<AskAboutPokemon pokemonName="Eevee" pokemonTypes={["Normal"]} />);
    askQuestion("How does it evolve?");

    await waitFor(() =>
      expect(
        screen.getByText("Couldn't get an answer right now. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/must be a non-empty string/)).not.toBeInTheDocument();
  });
});
