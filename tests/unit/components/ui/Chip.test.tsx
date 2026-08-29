import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "@/components/ui/Chip";

describe("Chip", () => {
  it("defaults to the neutral variant with no inline color styling", () => {
    render(<Chip label="Overgrow" />);
    const chip = screen.getByText("Overgrow");
    expect(chip).toHaveAttribute("data-variant", "neutral");
    expect(chip.style.backgroundColor).toBe("");
    expect(chip.style.borderColor).toBe("");
  });

  it("applies the color as a ~12% alpha background and full-strength border for variant=type", () => {
    render(<Chip label="Fire" color="#F08030" variant="type" />);
    const chip = screen.getByText("Fire");
    expect(chip).toHaveAttribute("data-variant", "type");
    expect(chip.style.backgroundColor).toBe("rgba(240, 128, 48, 0.12)");
    expect(chip.style.borderColor).toBe("rgb(240, 128, 48)");
  });

  it("ignores a color prop when variant is neutral", () => {
    render(<Chip label="Ability" color="#F08030" variant="neutral" />);
    const chip = screen.getByText("Ability");
    expect(chip.style.backgroundColor).toBe("");
  });

  it("falls back to unstyled/neutral-looking output when variant=type but no color is given", () => {
    render(<Chip label="Unknown" variant="type" />);
    const chip = screen.getByText("Unknown");
    expect(chip.style.backgroundColor).toBe("");
    expect(chip.style.borderColor).toBe("");
  });

  it("always renders the label as text, never color alone", () => {
    render(<Chip label="Water" color="#6890F0" variant="type" />);
    expect(screen.getByText("Water")).toBeInTheDocument();
  });
});
