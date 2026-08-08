import { useEffect, useMemo, useState } from 'react'
import { convertDecklistToTtsJson, type ConversionResult } from '../lib/ttsConverter'
import { downloadJsonFile } from '../lib/downloadJson'
import { getPipelineStatusMessage, type PipelineState } from '../types/pipeline'
import { useProxyReadiness } from './useProxyReadiness'
export type { ProxyReadinessStatus } from './useProxyReadiness'

const PROXY_STORAGE_KEY = 'tts-deck-builder-proxy-base-url'
const PROXY_QUERY_PARAM = 'proxyBaseUrl'

const sampleDecklist = `Deck
4 Sol Ring
2 Arcane Signet
1 Command Tower

Sideboard
1 Cyclonic Rift`

function resolveInitialProxyBaseUrl() {
  const queryValue = new URLSearchParams(window.location.search).get(PROXY_QUERY_PARAM)?.trim()
  if (queryValue) return queryValue

  const storedValue = window.localStorage.getItem(PROXY_STORAGE_KEY)?.trim()
  if (storedValue) return storedValue

  return ''
}

function isLegalProxyBaseUrl(value: string) {
  const normalizedValue = value.trim()
  if (!normalizedValue) return false

  try {
    const parsedValue = new URL(normalizedValue)
    return parsedValue.protocol === 'http:' || parsedValue.protocol === 'https:'
  } catch {
    return false
  }
}

export function useDeckConversion() {
  const [decklistText, setDecklistText] = useState(sampleDecklist)
  const [proxyBaseUrl, setProxyBaseUrl] = useState(resolveInitialProxyBaseUrl)
  const [state, setState] = useState<PipelineState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [missingCards, setMissingCards] = useState<string[]>([])
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [progressMessage, setProgressMessage] = useState<string>('Ready to validate and convert your decklist.')
  const [isProgressOpen, setIsProgressOpen] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFileName, setSavedFileName] = useState<string | null>(null)
  const [savedByteCount, setSavedByteCount] = useState<number | null>(null)
  const [savedDownloadMode, setSavedDownloadMode] = useState<'picker' | 'download' | null>(null)
  const [saveDialogError, setSaveDialogError] = useState<string | null>(null)
  const [currentAbortController, setCurrentAbortController] = useState<AbortController | null>(null)
  const hasLegalProxyBaseUrl = useMemo(() => isLegalProxyBaseUrl(proxyBaseUrl), [proxyBaseUrl])
  const proxyStatus = useProxyReadiness(proxyBaseUrl, hasLegalProxyBaseUrl)

  useEffect(() => {
    const normalizedProxyBaseUrl = proxyBaseUrl.trim()

    if (normalizedProxyBaseUrl) {
      window.localStorage.setItem(PROXY_STORAGE_KEY, normalizedProxyBaseUrl)
      return
    }

    window.localStorage.removeItem(PROXY_STORAGE_KEY)
  }, [proxyBaseUrl])

  function closeProgressDialog() {
    setIsProgressOpen(false)
    setIsSaving(false)
    setCurrentAbortController(null)
  }

  function openSaveDialog(blob: Blob, filename: string) {
    setSaveDialogError(null)
    setIsSaving(true)
    setSavedFileName(filename)
    setSavedByteCount(blob.size)

    if ('showSaveFilePicker' in window) {
      setSavedDownloadMode('picker')
    } else {
      setSavedDownloadMode('download')
    }
  }

  async function finishSaveDialog(blob: Blob, filename: string) {
    if ('showSaveFilePicker' in window) {
      try {
        // @ts-expect-error showSaveFilePicker is available in secure browser contexts.
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'JSON file',
              accept: { 'application/json': ['.json'] },
            },
          ],
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        throw error
      }
      return
    }

    downloadJsonFile(filename, JSON.parse(await blob.text()))
  }

  async function runConversion() {
    if (!hasLegalProxyBaseUrl) {
      setErrorMessage('Set a valid proxy URL before building JSON (must start with http:// or https://).')
      setState('error')
      return
    }

    setErrorMessage(null)
    setMissingCards([])
    setResult(null)
    setIsCancelled(false)
    setSavedFileName(null)
    setSavedByteCount(null)
    setSavedDownloadMode(null)
    setSaveDialogError(null)
    setIsProgressOpen(true)

    const abortController = new AbortController()
    setCurrentAbortController(abortController)

    try {
      const conversionResult = await convertDecklistToTtsJson(decklistText, proxyBaseUrl, {
        onProgress: ({ stage, message }) => {
          setState(stage)
          setProgressMessage(message)
        },
        onMissing: (name) => {
          setMissingCards((currentMissing) =>
            currentMissing.includes(name) ? currentMissing : [...currentMissing, name],
          )
        },
      }, abortController.signal)

      setResult(conversionResult)
      setState('success')
      setProgressMessage('Conversion complete. Opening save dialog...')

      const blob = new Blob([JSON.stringify(conversionResult.saveObject, null, 2)], { type: 'application/json' })
      openSaveDialog(blob, conversionResult.downloadFileName)

      await finishSaveDialog(blob, conversionResult.downloadFileName)
      setProgressMessage('Save file dialog completed.')
    } catch (error) {
      if (abortController.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        setIsCancelled(true)
        setState('idle')
        setProgressMessage('Conversion cancelled.')
        setResult(null)
        setErrorMessage(null)
        closeProgressDialog()
        return
      }

      const message = error instanceof Error ? error.message : 'Unexpected conversion error.'
      setErrorMessage(message)
      setState('error')
      setProgressMessage(message)
    } finally {
      closeProgressDialog()
    }
  }

  function downloadJson() {
    if (!result) return

    downloadJsonFile(result.downloadFileName, result.saveObject)
  }

  function cancelConversion() {
    currentAbortController?.abort()
    setIsCancelled(true)
  }

  const statusMessage = useMemo(() => getPipelineStatusMessage(state, proxyBaseUrl), [proxyBaseUrl, state])
  return {
    decklistText,
    setDecklistText,
    proxyBaseUrl,
    setProxyBaseUrl,
    state,
    statusMessage,
    errorMessage,
    missingCards,
    canDownload: Boolean(result),
    hasLegalProxyBaseUrl,
    proxyStatus,
    runConversion,
    downloadJson,
    isProgressOpen,
    progressMessage,
    cancelConversion,
    isCancelled,
    isSaving,
    saveDialogError,
    savedFileName,
    savedByteCount,
    savedDownloadMode,
  }
}