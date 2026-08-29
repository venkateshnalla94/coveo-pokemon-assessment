import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DidYouMeanState } from "@coveo/headless";

const { didYouMeanMock } = vi.hoisted(() => {
  const didYouMeanMock: {
    state: DidYouMeanState;
    subscribe: (listener: () => void) => () => void;
    applyCorrection: ReturnType<typeof vi.fn>;
  } = {
    state: {
      wasAutomaticallyCorrected: false,
      wasCorrectedTo: "",
      hasQueryCorrection: false,
      originalQuery: "",
      queryCorrection: { correctedQuery: "", wordCorrections: [] },
    } as unknown as DidYouMeanState,
    subscribe: vi.fn(() => () => {}),
    applyCorrection: vi.fn(),
  };
  return { didYouMeanMock };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({})),
}));

vi.mock("@coveo/headless", () => ({
  buildDidYouMean: vi.fn(() => didYouMeanMock),
}));

import { DidYouMean } from "@/components/DidYouMean";

describe("DidYouMean", () => {
  beforeEach(() => {
    didYouMeanMock.applyCorrection.mockClear();
  });

  it("renders nothing when there's no correction of any kind", () => {
    didYouMeanMock.state = {
      wasAutomaticallyCorrected: false,
      hasQueryCorrection: false,
    } as DidYouMeanState;
    const { container } = render(<DidYouMean />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the auto-corrected message when wasAutomaticallyCorrected is true", () => {
    didYouMeanMock.state = {
      wasAutomaticallyCorrected: true,
      originalQuery: "pikachuu",
      wasCorrectedTo: "pikachu",
      hasQueryCorrection: false,
    } as DidYouMeanState;
    render(<DidYouMean />);
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
    expect(screen.getByText("pikachuu", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("pikachu")).toBeInTheDocument();
  });

  it("shows a clickable Did you mean suggestion when hasQueryCorrection is true", async () => {
    const user = userEvent.setup();
    didYouMeanMock.state = {
      wasAutomaticallyCorrected: false,
      hasQueryCorrection: true,
      queryCorrection: { correctedQuery: "eevee" },
    } as unknown as DidYouMeanState;
    render(<DidYouMean />);
    const button = screen.getByRole("button", { name: "eevee" });
    await user.click(button);
    expect(didYouMeanMock.applyCorrection).toHaveBeenCalledTimes(1);
  });

  it("prioritizes the auto-corrected branch over the suggestion branch when both are somehow true", () => {
    didYouMeanMock.state = {
      wasAutomaticallyCorrected: true,
      originalQuery: "pikachuu",
      wasCorrectedTo: "pikachu",
      hasQueryCorrection: true,
      queryCorrection: { correctedQuery: "should-not-show" },
    } as unknown as DidYouMeanState;
    render(<DidYouMean />);
    expect(screen.queryByRole("button", { name: "should-not-show" })).not.toBeInTheDocument();
    expect(screen.getByText("pikachu")).toBeInTheDocument();
  });
});
