import { fetchCardById, fetchCardByName, fetchCardByOracleId, fetchCardBySetCollector, type ScryfallCard } from './scryfall'

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export type DeckEntry = {
  qty: number
  rest: string
}

export type DeckSectionEntries = {
  main: DeckEntry[]
  sideboard: DeckEntry[]
}

export type ResolvedDeckEntry = {
  card: ScryfallCard
  name: string
}

export function parseDecklistText(text: string): DeckSectionEntries {
  const sections: DeckSectionEntries = { main: [], sideboard: [] }
  let current: keyof DeckSectionEntries = 'main'

  for (const rawLine of (text || '').split(/\r\n|\n|\r/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('//') || line.startsWith('#')) continue

    if (/^(deck|main(board)?)$/i.test(line)) {
      current = 'main'
      continue
    }

    if (/^(sideboard|maybeboard)$/i.test(line)) {
      current = 'sideboard'
      continue
    }

    const match = line.match(/^(\d+)\s+(.+)$/)
    const qty = match ? Number.parseInt(match[1], 10) : 1
    const rest = match ? match[2] : line
    sections[current].push({ qty, rest })
  }

  return sections
}

async function resolveLineToCard(rest: string, signal?: AbortSignal) {
  const direct = rest.match(UUID_RE)
  if (direct) return fetchCardById(direct[0], signal)

  const oraclePrefix = rest.match(/^oracleid:(\S+)/i)
  if (oraclePrefix) return fetchCardByOracleId(oraclePrefix[1], signal)

  const setParen = rest.match(/^(.+?)\s+\(([\w]+)\)\s+(\S+)$/)
  if (setParen) return fetchCardBySetCollector(setParen[2], setParen[3], signal)

  const setBracket = rest.match(/^(.+?)\s+\[([\w]+):(\w+)\]/)
  if (setBracket) return fetchCardBySetCollector(setBracket[2], setBracket[3], signal)

  return fetchCardByName(rest, signal)
}

async function resolveEntries(
  pending: DeckEntry[],
  cache: Map<string, ScryfallCard | null>,
  onMissing?: (name: string) => void,
  signal?: AbortSignal,
) {
  const entries: ResolvedDeckEntry[] = []

  for (const pendingEntry of pending) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }

    if (!cache.has(pendingEntry.rest)) {
      cache.set(pendingEntry.rest, await resolveLineToCard(pendingEntry.rest, signal))
    }

    const card = cache.get(pendingEntry.rest)
    if (card) {
      for (let count = 0; count < pendingEntry.qty; count += 1) {
        entries.push({ card, name: pendingEntry.rest })
      }
    } else {
      onMissing?.(pendingEntry.rest)
    }
  }

  return entries
}

export async function resolveDeckTextEntries(
  deckText: string,
  { onMissing, signal }: { onMissing?: (name: string) => void; signal?: AbortSignal } = {},
) {
  const sections = parseDecklistText(deckText)
  const cache = new Map<string, ScryfallCard | null>()
  const main = await resolveEntries(sections.main, cache, onMissing, signal)
  const sideboard = await resolveEntries(sections.sideboard, cache, onMissing, signal)
  return { main, sideboard }
}