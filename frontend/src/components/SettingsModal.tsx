type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  proxyBaseUrl: string
  onProxyBaseUrlChange: (value: string) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  isBusy: boolean
}

export function SettingsModal({
  isOpen,
  onClose,
  proxyBaseUrl,
  onProxyBaseUrlChange,
  isDarkMode,
  onToggleDarkMode,
  isBusy,
}: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="settings-overlay" role="presentation" onClick={onClose}>
      <aside
        id="deck-settings"
        className="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Deck settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-drawer__header">
          <div>
            <h3>Settings</h3>
          </div>

          <button
            type="button"
            className="icon-button settings-close-button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <span className="settings-close-glyph" aria-hidden="true">×</span>
          </button>
        </div>

        <div className="settings-section-separator" aria-hidden="true">
          <span className="settings-section-separator__line" />
        </div>

        <div className="settings-section-heading">
          <h4 className="settings-section-title">Proxy base URL</h4>
          <p className="settings-section-subtitle">Set the base URL used for generated card image links.</p>
        </div>

        <label className="visually-hidden" htmlFor="proxy-url-input">
          Proxy base URL
        </label>
        <input
          id="proxy-url-input"
          className="text-input"
          type="text"
          value={proxyBaseUrl}
          onChange={(event) => onProxyBaseUrlChange(event.target.value)}
          placeholder="http://127.0.0.1:8787"
          disabled={isBusy}
        />

        <p className="hint-text settings-hint">
          Generated FaceURL values will point to {proxyBaseUrl || 'your proxy base URL'}/v1/card/&lt;id&gt;.
        </p>

        <div className="settings-section-separator" aria-hidden="true">
          <span className="settings-section-separator__line" />
        </div>

        <div className="settings-switch-row">
          <div>
            <h4 className="settings-section-title">Dark mode</h4>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Dark mode"
            className={`theme-switch${isDarkMode ? ' is-on' : ''}`}
            onClick={onToggleDarkMode}
          >
            <span className="theme-switch__thumb" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </div>
  )
}