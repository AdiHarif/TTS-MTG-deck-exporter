import { Settings } from 'lucide-react'

type AppHeaderProps = {
  title: string
  isSettingsOpen: boolean
  onOpenSettings: () => void
}

export function AppHeader({
  title,
  isSettingsOpen,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__row">
        <div>
          <h1>{title}</h1>
        </div>

        <button
          type="button"
          className="icon-button app-settings-button"
          aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
          aria-expanded={isSettingsOpen}
          aria-controls="deck-settings"
          onClick={onOpenSettings}
        >
          <Settings aria-hidden="true" className="icon-button__icon" />
        </button>
      </div>
    </header>
  )
}