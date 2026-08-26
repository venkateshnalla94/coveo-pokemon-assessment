export function CoveoConfigBanner() {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      Coveo isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code>{" "}
      and set <code>NEXT_PUBLIC_COVEO_ORGANIZATION_ID</code> (client) and{" "}
      <code>COVEO_API_KEY</code> (server-only, used by <code>/api/token</code>) once org access
      is granted.
    </div>
  );
}
