import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatBar } from "@/components/ui/StatBar";

describe("StatBar", () => {
  it("renders a muted dash instead of a zero-width meter when value is undefined", () => {
    render(<StatBar label="Speed" value={undefined} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  });

  it("renders a meter with the correct aria attributes and printed numeral", () => {
    render(<StatBar label="HP" value={100} />);
    const meter = screen.getByRole("meter", { name: "HP" });
    expect(meter).toHaveAttribute("aria-valuenow", "100");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "255");
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("scales the fill width proportionally to the default max (255)", () => {
    const { container } = render(<StatBar label="Attack" value={255} />);
    const fill = container.querySelector(".bg-black\\/85");
    expect(fill).toHaveStyle({ width: "100%" });
  });

  it("respects a custom max prop", () => {
    const { container } = render(<StatBar label="Custom" value={50} max={100} />);
    const meter = screen.getByRole("meter", { name: "Custom" });
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    const fill = container.querySelector(".bg-black\\/85");
    expect(fill).toHaveStyle({ width: "50%" });
  });

  it("clamps fill width at 100% even if value exceeds max", () => {
    const { container } = render(<StatBar label="Overflow" value={999} max={255} />);
    const fill = container.querySelector(".bg-black\\/85");
    expect(fill).toHaveStyle({ width: "100%" });
  });

  it("treats a real zero as a value, not the same as undefined", () => {
    render(<StatBar label="Zero" value={0} />);
    expect(screen.getByRole("meter", { name: "Zero" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
