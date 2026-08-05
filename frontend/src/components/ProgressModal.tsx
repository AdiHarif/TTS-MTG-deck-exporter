type ProgressModalProps = {
  isOpen: boolean
  isSaving: boolean
  progressMessage: string
  onCancel: () => void
  savedFileName: string | null
  savedByteCount: number | null
  savedDownloadMode: 'picker' | 'download' | null
  saveDialogError: string | null
  isCancelled: boolean
}

export function ProgressModal({
  isOpen,
  isSaving,
  progressMessage,
  onCancel,
  savedFileName,
  savedByteCount,
  savedDownloadMode,
  saveDialogError,
  isCancelled,
}: ProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="progress-overlay" role="presentation">
      <section className="progress-modal" role="dialog" aria-modal="true" aria-labelledby="progress-modal-title">
        <div className="progress-modal__header">
          <h2 id="progress-modal-title">Building JSON</h2>
          <span className={`badge ${isSaving ? 'muted' : ''}`}>{isSaving ? 'Saving' : isCancelled ? 'Cancelled' : 'Working'}</span>
        </div>

        <p className="progress-message">{progressMessage}</p>

        <div className="progress-bar" aria-hidden="true">
          <span className="progress-bar__fill" />
        </div>

        {savedFileName ? (
          <div className="save-details">
            <p>File: {savedFileName}</p>
            {savedByteCount != null ? <p>Size: {(savedByteCount / 1024).toFixed(1)} KB</p> : null}
            {savedDownloadMode ? <p>Mode: {savedDownloadMode === 'picker' ? 'Save file dialog' : 'Browser download fallback'}</p> : null}
          </div>
        ) : null}

        {saveDialogError ? <p className="error-text">{saveDialogError}</p> : null}

        <div className="progress-modal__actions">
          <button type="button" className="secondary-button progress-cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  )
}