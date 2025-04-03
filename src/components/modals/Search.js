import React from "react";

export const SearchModal = ({
  searchString,
  searchResults,
  handleSearch,
  setSearchString,
  closeSearch,
  goToBlock,
}) => {
  return (
    <div className="m2-search modal is-active">
      <div className="modal-background" onClick={closeSearch}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Search</p>
          <button
            className="delete"
            aria-label="close"
            onClick={closeSearch}
          ></button>
        </header>
        <section className="modal-card-body">
          <form onSubmit={handleSearch}>
            <div className="field has-addons">
              <div className="control is-expanded">
                <input
                  className="input is-fullwidth"
                  type="search"
                  placeholder="Search this doc"
                  value={searchString}
                  onChange={(e) => setSearchString(e.target.value)}
                />
              </div>
              <div className="control m2-search-button">
                <button type="submit" className="button is-primary">
                  Search
                </button>
              </div>
            </div>
          </form>
          <div className="m2-search-results">
            {searchResults.length ? (
              searchResults.map((r) => (
                <div
                  key={r.id}
                  className="m2-search-result"
                  onClick={() => goToBlock(r.id)}
                  dangerouslySetInnerHTML={{ __html: r.html }}
                ></div>
              ))
            ) : (
              <p>
                <em>Didn't find anything...</em>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
