import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PagerState } from "@coveo/headless";

// Mock at the controller boundary, same idea as searchRenderState's own
// tests — a fake Headless `Pager` controller with a subscribe/state shape,
// not a wrapped engine. `getSearchEngine` is mocked too since Pager.tsx
// calls it purely to hand off to `buildPager`, which is itself mocked.
const { pagerMock, subscribeMock } = vi.hoisted(() => {
  const subscribeMock = vi.fn((listener: () => void) => {
    pagerMock.__listener = listener;
    return () => {};
  });
  const pagerMock: {
    state: PagerState;
    subscribe: typeof subscribeMock;
    previousPage: ReturnType<typeof vi.fn>;
    nextPage: ReturnType<typeof vi.fn>;
    selectPage: ReturnType<typeof vi.fn>;
    isCurrentPage: (page: number) => boolean;
    __listener?: () => void;
  } = {
    state: {
      currentPages: [1, 2, 3],
      currentPage: 1,
      maxPage: 3,
      hasPreviousPage: false,
      hasNextPage: true,
    } as PagerState,
    subscribe: subscribeMock,
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    selectPage: vi.fn(),
    isCurrentPage: (page: number) => page === pagerMock.state.currentPage,
  };
  return { pagerMock, subscribeMock };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({})),
}));

vi.mock("@coveo/headless", () => ({
  buildPager: vi.fn(() => pagerMock),
}));

import { Pager } from "@/components/Pager";

describe("Pager", () => {
  beforeEach(() => {
    pagerMock.state = {
      currentPages: [1, 2, 3],
      currentPage: 1,
      maxPage: 3,
      hasPreviousPage: false,
      hasNextPage: true,
    } as PagerState;
    subscribeMock.mockClear();
    pagerMock.previousPage.mockClear();
    pagerMock.nextPage.mockClear();
    pagerMock.selectPage.mockClear();
  });

  it("renders nothing when there's only one page", () => {
    pagerMock.state = { ...pagerMock.state, maxPage: 1 };
    const { container } = render(<Pager />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a button per current page window and marks the active one", () => {
    render(<Pager />);
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "2" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("disables Previous when hasPreviousPage is false, and Next when hasNextPage is false", () => {
    render(<Pager />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  it("calls pager.selectPage with the clicked page number", async () => {
    const user = userEvent.setup();
    render(<Pager />);
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(pagerMock.selectPage).toHaveBeenCalledWith(2);
  });

  it("calls pager.nextPage / pager.previousPage from their respective buttons", async () => {
    const user = userEvent.setup();
    pagerMock.state = { ...pagerMock.state, hasPreviousPage: true };
    render(<Pager />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(pagerMock.nextPage).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(pagerMock.previousPage).toHaveBeenCalledTimes(1);
  });
});
