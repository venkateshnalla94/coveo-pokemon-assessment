import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatBar } from "@/components/ui/StatBar";

/**
 * Rewritten for v4 (docs/EXECUTION-PLAN-v4-design-system.md §9/§12) to stop
 * asserting the fill's literal implementation — `.bg-black\/85` and inline
 * `style.width` — and instead assert the `role="meter"` / `aria-valuenow` /
 * `aria-valuemin` / `aria-valuemax` contract the component already exposes.
 * That contract is what actually carries the "how full is this bar" fact to
 * any consumer (assistive tech or otherwise); the visual fill is free to be
 * restyled (type-colored fill, mount animation) without this test caring how.
 */
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

  it("defaults the meter's max to MAX_BASE_STAT (255) when no max prop is given", () => {
    render(<StatBar label="Attack" value={255} />);
    const meter = screen.getByRole("meter", { name: "Attack" });
    expect(meter).toHaveAttribute("aria-valuemax", "255");
    expect(meter).toHaveAttribute("aria-valuenow", "255");
  });

  it("respects a custom max prop", () => {
    render(<StatBar label="Custom" value={50} max={100} />);
    const meter = screen.getByRole("meter", { name: "Custom" });
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("aria-valuenow", "50");
  });

  it("reports the real value on aria-valuenow even when it exceeds max, for the caller to clamp visually", () => {
    render(<StatBar label="Overflow" value={999} max={255} />);
    const meter = screen.getByRole("meter", { name: "Overflow" });
    expect(meter).toHaveAttribute("aria-valuenow", "999");
    expect(meter).toHaveAttribute("aria-valuemax", "255");
  });

  it("treats a real zero as a value, not the same as undefined", () => {
    render(<StatBar label="Zero" value={0} />);
    expect(screen.getByRole("meter", { name: "Zero" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
