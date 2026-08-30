import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareTray } from "@/components/compare/CompareTray";
import { COMPARE_STORAGE_KEY } from "@/coveo/compareStorage";

function renderTray() {
  return render(
    <CompareProvider>
      <CompareTray />
    </CompareProvider>,
  );
}

describe("CompareTray", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("renders nothing when the selection is empty", () => {
    const { container } = renderTray();
    expect(container).toBeEmptyDOMElement();
  });

  it("lists every selected name with a remove control once a selection exists", async () => {
    // The tray starts empty on mount and hydrates from sessionStorage in an
    // effect (CompareProvider.tsx) — findBy* waits for that, matching the
    // real hydration-mismatch fix rather than asserting stale sync behavior.
    window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(["Pikachu", "Eevee"]));
    renderTray();
    expect(await screen.findByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("Eevee")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Pikachu from comparison" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Eevee from comparison" })).toBeInTheDocument();
  });

  it("removing a name updates the list and can empty the tray back to nothing", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(["Pikachu"]));
    const { container } = renderTray();
    await user.click(await screen.findByRole("button", { name: "Remove Pikachu from comparison" }));
    expect(container).toBeEmptyDOMElement();
  });

  it("Clear all empties the whole selection", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(["A", "B", "C"]));
    const { container } = renderTray();
    await user.click(await screen.findByRole("button", { name: "Clear all" }));
    expect(container).toBeEmptyDOMElement();
  });

  it("builds the Compare link href from the comma-joined, encoded names", async () => {
    window.sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(["Mr. Mime", "Eevee"]));
    renderTray();
    const link = await screen.findByRole("link", { name: "Compare (2)" });
    expect(link).toHaveAttribute("href", "/compare?names=Mr.%20Mime%2CEevee");
  });
});
