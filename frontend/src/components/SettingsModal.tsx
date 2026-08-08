import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { ProxyReadinessStatus } from '../hooks/useDeckConversion'

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
  proxyBaseUrl: string
  hasLegalProxyBaseUrl: boolean
  proxyStatus: ProxyReadinessStatus
  onProxyBaseUrlChange: (value: string) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  isBusy: boolean
}

export function SettingsModal({
  isOpen,
  onClose,
  proxyBaseUrl,
  hasLegalProxyBaseUrl,
  proxyStatus,
  onProxyBaseUrlChange,
  isDarkMode,
  onToggleDarkMode,
  isBusy,
}: SettingsModalProps) {
  const showProxyWarning = proxyBaseUrl.trim().length > 0 && !hasLegalProxyBaseUrl

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
          disabled={isBusy}
        />

        <p className="hint-text settings-hint">
          Generated FaceURL values will point to {proxyBaseUrl || 'your proxy base URL'}/v1/card/&lt;id&gt;.
        </p>

        {hasLegalProxyBaseUrl ? (
          <p className={`proxy-status proxy-status--${proxyStatus}`}>
            {proxyStatus === 'checking' && <Loader2 className="proxy-status__icon spin" aria-hidden="true" />}
            {proxyStatus === 'ready' && <CheckCircle2 className="proxy-status__icon" aria-hidden="true" />}
            {proxyStatus === 'unreachable' && <XCircle className="proxy-status__icon" aria-hidden="true" />}
            {proxyStatus === 'checking' && 'Checking server…'}
            {proxyStatus === 'ready' && 'Server is ready'}
            {proxyStatus === 'unreachable' && 'Server unreachable'}
          </p>
        ) : null}

        {showProxyWarning ? (
          <p className="error-text proxy-warning" role="alert">
            <AlertTriangle className="proxy-warning__icon" aria-hidden="true" />
            <span>Proxy URL is invalid. Use a full URL starting with http:// or https://.</span>
          </p>
        ) : null}

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