"use client";

import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";

/**
 * Plain client-side tab switching for one already-loaded result's panels —
 * not Headless's `buildTab`, which switches *query* constant expressions
 * and would be the wrong tool here (see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §3). Real ARIA: `tablist`/`tab`/
 * `tabpanel`, roving tabindex, and left/right/Home/End arrow-key movement.
 */
export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
}

export function Tabs({ tabs }: TabsProps) {
  const [activeId, setActiveId] = useState<string | undefined>(tabs[0]?.id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (tabs.length === 0) {
    return null;
  }

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );

  function focusTab(index: number) {
    const tab = tabs[index];
    if (!tab) {
      return;
    }
    setActiveId(tab.id);
    tabRefs.current[tab.id]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab((activeIndex + 1) % tabs.length);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab((activeIndex - 1 + tabs.length) % tabs.length);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
      default:
        break;
    }
  }

  const activeTab = tabs[activeIndex];

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-black/10 dark:border-white/15">
        {tabs.map((tab) => {
          const selected = tab.id === activeTab?.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={handleKeyDown}
              className={
                selected
                  ? "rounded-t-md border border-b-0 border-black/10 px-3 py-1.5 text-sm font-semibold text-black dark:border-white/15 dark:text-white"
                  : "px-3 py-1.5 text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tabpanel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeTab?.id}
          className="pt-3"
        >
          {tab.id === activeTab?.id ? tab.panel : null}
        </div>
      ))}
    </div>
  );
}
