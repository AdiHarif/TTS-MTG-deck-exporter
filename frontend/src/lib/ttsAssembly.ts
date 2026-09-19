import type { ResolvedDeckEntry } from './decklist'
import { enrichRecordRelatedTokens, buildCardObject, type TtsCardObject } from './cardBuilder'
import { fetchCardById, relatedTokensFromCard } from './scryfall'

export type AssembledOutput = {
  Transform: { posX: number; posY: number; posZ: number; rotX: number; rotY: number; rotZ: number; scaleX: number; scaleY: number; scaleZ: number }
  Name: 'Card' | 'DeckCustom'
  Nickname?: string
  Description?: string
  DeckIDs?: number[]
  CustomDeck?: Record<string, unknown>
  ContainedObjects?: TtsCardObject[]
  CardID?: number
  States?: Record<string, TtsCardObject>
  Memo?: string
  Tags?: string[]
}

export function zeroTransform(posX = 0) {
  return { posX, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 }
}

export function assembleOutput(cardObjects: TtsCardObject[], nickname: string, description: string, posX: number): AssembledOutput {
  if (cardObjects.length === 1) {
    const [card] = cardObjects
    return { ...card, Name: 'Card', Transform: zeroTransform(posX) }
  }

  const deckIds = cardObjects.map((cardObject) => cardObject.CardID)
  const customDeck: Record<string, unknown> = {}
  const containedObjects: TtsCardObject[] = []

  for (const cardObject of cardObjects) {
    Object.assign(customDeck, cardObject.CustomDeck)
    containedObjects.push(cardObject)
  }

  return {
    Transform: zeroTransform(posX),
    Name: 'DeckCustom',
    Nickname: nickname,
    Description: description,
    DeckIDs: deckIds,
    CustomDeck: customDeck,
    ContainedObjects: containedObjects,
  }
}

export async function buildCardObjects(entries: ResolvedDeckEntry[], proxyBaseUrl: string, signal?: AbortSignal) {
  const deckSize = entries.length
  const cardObjects: TtsCardObject[] = []
  let counter = 1

  for (const entry of entries) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }

    const record = enrichRecordRelatedTokens({ ...entry.card })
    const frontKey = counter
    const isTwoSided = Boolean(record.card_faces && record.card_faces.length >= 2 && !record.image_uris)
    const backKey = isTwoSided ? deckSize + counter : null
    counter += 1

    cardObjects.push(await buildCardObject(record, { front: frontKey, back: backKey }, proxyBaseUrl))
  }

  return cardObjects
}

export function collectUniqueTokenIds(entries: ResolvedDeckEntry[]): string[] {
  const seen = new Set<string>()

  for (const entry of entries) {
    const tokens = relatedTokensFromCard(entry.card)
    if (!tokens) continue
    for (const token of tokens) {
      if (token.uuid) seen.add(token.uuid)
    }
  }

  return [...seen]
}

export async function buildTokenCardObjects(entries: ResolvedDeckEntry[], proxyBaseUrl: string, signal?: AbortSignal) {
  const tokenIds = collectUniqueTokenIds(entries)
  const cardObjects: TtsCardObject[] = []
  const deckSize = tokenIds.length
  let counter = 1

  for (const tokenId of tokenIds) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }

    const tokenCard = await fetchCardById(tokenId, signal)
    if (!tokenCard) continue

    const record = enrichRecordRelatedTokens({ ...tokenCard })
    const frontKey = counter
    const isTwoSided = Boolean(record.card_faces && record.card_faces.length >= 2 && !record.image_uris)
    const backKey = isTwoSided ? deckSize + counter : null
    counter += 1

    cardObjects.push(await buildCardObject(record, { front: frontKey, back: backKey }, proxyBaseUrl))
  }

  return cardObjects
}