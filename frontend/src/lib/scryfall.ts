const API_BASE = 'https://api.scryfall.com'
const USER_AGENT = 'tts-deck-importer-web/1.0'
const REQUEST_DELAY_MS = 100

export const DEFAULT_BACK =
  'https://steamusercontent-a.akamaihd.net/ugc/1647720103762682461/35EF6E87970E2A5D6581E7D96A99F8A575B7A15F/'

export type ScryfallImageUris = {
  small?: string
  normal?: string
  large?: string
  png?: string
  art_crop?: string
  border_crop?: string
}

export type ScryfallFace = {
  name?: string
  type_line?: string
  mana_cost?: string
  oracle_text?: string
  power?: string | number
  toughness?: string | number
  loyalty?: string | number
  image_uris?: ScryfallImageUris
}

export type ScryfallPart = {
  component?: string
  id?: string
  name?: string
}

export type ScryfallCard = {
  id: string
  oracle_id?: string
  name?: string
  cmc?: number
  set?: string
  collector_number?: string
  layout?: string
  image_uris?: ScryfallImageUris
  card_faces?: ScryfallFace[]
  all_parts?: ScryfallPart[]
  type_line?: string
  oracle_text?: string
  power?: string | number
  toughness?: string | number
  loyalty?: string | number
  mana_cost?: string
}

export type RelatedToken = {
  uuid: string
  name: string
}

let lastRequestAt = 0

async function throttle() {
  const wait = REQUEST_DELAY_MS - (Date.now() - lastRequestAt)
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  lastRequestAt = Date.now()
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError')
  }
}

async function scryfallGet<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  throwIfAborted(signal)
  await throttle()
  throwIfAborted(signal)
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal,
  })

  if (response.status === 404) return null

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Scryfall request failed (${response.status}) for ${url}: ${body.slice(0, 200)}`)
  }

  return response.json() as Promise<T>
}

export async function fetchCardByName(name: string, signal?: AbortSignal) {
  return scryfallGet<ScryfallCard>(`${API_BASE}/cards/named?fuzzy=${encodeURIComponent(name)}`, signal)
}

export async function fetchCardBySetCollector(set: string, collector: string, signal?: AbortSignal) {
  const setCode = (set || '').toLowerCase().split('_')[0]
  return scryfallGet<ScryfallCard>(`${API_BASE}/cards/${encodeURIComponent(setCode)}/${encodeURIComponent(collector)}`, signal)
}

export async function fetchCardById(scryfallId: string, signal?: AbortSignal) {
  return scryfallGet<ScryfallCard>(`${API_BASE}/cards/${scryfallId}`, signal)
}

export async function fetchCardByOracleId(oracleId: string, signal?: AbortSignal) {
  const data = await scryfallGet<{ data?: ScryfallCard[] }>(
    `${API_BASE}/cards/search?q=${encodeURIComponent(`oracleid:${oracleId}`)}&order=released&unique=prints`,
    signal,
  )
  return data?.data?.length ? data.data[0] : null
}

export function relatedTokensFromCard(card: ScryfallCard): RelatedToken[] | null {
  if (!card.all_parts) return null

  const tokens = card.all_parts
    .filter((part) => part.component === 'token')
    .map((part) => ({ uuid: part.id || '', name: part.name || '' }))
    .filter((token) => token.uuid)

  return tokens.length ? tokens : null
}