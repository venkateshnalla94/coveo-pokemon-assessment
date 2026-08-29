import Markdown, { type Components } from "react-markdown";

/**
 * Shared markdown rendering for both AI-adjacent surfaces that render
 * server-provided markdown text — AskAboutPokemon (Passage Retrieval) and
 * GeneratedAnswer (RGA). One pipeline, not two — see
 * docs/EXECUTION-PLAN-v2.3-frontend.md §5's GeneratedAnswer note.
 *
 * No rehype-raw plugin — raw HTML in either surface's text (crawled
 * content or a generated answer, ultimately grounded in third-party
 * content) is never rendered, only markdown syntax is parsed. Table/
 * heading overrides exist because that content is often a raw table chunk
 * (see the tabular-content limitation in plan101.md) and the default
 * unstyled `<table>` is unreadable; the `a` override forces safe link
 * behavior.
 */
const MARKDOWN_COMPONENTS: Components = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer" className="underline">
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <table {...props} className="my-2 w-full border-collapse text-xs">
      {children}
    </table>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border border-black/10 bg-black/5 px-2 py-1 text-left font-semibold dark:border-white/15 dark:bg-white/10"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-black/10 px-2 py-1 dark:border-white/15">
      {children}
    </td>
  ),
  h1: ({ children, ...props }) => (
    <h3 {...props} className="mt-2 mb-1 font-semibold">
      {children}
    </h3>
  ),
  h2: ({ children, ...props }) => (
    <h3 {...props} className="mt-2 mb-1 font-semibold">
      {children}
    </h3>
  ),
};

export function PokemonMarkdown({ text }: { text: string }) {
  return <Markdown components={MARKDOWN_COMPONENTS}>{text}</Markdown>;
}
