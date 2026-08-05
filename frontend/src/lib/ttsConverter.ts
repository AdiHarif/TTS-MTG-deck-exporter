import type { PipelineState } from '../types/pipeline'
import { resolveDeckTextEntries } from './decklist'
import { assembleOutput, buildCardObjects, type AssembledOutput } from './ttsAssembly'

type ConversionProgress = {
  stage: PipelineState
  message: string
}

type ConversionCallbacks = {
  onProgress?: (progress: ConversionProgress) => void
  onMissing?: (name: string) => void
}

export type ConversionResult = {
  saveObject: { ObjectStates: AssembledOutput[] }
  mainCount: number
  sideboardCount: number
  totalCards: number
  missingCards: string[]
  downloadFileName: string
}

export async function convertDecklistToTtsJson(
  deckText: string,
  proxyBaseUrl: string,
  callbacks: ConversionCallbacks = {},
  signal?: AbortSignal,
) {
  callbacks.onProgress?.({ stage: 'validating', message: 'Validating decklist text.' })

  const missingCards: string[] = []
  const resolved = await resolveDeckTextEntries(deckText, {
    onMissing: (name) => {
      missingCards.push(name)
      callbacks.onMissing?.(name)
    },
    signal,
  })

  if (resolved.main.length === 0 && resolved.sideboard.length === 0) {
    throw new Error('No cards resolved. Nothing to write.')
  }

  callbacks.onProgress?.({ stage: 'resolving', message: 'Resolving decklist against Scryfall.' })
  const mainCardObjects = await buildCardObjects(resolved.main, proxyBaseUrl, signal)
  const sideboardCardObjects = await buildCardObjects(resolved.sideboard, proxyBaseUrl, signal)

  callbacks.onProgress?.({ stage: 'building', message: 'Assembling Tabletop Simulator JSON.' })

  const deckName = 'decklist'
  const baseFile = 'decklist.txt'
  const objectStates: AssembledOutput[] = []

  if (mainCardObjects.length) {
    objectStates.push(assembleOutput(mainCardObjects, deckName, `${mainCardObjects.length} cards imported from ${baseFile}`, 0))
  }

  if (sideboardCardObjects.length) {
    objectStates.push(
      assembleOutput(
        sideboardCardObjects,
        `${deckName} - Sideboard`,
        `${sideboardCardObjects.length} sideboard cards imported from ${baseFile}`,
        4,
      ),
    )
  }

  const saveObject = { ObjectStates: objectStates }

  callbacks.onProgress?.({ stage: 'success', message: 'Conversion complete.' })

  return {
    saveObject,
    mainCount: mainCardObjects.length,
    sideboardCount: sideboardCardObjects.length,
    totalCards: mainCardObjects.length + sideboardCardObjects.length,
    missingCards,
    downloadFileName: 'tts-deck.json',
  }
}