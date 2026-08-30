import type { SVGProps } from "react";

export type PokeballGlyphState = "idle" | "focus" | "loading" | "settle";

interface PokeballGlyphProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /**
   * Idle: closed, desaturated. Focus: shell-top rotates open, button fills
   * --signal-red. Loading: shells snap shut, then spin continuously.
   * Settle: spin eases to rest, button pulses once. See v4 plan §4 — the
   * animation itself is CSS-driven (globals.css's `.pokeball-*` rules,
   * gated on this component's `data-state` attributes), not computed here,
   * so the reduced-motion substitution lives in exactly one place.
   */
  state: PokeballGlyphState;
}

/**
 * Custom SVG Pokeball glyph — no emoji, no icon library (v4 plan §4). Four
 * independently addressable parts so shell-top and button can animate
 * without touching shell-bottom or band:
 * `<g id="shell-top">`, `<g id="shell-bottom">`, `<rect id="band">`,
 * `<circle id="button">`. `shell-top`'s rotation pivots on the band's left
 * edge — (3, 16) in this 32x32 viewBox — via `transform-box: view-box` in
 * the paired CSS rule, not the element's own bounding-box center.
 */
export function PokeballGlyph({ state, className, ...rest }: PokeballGlyphProps) {
  return (
    <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" className={className} {...rest}>
      <g id="shell-bottom">
        <path d="M3 16 A13 13 0 0 0 29 16 Z" fill="var(--shell-200)" />
      </g>
      <g id="shell-top" data-state={state} className="pokeball-shell-top">
        <path d="M3 16 A13 13 0 0 1 29 16 Z" fill="var(--shell-400)" />
      </g>
      <rect id="band" x="3" y="14.5" width="26" height="3" fill="var(--shell-600)" />
      <circle
        id="button"
        data-state={state}
        className="pokeball-button"
        cx="16"
        cy="16"
        r="4"
        fill="var(--shell-200)"
        stroke="var(--shell-600)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
