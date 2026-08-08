import './App.css'
import { AppHeader } from './components/AppHeader'
import { DecklistPanel } from './components/DecklistPanel'
import { ProgressModal } from './components/ProgressModal'
import { SettingsModal } from './components/SettingsModal'
import { useDeckConversion } from './hooks/useDeckConversion'
import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'tts-deck-builder-theme'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'dark') return true
    if (storedTheme === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const themeValue = isDarkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = themeValue
    window.localStorage.setItem(THEME_STORAGE_KEY, themeValue)
  }, [isDarkMode])

  const {
    decklistText,
    setDecklistText,
    proxyBaseUrl,
    setProxyBaseUrl,
    hasLegalProxyBaseUrl,
    proxyStatus,
    errorMessage,
    missingCards,
    runConversion,
    isProgressOpen,
    progressMessage,
    cancelConversion,
    isCancelled,
    isSaving,
    saveDialogError,
    savedFileName,
    savedByteCount,
    savedDownloadMode,
  } = useDeckConversion()

  return (
    <main className="app-shell">
      <section className="app-content" inert={isProgressOpen} aria-hidden={isProgressOpen}>
        <AppHeader
          title="TTS Deck JSON Builder"
          isSettingsOpen={isSettingsOpen}
          onOpenSettings={() => setIsSettingsOpen((currentValue) => !currentValue)}
        />

        <section className="workspace" aria-label="Deck conversion workspace">
          <DecklistPanel
            value={decklistText}
            onChange={setDecklistText}
            onRunConversion={runConversion}
            canRunConversion={hasLegalProxyBaseUrl}
            proxyStatus={proxyStatus}
            isBusy={isProgressOpen}
            errorMessage={errorMessage}
            missingCards={missingCards}
          />
        </section>
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        proxyBaseUrl={proxyBaseUrl}
        hasLegalProxyBaseUrl={hasLegalProxyBaseUrl}
        proxyStatus={proxyStatus}
        onProxyBaseUrlChange={setProxyBaseUrl}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((currentValue) => !currentValue)}
        isBusy={isProgressOpen}
      />

      <ProgressModal
        isOpen={isProgressOpen}
        isSaving={isSaving}
        progressMessage={progressMessage}
        onCancel={cancelConversion}
        savedFileName={savedFileName}
        savedByteCount={savedByteCount}
        savedDownloadMode={savedDownloadMode}
        saveDialogError={saveDialogError}
        isCancelled={isCancelled}
      />
    </main>
  )
}

export default App
