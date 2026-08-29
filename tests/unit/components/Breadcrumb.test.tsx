import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "@/components/Breadcrumb";

describe("Breadcrumb", () => {
  it("degrades to Home / <Name> when no `from` is given", () => {
    render(<Breadcrumb name="Pikachu" />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Search results" })).not.toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toHaveAttribute("aria-current", "page");
  });

  it("renders the middle Search results crumb linking to `from` when provided", () => {
    render(<Breadcrumb name="Pikachu" from="/search?q=pika" />);
    const searchResults = screen.getByRole("link", { name: "Search results" });
    expect(searchResults).toHaveAttribute("href", "/search?q=pika");
  });

  it("marks the current Pokemon name as the active breadcrumb item", () => {
    render(<Breadcrumb name="Eevee" from="/search" />);
    const current = screen.getByText("Eevee");
    expect(current).toHaveAttribute("aria-current", "page");
  });
});
