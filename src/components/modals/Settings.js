import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt, faInfoCircle } from '@fortawesome/free-solid-svg-icons'

export const SettingsModal = ({
  closeSettings,
  darkMode,
  setDarkMode,
  offlineMode,
  setOfflineMode,
  spellcheck,
  setSpellcheck,
  serif,
  setSerif,
  handleViewImageFolder,
}) => {
  return (
    <div className="m2-settings modal is-active">
      <div className="modal-background" onClick={closeSettings}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Settings</p>
          <button
            className="delete"
            aria-label="close"
            onClick={closeSettings}
          ></button>
        </header>
        <section className="modal-card-body">
          <div className="field">
            <input
              id="m2-dark-mode-switch"
              type="checkbox"
              name="m2-dark-mode-switch"
              className="switch"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            <label htmlFor="m2-dark-mode-switch">Dark mode</label>
          </div>

          <div className="field">
            <input
              id="m2-offline-mode-switch"
              type="checkbox"
              name="m2-offline-mode-switch"
              className="switch"
              checked={offlineMode}
              onChange={(e) => setOfflineMode(e.target.checked)}
            />
            <label htmlFor="m2-offline-mode-switch">
              Offline mode <FontAwesomeIcon icon={faBolt} />
            </label>
          </div>

          <div className="field">
            <input
              id="m2-spellcheck-switch"
              type="checkbox"
              name="m2-spellcheck-switch"
              className="switch"
              checked={spellcheck}
              onChange={(e) => setSpellcheck(e.target.checked)}
            />
            <label htmlFor="m2-spellcheck-switch">Spellcheck</label>
          </div>

          <div className="field">
            <input
              id="m2-serif-switch"
              type="checkbox"
              name="m2-serif-switch"
              className="switch"
              checked={serif}
              onChange={(e) => setSerif(e.target.checked)}
            />
            <label htmlFor="m2-serif-switch">Serif font</label>
          </div>

          <div className="field">
            <p>
              <FontAwesomeIcon icon={faInfoCircle} />
              &nbsp;&nbsp;Images you upload via <code>/image</code> are served
              out of your Google Drive{' '}
              <a onClick={handleViewImageFolder}>here</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
