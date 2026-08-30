import { CONTENT } from "@/content/pokedex";

/**
 * The "Coveo isn't configured yet" copy, shared by `CoveoConfigBanner`
 * (inline) and `ConfigRequiredDialog` (modal) — previously duplicated
 * verbatim in both files. The opening/closing prose comes from
 * `CONTENT.brand`; the `<code>`-styled fragments in between are literal
 * env var/file names (technical identifiers, not editable chrome copy) and
 * stay inline here, in this one shared place.
 */
export function ConfigRequiredMessage() {
  return (
    <p>
      {CONTENT.brand.configRequiredTitle} Copy <code>.env.example</code> to{" "}
      <code>.env.local</code> and set <code>NEXT_PUBLIC_COVEO_ORGANIZATION_ID</code> (client)
      and <code>COVEO_API_KEY</code> (server-only, used by <code>/api/token</code>){" "}
      {CONTENT.brand.configRequiredNote}
    </p>
  );
}
