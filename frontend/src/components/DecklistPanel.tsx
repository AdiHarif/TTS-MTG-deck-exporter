type DecklistPanelProps = {
  value: string
  onChange: (value: string) => void
  onRunConversion: () => void
  isBusy: boolean
  errorMessage: string | null
  missingCards: string[]
}

export function DecklistPanel({
  value,
  onChange,
  onRunConversion,
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
        <button type="button" className="primary-button build-button" onClick={onRunConversion} disabled={isBusy}>
          Build JSON
        </button>
      </div>

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