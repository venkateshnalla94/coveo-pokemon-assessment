/**
 * The one place chrome copy lives — labels, headings, placeholders, empty
 * and error messages, art paths. Edit this file, not the components that
 * reference it.
 *
 * Rule: this object holds chrome copy only. It must NEVER hold a Pokemon
 * name, type, stat, generation, or any other Pokemon fact — those come from
 * the Coveo index at runtime (see mapPokemonResult.ts), and hardcoding one
 * here would be exactly the fabrication PRODUCT.md's Product Principle 4
 * prohibits. Parameterized entries below (functions) exist so a component
 * can interpolate a *real, already-fetched* value (a name, a count, a
 * percentage) into an editable copy template without that value ever
 * living in this file as a literal.
 *
 * `art` points at files under public/art/. Leave a slot `undefined` until
 * real artwork exists — src/components/ui/ImageSlot.tsx renders a correctly
 * sized dashed placeholder in that case, so layout is never wrong for want
 * of an asset.
 */
export const CONTENT = {
  brand: {
    name: "Pokedex Search",
    tagline: "Coveo-powered search over pokemondb.net",
    configRequiredTitle: "Coveo isn't configured yet.",
    configRequiredNote: "once org access is granted.",
    gotItLabel: "Got it",
  },

  sprite: {
    // Shown wherever a Pokemon sprite (imageUrl) is genuinely absent from
    // the index — see src/components/ui/PokemonImage.tsx.
    noImageLabel: "No image available",
  },

  home: {
    heroSubtitle: "Search every Pokemon indexed from pokemondb.net, powered by Coveo.",
    indexedCountSuffix: (total: number) => ` ${total.toLocaleString()} Pokemon indexed.`,
    browseByTypeHeading: "Browse by type",
    browseByTypePrevLabel: "Previous types",
    browseByTypeNextLabel: "Next types",
  },

  search: {
    placeholder: "Search for a Pokemon...",
    loadingLabel: "Loading...",
    emptyTitle: "No results.",
    emptyBody: "This is expected until a Coveo source is indexing pokemondb.net — see the project README.",
    facetNoMatches: "No matches.",
    facetSearchPlaceholder: (label: string) => `Search ${label.toLowerCase()}...`,
    facetLabels: {
      speed: "Speed",
      abilities: "Abilities",
    },
    sortByLabel: "Sort by",
    sortUnavailableWarning: (label: string) =>
      `"${label}" sort isn't available right now — showing relevance instead.`,
    clearAllLabel: "Clear all",
    removeFilterLabel: (value: string) => `Remove filter ${value}`,
    resultsSummary: (firstResult: number, lastResult: number, total: number) =>
      `Results ${firstResult}-${lastResult} of ${total}`,
    filtersLabel: "Filters",
    filtersCloseLabel: "Close filters",
    didYouMeanPrompt: "Did you mean",
    noResultsForPrefix: "No results for",
    showingResultsForPrefix: "Showing results for",
    showingResultsInsteadSuffix: "instead.",
    pagerPreviousLabel: "Previous",
    pagerNextLabel: "Next",
  },

  pdp: {
    tabs: {
      overview: "Overview",
      abilities: "Abilities",
      evolution: "Evolution",
    },
    sectionHeadings: {
      stats: "Base Stats",
      abilities: "Abilities",
      weaknesses: "Weaknesses",
      resistances: "Resistances",
    },
    profileLabels: {
      species: "Species",
      generation: "Generation",
      height: "Height",
      weight: "Weight",
      eggGroups: "Egg groups",
      eggCycles: "Egg cycles",
      catchRate: "Catch rate",
      baseExp: "Base Exp.",
    },
    trainingLabels: {
      evYield: "EV yield",
      baseFriendship: "Base friendship",
      growthRate: "Growth rate",
    },
    statsTotalLabel: "Total",
    breadcrumbHome: "Home",
    breadcrumbSearchResults: "Search results",
    // Rewritten during the content-extraction pass (v4 plan §10): the
    // previous copy — "No match found for X. Expected until a Coveo source
    // is indexing pokemondb.net." — leaked internal ops detail to end users
    // and was duplicated verbatim across two render branches in
    // pokemon/[name]/page.tsx. Both branches now call this single function.
    notFoundTitle: "Pokemon not found",
    notFoundBody: (name: string) => `We couldn't find "${name}" in the index.`,
    noEvolutionData: (name: string) => `No evolution data available for ${name}.`,
    suggestedQuestions: [
      "How does it evolve?",
      "What are its abilities?",
      "What moves does it learn?",
    ] as string[],
    askHeading: (name: string) => `Ask about ${name}`,
    askPlaceholder: (name: string) => `e.g. "how does ${name} evolve?"`,
    askButtonLabel: "Ask",
    askButtonLoadingLabel: "Asking...",
    noPassagesFound: "No relevant passages found for that question.",
    passageLabel: (index: number) => `Passage ${index}`,
    relevanceLabel: (percent: string) => `Relevance: ${percent}%`,
    similarHeading: (name: string) => `Similar to ${name}`,
    similarLoadingLabel: "Loading similar Pokemon...",
    similarErrorMessage: "Couldn't load similar Pokemon right now.",
    similarEmptyMessage: (name: string) => `No similar Pokemon found for ${name}.`,
    similarStrongInPrefix: "Strong in:",
    similarViewLabel: "View Pokemon",
    similarPrevLabel: "Previous similar Pokemon",
    similarNextLabel: "Next similar Pokemon",
    // Singular, used only for the Hero's compact quick-facts row — plural
    // "Abilities" (sectionHeadings.abilities) is the full-list heading on
    // the Abilities tab. Deliberately not "Top ability": `abilities[0]` is
    // source order, not a verified primary (same caveat this codebase
    // already applies to `types[0]` — see ResultList.tsx/PokemonHero.tsx).
    abilityLabel: "Ability",
  },

  answer: {
    // Instrument-readout framing (v4 plan §7.1) — rendered through
    // `.font-mono-label`, which uppercases and tracks the text via CSS, so
    // this stays sentence case here.
    panelLabel: "Pokedex entry",
    loadingLabel: "Generating answer...",
    errorMessage: "Couldn't generate an answer right now.",
    citationPrefix: "retrieved from:",
    feedbackUp: "This answer was helpful",
    feedbackDown: "This answer was not helpful",
  },

  compare: {
    backLinkLabel: "← Back to search",
    pageTitle: "Compare",
    trayLabel: "Compare",
    fullMessage: "Comparison is full (max 4) — remove one to add another",
    removeFromComparisonLabel: (name: string) => `Remove ${name} from comparison`,
    clearAllLabel: "Clear all",
    trayLinkLabel: (count: number) => `Compare (${count})`,
    emptySelectionMessage: "No Pokemon selected. Go back to search results and add up to 4 to compare.",
    // Same "don't leak ops detail" fix applied here as pdp.notFoundBody —
    // see v4 plan §10.
    notFoundMessage: "We couldn't find any of the selected Pokemon in the index.",
    rowLabels: {
      image: "Image",
      type: "Type",
      height: "Height",
      weight: "Weight",
      abilities: "Abilities",
      total: "Total",
    },
  },

  art: {
    homeBanner: "/art/home-banner.webp" as string | undefined,
    emptySearch: "/art/empty-search.webp" as string | undefined,
  },

  /**
   * Per-route <title>/description overrides — see
   * docs/EXECUTION-PLAN-seo.md Phase 1. `titlePrefix` is composed with
   * CONTENT.brand.name by the route's layout.tsx, not duplicated here.
   */
  seo: {
    search: {
      titlePrefix: "Search Pokemon",
      description:
        "Search and filter every Pokemon indexed from pokemondb.net by type, generation, abilities, and more.",
    },
    compare: {
      titlePrefix: "Compare Pokemon",
      description: "Compare base stats, types, and abilities for up to four Pokemon side by side.",
    },
  },
} as const;
