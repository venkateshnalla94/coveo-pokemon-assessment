import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CompareProvider, useCompare } from "@/components/compare/CompareProvider";
import { COMPARE_STORAGE_KEY } from "@/coveo/compareStorage";

function wrapper({ children }: { children: ReactNode }) {
  return <CompareProvider>{children}</CompareProvider>;
}

describe("useCompare", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("throws when used outside a CompareProvider", () => {
    // Silence the expected React error-boundary console.error noise for this case.
    const { result } = renderHook(() => {
      try {
        return useCompare();
      } catch (error) {
        return error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe(
      "useCompare must be used within a CompareProvider",
    );
  });

  it("starts empty when sessionStorage has nothing stored", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    expect(result.current.names).toEqual([]);
    expect(result.current.isFull).toBe(false);
  });

  it("hydrates initial state from sessionStorage in an effect after mount", async () => {
    // Not synchronous on first render — the initial render must start empty
    // on both server and client to avoid a real hydration-mismatch error
    // (confirmed live; see the comment in CompareProvider.tsx). Hydration
    // now lands one microtask after mount instead.
    window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(["Pikachu"]));
    const { result } = renderHook(() => useCompare(), { wrapper });
    expect(result.current.names).toEqual([]);
    await waitFor(() => expect(result.current.names).toEqual(["Pikachu"]));
    expect(result.current.isSelected("Pikachu")).toBe(true);
  });

  it("add() appends a name and persists it to sessionStorage", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    act(() => result.current.add("Eevee"));
    expect(result.current.names).toEqual(["Eevee"]);
    expect(JSON.parse(window.sessionStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]")).toEqual([
      "Eevee",
    ]);
  });

  it("add() is a no-op past MAX_COMPARE_NAMES", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    act(() => {
      result.current.add("A");
      result.current.add("B");
      result.current.add("C");
      result.current.add("D");
    });
    expect(result.current.isFull).toBe(true);
    act(() => result.current.add("E"));
    expect(result.current.names).toEqual(["A", "B", "C", "D"]);
  });

  it("remove() drops a name", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    act(() => result.current.add("Eevee"));
    act(() => result.current.remove("Eevee"));
    expect(result.current.names).toEqual([]);
  });

  it("clear() empties the selection", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    act(() => {
      result.current.add("A");
      result.current.add("B");
    });
    act(() => result.current.clear());
    expect(result.current.names).toEqual([]);
    expect(JSON.parse(window.sessionStorage.getItem(COMPARE_STORAGE_KEY) ?? "[]")).toEqual([]);
  });

  it("exposes max as MAX_COMPARE_NAMES", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    expect(result.current.max).toBe(4);
  });
});

describe("CompareProvider", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("renders its children", () => {
    render(
      <CompareProvider>
        <p>child content</p>
      </CompareProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
