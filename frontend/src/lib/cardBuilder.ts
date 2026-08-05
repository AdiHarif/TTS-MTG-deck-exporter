import { DEFAULT_BACK, relatedTokensFromCard, type RelatedToken, type ScryfallCard } from './scryfall'

type CardDeckKey = {
  front: number
  back: number | null
}

export type TtsCardDeckEntry = {
  FaceURL: string
  BackURL: string
  NumWidth: number
  NumHeight: number
  Type: number
  BackIsHidden: boolean
  UniqueBack: boolean
}

export type TtsCardObject = {
  Transform: ReturnType<typeof zeroTransform>
  Name: string
  Nickname: string
  Description: string
  Memo: string
  CardID: number
  CustomDeck: Record<string, TtsCardDeckEntry>
  Tags?: string[]
  States?: Record<string, TtsCardObject>
}

type ScryfallRecord = ScryfallCard & { relatedTokens?: RelatedToken[] | null }

function zeroTransform(posX = 0) {
  return { posX, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 }
}

function setOracle(face: {
  oracle_text?: string
  power?: string | number
  toughness?: string | number
  loyalty?: string | number
}) {
  let suffix: string | false = false
  if (face.power != null && face.toughness != null) suffix = `${face.power}/${face.toughness}`
  else if (face.loyalty != null) suffix = String(face.loyalty)
  const text = (face.oracle_text || '').replace(/"/g, "'")
  return suffix ? `${text}\n[b]${suffix}[/b]` : text
}

function manaCostToCmc(manaCost?: string) {
  if (!manaCost) return 0
  const symbols = manaCost.match(/\{[^}]+\}/g) || []
  let total = 0
  for (const symbol of symbols) {
    const inner = symbol.slice(1, -1)
    if (/^\d+$/.test(inner)) total += Number.parseInt(inner, 10)
    else if (inner === 'X' || inner === 'Y' || inner === 'Z') total += 0
    else total += 1
  }
  return total
}

function pickImage(imageUris?: ScryfallCard['image_uris']) {
  if (!imageUris) return ''
  return imageUris.large || imageUris.normal || imageUris.png || imageUris.small || ''
}

function wrapImageUrl(url: string, proxyBaseUrl: string, recordId: string, back = false) {
  if (!url) return ''
  if (!proxyBaseUrl) return url
  if (!recordId) return url
  const suffix = back ? '?back=true' : ''
  return `${proxyBaseUrl.replace(/\/$/, '')}/v1/card/${recordId}${suffix}`
}

function memoWithTokens(oracleId: string | undefined, relatedTokens?: RelatedToken[] | null) {
  let memo = oracleId || ''
  if (relatedTokens && relatedTokens.length) {
    const ids = relatedTokens.map((token) => token.uuid).filter(Boolean)
    if (ids.length) memo += `|tokens:${ids.join(',')}`
  }
  return memo
}

function buildMtgEmbedSuffix(oracleId: string | undefined, relatedTokens?: RelatedToken[] | null) {
  if (!oracleId) return ''
  let suffix = `[mtg:oid=${oracleId}`
  if (relatedTokens && relatedTokens.length) {
    const ids = relatedTokens.map((token) => token.uuid).filter(Boolean)
    if (ids.length) suffix += `;tok=${ids.join(',')}`
  }
  return `${suffix}]`
}

function cardSpawnEmbeds(record: ScryfallRecord) {
  const oracleId = record.oracle_id || ''
  const relatedTokens = record.relatedTokens
  const memo = memoWithTokens(oracleId, relatedTokens)
  const tags = oracleId ? [`oid:${oracleId}`] : []
  const footer = buildMtgEmbedSuffix(oracleId, relatedTokens)
  return { memo, tags, footer }
}

export function enrichRecordRelatedTokens(record: ScryfallRecord) {
  record.relatedTokens = relatedTokensFromCard(record)
  return record
}

function cardDeckEntry(faceUrl: string, backUrl: string): TtsCardDeckEntry {
  return {
    FaceURL: faceUrl,
    BackURL: backUrl,
    NumWidth: 1,
    NumHeight: 1,
    Type: 0,
    BackIsHidden: true,
    UniqueBack: false,
  }
}

export async function buildCardObject(record: ScryfallCard, customDeckKey: CardDeckKey, proxyBaseUrl = '') {
  const back = DEFAULT_BACK
  let name = ''
  let oracle = ''
  let face = ''
  let backDat: TtsCardObject | null = null

  const isTwoSided = Boolean(
    record.card_faces &&
      record.card_faces.length >= 2 &&
      ['transform', 'modal_dfc', 'double_faced_token', 'meld'].includes(record.layout || ''),
  )

  if (isTwoSided) {
    const [frontFace, backFace] = record.card_faces!
    const frontCmc = Math.round(record.cmc || 0)
    name = `${(frontFace.name || record.name || 'Card').replace(/"/g, '')}\n${frontFace.type_line || ''}\n${frontCmc}CMC DFC`
    oracle = setOracle(frontFace)
    face = wrapImageUrl(pickImage(frontFace.image_uris), proxyBaseUrl, record.id, false)

    const backCmc = manaCostToCmc(backFace.mana_cost)
    const backName = `${(backFace.name || 'Card').replace(/"/g, '')}\n${backFace.type_line || ''}\n${backCmc}CMC DFC`
    const backOracle = setOracle(backFace)
    const backFaceUrl = wrapImageUrl(pickImage(backFace.image_uris), proxyBaseUrl, record.id, true)
    backDat = {
      Transform: zeroTransform(),
      Name: 'Card',
      Nickname: backName,
      Description: backOracle,
      Memo: record.oracle_id || '',
      CardID: customDeckKey.back ? customDeckKey.back * 100 : 0,
      CustomDeck: { [String(customDeckKey.back || '')]: cardDeckEntry(backFaceUrl, back) },
    }
  } else if (record.card_faces && record.card_faces.length >= 2) {
    const cmc = Math.round(record.cmc || 0)
    name = `${(record.name || 'Card').replace(/"/g, '')}\n${record.type_line || ''}\n${cmc}CMC`
    oracle = record.card_faces.map((faceRecord) => setOracle(faceRecord)).join('\n\n\u2014\u2014\u2014\n\n')
    face = wrapImageUrl(pickImage(record.image_uris), proxyBaseUrl, record.id, false)
  } else {
    const cmc = Math.round(record.cmc || 0)
    name = `${(record.name || 'Card').replace(/"/g, '')}\n${record.type_line || ''}\n${cmc}CMC`
    if (record.set && record.collector_number) {
      name += `\n\u00b7 ${record.set.toLowerCase()} #${record.collector_number}`
    }
    oracle = setOracle(record)
    face = wrapImageUrl(pickImage(record.image_uris), proxyBaseUrl, record.id, false)
  }

  const { memo, tags, footer } = cardSpawnEmbeds(record as ScryfallRecord)
  const description = footer ? `${oracle}\n${footer}` : oracle

  const cardObj: TtsCardObject = {
    Transform: zeroTransform(),
    Name: 'Card',
    Nickname: name,
    Description: description,
    Memo: memo,
    CardID: customDeckKey.front * 100,
    CustomDeck: { [String(customDeckKey.front)]: cardDeckEntry(face, back) },
  }

  if (tags.length) cardObj.Tags = tags
  if (backDat) cardObj.States = { 2: backDat }
  return cardObj
}