import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

const tabs: TabItem[] = [
  { id: "a", label: "Alpha", panel: <p>Alpha panel</p> },
  { id: "b", label: "Bravo", panel: <p>Bravo panel</p> },
  { id: "c", label: "Charlie", panel: <p>Charlie panel</p> },
];

describe("Tabs", () => {
  it("renders nothing when given an empty tabs list", () => {
    const { container } = render(<Tabs tabs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("defaults to the first tab as active", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Alpha panel")).toBeVisible();
    expect(screen.queryByText("Bravo panel")).not.toBeInTheDocument();
  });

  it("switches the active tab on click", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    await user.click(screen.getByRole("tab", { name: "Bravo" }));
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bravo panel")).toBeVisible();
    expect(screen.queryByText("Alpha panel")).not.toBeInTheDocument();
  });

  it("moves to the next tab on ArrowRight, wrapping past the last tab", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    alpha.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves to the previous tab on ArrowLeft, wrapping before the first tab", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    alpha.focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("aria-selected", "true");
  });

  it("jumps to the first tab on Home and the last tab on End", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    alpha.focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves DOM focus to the newly active tab, not just visual selection", async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    alpha.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveFocus();
  });

  it("only the active tab is in the tab order (roving tabindex)", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("tabIndex", "0");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("tabIndex", "-1");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("tabIndex", "-1");
  });
});
