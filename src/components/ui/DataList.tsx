import type { ReactNode } from "react";

/**
 * A label/value `<dl>` on the grid pattern already used at
 * pokemon/[name]/page.tsx's Type/Generation rows — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §3. Used by the profile, training,
 * and breeding panels. Renders "—" for a nullish value rather than an empty
 * cell, per the project's never-fabricate-but-never-hide-silently pattern.
 */
export interface DataListRow {
  label: string;
  value: ReactNode;
}

export interface DataListProps {
  rows: DataListRow[];
}

export function DataList({ rows }: DataListProps) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map((row) => (
        <div className="contents" key={row.label}>
          <dt className="font-semibold">{row.label}</dt>
          <dd>{row.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
