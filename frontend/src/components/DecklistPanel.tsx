import { AlertTriangle } from 'lucide-react'
import type { ProxyReadinessStatus } from '../hooks/useDeckConversion'

type DecklistPanelProps = {
  value: string
  onChange: (value: string) => void
  onRunConversion: () => void
  canRunConversion: boolean
  proxyStatus: ProxyReadinessStatus
  isBusy: boolean
  errorMessage: string | null
  missingCards: string[]
}

export function DecklistPanel({
  value,
  onChange,
  onRunConversion,
  canRunConversion,
  proxyStatus,
  isBusy,
  errorMessage,
  missingCards,
}: DecklistPanelProps) {
  return (
    <div className="panel input-panel">
      <div className="panel-heading">
        <div className="panel-heading__title">
          <h2>Decklist Input</h2>
        </div>
      </div>

      <textarea
        id="decklist-input"
        className="decklist-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        placeholder="Paste a decklist here"
      />

      <p className="hint-text">
        Supports quantity prefixes and Deck/Sideboard headers.
      </p>

      <div className="decklist-actions">
        <button
          type="button"
          className="primary-button build-button"
          onClick={onRunConversion}
          disabled={isBusy || !canRunConversion}
        >
          Build JSON
        </button>
      </div>

      {!canRunConversion ? (
        <p className="error-text proxy-warning" role="alert">
          <AlertTriangle className="proxy-warning__icon" aria-hidden="true" />
          <span>Set a valid proxy URL in Settings to enable Build JSON.</span>
        </p>
      ) : proxyStatus === 'unreachable' ? (
        <p className="error-text proxy-warning" role="alert">
          <AlertTriangle className="proxy-warning__icon" aria-hidden="true" />
          <span>Proxy server is unreachable. Loading images in TTS may fail.</span>
        </p>
      ) : null}

      {missingCards.length ? (
        <section className="missing-block" aria-label="Missing cards">
          <h3>Missing cards</h3>
          <ul className="missing-list">
            {missingCards.map((cardName) => (
              <li key={cardName}>{cardName}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </div>
  )
}