export interface SearchSnippet {
  before: string
  match: string
  after: string
}

const SNIPPET_CONTEXT_CHARS = 60

// Builds a short excerpt centered on the first case-insensitive occurrence of
// `query` inside `text`, split into three parts so the UI can render the
// match with its own emphasis without re-searching the string itself.
export function buildSnippet(text: string, query: string): SearchSnippet {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return { before: text, match: '', after: '' }

  const index = text.toLowerCase().indexOf(trimmedQuery.toLowerCase())
  if (index === -1) return { before: text, match: '', after: '' }

  const start = Math.max(0, index - SNIPPET_CONTEXT_CHARS)
  const end = Math.min(text.length, index + trimmedQuery.length + SNIPPET_CONTEXT_CHARS)

  return {
    before: (start > 0 ? '…' : '') + text.slice(start, index),
    match: text.slice(index, index + trimmedQuery.length),
    after: text.slice(index + trimmedQuery.length, end) + (end < text.length ? '…' : ''),
  }
}
