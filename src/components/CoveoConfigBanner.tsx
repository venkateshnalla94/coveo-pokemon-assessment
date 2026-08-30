import { ConfigRequiredMessage } from "@/components/ConfigRequiredMessage";

export function CoveoConfigBanner() {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <ConfigRequiredMessage />
    </div>
  );
}
