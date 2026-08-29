import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Controller-boundary mocks: a fake `buildUrlManager` controller
// (subscribe/state/synchronize) plus fake `loadSearchActions` /
// `loadSearchAnalyticsActions` action creators and a fake engine with a
// spyable `dispatch`. next/navigation's router/pathname/searchParams hooks
// are mocked directly since this component is App Router-specific plumbing,
// not something with a real DOM router available under jsdom.
const {
  urlManagerMock,
  buildUrlManagerMock,
  dispatchMock,
  executeSearchAction,
  logInterfaceLoadAction,
  routerReplaceMock,
} = vi.hoisted(() => {
  const urlManagerMock: {
    state: { fragment: string };
    subscribe: (listener: () => void) => () => void;
    synchronize: ReturnType<typeof vi.fn>;
    __listener?: () => void;
  } = {
    state: { fragment: "" },
    subscribe: vi.fn(function (this: void, listener: () => void) {
      urlManagerMock.__listener = listener;
      return () => {};
    }),
    synchronize: vi.fn(),
  };
  const buildUrlManagerMock = vi.fn(() => urlManagerMock);
  const dispatchMock = vi.fn();
  const executeSearchAction = { type: "executeSearch" };
  const logInterfaceLoadAction = { type: "logInterfaceLoad" };
  const routerReplaceMock = vi.fn();
  return {
    urlManagerMock,
    buildUrlManagerMock,
    dispatchMock,
    executeSearchAction,
    logInterfaceLoadAction,
    routerReplaceMock,
  };
});

vi.mock("@/coveo/engine", () => ({
  getSearchEngine: vi.fn(() => ({ dispatch: dispatchMock })),
}));

vi.mock("@coveo/headless", () => ({
  buildUrlManager: buildUrlManagerMock,
  loadSearchActions: vi.fn(() => ({
    executeSearch: vi.fn((thunk: unknown) => ({ ...executeSearchAction, meta: thunk })),
  })),
  loadSearchAnalyticsActions: vi.fn(() => ({
    logInterfaceLoad: vi.fn(() => logInterfaceLoadAction),
  })),
}));

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  usePathname: () => "/search",
  useSearchParams: () => currentSearchParams,
}));

import { SearchUrlSync } from "@/components/SearchUrlSync";

describe("SearchUrlSync", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    urlManagerMock.state = { fragment: "" };
    buildUrlManagerMock.mockClear();
    dispatchMock.mockClear();
    routerReplaceMock.mockClear();
    urlManagerMock.synchronize.mockClear();
  });

  it("renders nothing", () => {
    const { container } = render(<SearchUrlSync />);
    expect(container).toBeEmptyDOMElement();
  });

  it("builds the urlManager seeded from the current URL's search params", () => {
    currentSearchParams = new URLSearchParams("q=pikachu");
    render(<SearchUrlSync />);
    expect(buildUrlManagerMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ initialState: { fragment: "q=pikachu" } }),
    );
  });

  it("on mount, synchronizes the urlManager to the current fragment and dispatches a search", () => {
    currentSearchParams = new URLSearchParams("q=eevee");
    render(<SearchUrlSync />);
    expect(urlManagerMock.synchronize).toHaveBeenCalledWith("q=eevee");
    expect(dispatchMock).toHaveBeenCalled();
  });

  it("reflects a urlManager fragment change into the URL via router.replace, without touching browser history (scroll: false)", () => {
    render(<SearchUrlSync />);
    urlManagerMock.state = { fragment: "f-pokemontype=Fire" };
    act(() => {
      urlManagerMock.__listener?.();
    });
    expect(routerReplaceMock).toHaveBeenCalledWith("/search?f-pokemontype=Fire", {
      scroll: false,
    });
  });

  it("replaces with the bare pathname when the fragment becomes empty", () => {
    currentSearchParams = new URLSearchParams("q=eevee");
    render(<SearchUrlSync />);
    urlManagerMock.state = { fragment: "" };
    act(() => {
      urlManagerMock.__listener?.();
    });
    expect(routerReplaceMock).toHaveBeenCalledWith("/search", { scroll: false });
  });

  it("does not call router.replace again for a fragment it already reconciled itself (no ping-pong loop)", () => {
    currentSearchParams = new URLSearchParams("q=eevee");
    render(<SearchUrlSync />);
    routerReplaceMock.mockClear();
    // The urlManager reporting back the same fragment this component itself
    // just synchronized from the URL must not trigger a redundant replace().
    urlManagerMock.state = { fragment: "q=eevee" };
    act(() => {
      urlManagerMock.__listener?.();
    });
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });
});
