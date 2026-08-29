import Link from "next/link";

/**
 * "Home / Search results / <Name>" for the detail page. The middle crumb
 * needs the query the user came from — passed via a `?from=` querystring
 * param on this page, set by ResultList.tsx's card links (Step 5 of
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5) to the exact search URL (path +
 * query string, including any active facets/sort/pagination) the user came
 * from. Reached any other way (e.g. a bookmarked `/pokemon/<name>` link),
 * `from` is absent, so this degrades to "Home / <Name>" rather than
 * fabricating a back-target.
 */
export interface BreadcrumbProps {
  name: string;
  from?: string;
}

export function Breadcrumb({ name, from }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-black/60 dark:text-white/60">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </li>
        {from && (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={from} className="hover:underline">
                Search results
              </Link>
            </li>
          </>
        )}
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-black dark:text-white">
          {name}
        </li>
      </ol>
    </nav>
  );
}
