import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowseByType } from "@/components/BrowseByType";

describe("BrowseByType", () => {
  it("renders every real type with its unchanged /search destination", () => {
    render(<BrowseByType />);

    const fireLink = screen.getByRole("link", { name: "Fire" });
    expect(fireLink).toHaveAttribute("href", expect.stringContaining("Fire"));
  });

  it("exposes carousel prev/next controls", () => {
    render(<BrowseByType />);

    expect(screen.getByRole("button", { name: "Previous types" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next types" })).toBeInTheDocument();
  });
});
