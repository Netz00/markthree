import React from 'react'
import moment from 'moment'

export const DocsModal = ({
  closeDocsModal,
  handleImport,
  startNewFile,
  offlineMode,
  docs,
  viewArchive,
  toggleViewArchive,
  currentDoc,
  openFile,
  takeFileAction,
}) => {
  return (
    <div className="m2-docs modal is-active">
      <div className="modal-background" onClick={closeDocsModal}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Docs</p>
          <button
            className="delete"
            aria-label="close"
            onClick={closeDocsModal}
          ></button>
        </header>
        <section className="modal-card-body">
          <div>
            <label className="m2-import">
              <span className="button is-text is-clear" disabled={offlineMode}>
                Import
              </span>
              <input
                type="file"
                onChange={handleImport}
                accept=".txt,.md"
                disabled={offlineMode}
              />
            </label>
            <button
              className="button is-outline"
              onClick={startNewFile}
              disabled={offlineMode}
            >
              New
            </button>
          </div>
          <table className="table is-striped is-fullwidth">
            <thead>
              <tr>
                <th></th>
                <th>
                  <abbr title="Filename">Filename</abbr>
                </th>
                <th>
                  <abbr title="Last modified">Last modified</abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {docs &&
                docs
                  .filter((f) => !!f.archived === viewArchive)
                  .map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="select">
                          <select
                            value={'default'}
                            onChange={(e) => takeFileAction(e, f)}
                          >
                            <option hidden value="default"></option>
                            <option value="rename">Rename</option>
                            {f.id === currentDoc && (
                              <option value="export">Export</option>
                            )}
                            <option value="toggleArchive">
                              {!f.archived ? 'Archive' : 'Move to docs'}
                            </option>
                            <option value="delete">Delete</option>
                          </select>
                        </div>
                      </td>
                      <td
                        className={
                          f.id === currentDoc ? 'm2-is-current-doc' : undefined
                        }
                      >
                        <a onClick={() => openFile(f.id)}>
                          {f.title ? (
                            <abbr title={f.title}>
                              {f.title.substring(0, 20)}
                            </abbr>
                          ) : (
                            'Untitled'
                          )}
                        </a>
                      </td>
                      <td>{moment(f.lastModified).fromNow()}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          <div className="m2-footer">
            <a onClick={toggleViewArchive}>
              {viewArchive ? 'View docs' : 'View archive'}
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
