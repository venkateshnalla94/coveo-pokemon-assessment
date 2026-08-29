import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllerState } from "@/coveo/useControllerState";

function makeController<TState>(initialState: TState) {
  let state = initialState;
  let listener: (() => void) | undefined;
  return {
    get state() {
      return state;
    },
    subscribe: vi.fn((cb: () => void) => {
      listener = cb;
      return () => {
        listener = undefined;
      };
    }),
    setState(next: TState) {
      state = next;
      listener?.();
    },
  };
}

describe("useControllerState", () => {
  it("returns the controller's initial state", () => {
    const controller = makeController({ value: "a" });
    const { result } = renderHook(() => useControllerState(controller));
    expect(result.current).toEqual({ value: "a" });
  });

  it("returns undefined when the controller is undefined", () => {
    const { result } = renderHook(() => useControllerState(undefined));
    expect(result.current).toBeUndefined();
  });

  it("re-renders with fresh state on a subscribe notification", () => {
    const controller = makeController({ value: "a" });
    const { result } = renderHook(() => useControllerState(controller));

    act(() => controller.setState({ value: "b" }));

    expect(result.current).toEqual({ value: "b" });
  });

  it("unsubscribes on unmount", () => {
    const controller = makeController({ value: "a" });
    const { unmount } = renderHook(() => useControllerState(controller));

    unmount();

    // setState after unmount must not throw or update a torn-down component.
    expect(() => controller.setState({ value: "b" })).not.toThrow();
  });

  it("does not resubscribe on every render (stable subscribe identity)", () => {
    const controller = makeController({ value: "a" });
    const { rerender } = renderHook(() => useControllerState(controller));

    rerender();
    rerender();

    expect(controller.subscribe).toHaveBeenCalledTimes(1);
  });
});
