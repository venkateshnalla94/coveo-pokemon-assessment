import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypeDefenses } from "@/components/TypeDefenses";
import { CONTENT } from "@/content/pokedex";

describe("TypeDefenses", () => {
  it("renders nothing when both weaknesses and resistances are empty", () => {
    const { container } = render(<TypeDefenses weaknesses={[]} resistances={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the Weaknesses section when resistances is empty", () => {
    render(<TypeDefenses weaknesses={["Fire", "Ice"]} resistances={[]} />);
    expect(screen.getByText(CONTENT.pdp.sectionHeadings.weaknesses)).toBeInTheDocument();
    expect(screen.queryByText(CONTENT.pdp.sectionHeadings.resistances)).not.toBeInTheDocument();
    expect(screen.getByText("Fire")).toBeInTheDocument();
    expect(screen.getByText("Ice")).toBeInTheDocument();
  });

  it("renders only the Resistances section when weaknesses is empty", () => {
    render(<TypeDefenses weaknesses={[]} resistances={["Water"]} />);
    expect(screen.queryByText(CONTENT.pdp.sectionHeadings.weaknesses)).not.toBeInTheDocument();
    expect(screen.getByText(CONTENT.pdp.sectionHeadings.resistances)).toBeInTheDocument();
    expect(screen.getByText("Water")).toBeInTheDocument();
  });

  it("renders both sections when both arrays are non-empty", () => {
    render(<TypeDefenses weaknesses={["Fire"]} resistances={["Water", "Grass"]} />);
    expect(screen.getByText(CONTENT.pdp.sectionHeadings.weaknesses)).toBeInTheDocument();
    expect(screen.getByText(CONTENT.pdp.sectionHeadings.resistances)).toBeInTheDocument();
    expect(screen.getByText("Water")).toBeInTheDocument();
    expect(screen.getByText("Grass")).toBeInTheDocument();
  });
});
