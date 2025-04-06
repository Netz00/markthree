import React, { useState, useEffect, useCallback, useRef } from "react";
import Shelf from "./Shelf";
import shortid from "shortid";
import Doc from "./Doc";
import "../style/MarkThree.scss";
import marked from "marked";
import syncUtils from "../syncUtils/syncUtils";
import syncUtilsOffline from "../syncUtils/syncUtilsOffline";
import download from "in-browser-download";
import raw from "raw.macro";
import _ from "lodash";
import $ from "jquery";
import { get, set } from "idb-keyval";
import "typeface-roboto-slab";
import { SearchModal } from "./modals/Search";
import { DocsModal } from "./modals/Docs";
import { SettingsModal } from "./modals/Settings";
import { ContactModal } from "./modals/Contact";
import { AboutModal } from "./modals/About";
import { HelpModal } from "./modals/Help";

const tryItNowText = raw("./tryItNow.md");

function MarkThree(props) {
  // useState to hold our component state (merged from the original state)
  const [state, setState] = useState({
    gapi: props.gapi,
    searchString: "",
    searchResults: [],
    showShelf: false,
    darkMode: false,
    offlineMode: false,
    spellcheck: true,
    serif: false,
    // additional state used later:
    currentDoc: null,
    docs: [],
    appData: {},
    allLines: [],
    doc: {},
    showDocs: false,
    showSearch: false,
    showSettings: false,
    showContact: false,
    showAbout: false,
    showHelp: false,
    goToBlock: null,
    initialData: null,
    viewArchive: false,
  });

  // refs for mutable values
  const syncingRef = useRef(false);
  const syncUtilsRef = useRef(null);
  const appDataKey = `appData_${props.userEmail}`;

  // set options for marked (same as in constructor)
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      smartLists: true,
    });
  }, []);

  // componentDidMount equivalent
  useEffect(() => {
    get("offlineMode").then((offlineModeRaw) => {
      let offlineMode = props.tryItNow
        ? false
        : (offlineModeRaw && JSON.parse(offlineModeRaw)) || !state.gapi;
      setState((prev) => ({ ...prev, offlineMode }));
      syncUtilsRef.current = offlineMode
        ? syncUtilsOffline()
        : syncUtils(state.gapi);

      const currentDoc = shortid.generate();
      const defaultAppData = {
        currentDoc,
        docs: [{ id: currentDoc, title: false, lastModified: new Date() }],
        revision: 0,
        signUpDate: new Date(),
      };

      if (!props.tryItNow) {
        refreshDocs(defaultAppData);
      } else {
        setState((prev) => ({
          ...prev,
          ...defaultAppData,
          appData: defaultAppData,
        }));
      }
      get("darkMode").then((value) => value && setDarkMode(JSON.parse(value)));
      get("spellcheck").then(
        (value) => value && setSpellcheck(JSON.parse(value))
      );
      get("serif").then((value) => value && setSerif(JSON.parse(value)));
      get("signUpDate").then(
        (value) => !value && set("signUpDate", JSON.stringify(new Date()))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync
  const sync = useCallback(
    (appData, additionalState) => {
      if (!syncingRef.current) {
        console.log(`starting sync: ${JSON.stringify(appData)}`);
        syncingRef.current = true;
        setState((prev) => ({
          ...prev,
          ...appData,
          ...additionalState,
          appData,
        }));
        return new Promise((resolve) => {
          if (!props.tryItNow) {
            syncUtilsRef.current
              .syncByRevision(appDataKey, appData)
              .then((newAppData) => {
                console.log(`finished sync: ${JSON.stringify(newAppData)}`);
                setState((prev) => ({
                  ...prev,
                  ...newAppData,
                  appData: newAppData,
                }));
                syncingRef.current = false;
                resolve();
              });
          } else {
            syncingRef.current = false;
            resolve();
          }
        });
      } else {
        // recursive retry if already syncing
        return new Promise((resolve) => {
          setTimeout(() => {
            sync(appData, additionalState).then(resolve);
          }, 200);
        });
      }
    },
    [props.tryItNow, appDataKey]
  );

  // refreshDocs
  const refreshDocs = useCallback(
    (defaultAppData) => {
      return new Promise((resolve) => {
        (props.tryItNow
          ? Promise.resolve(_.clone(state.appData))
          : syncUtilsRef.current.initializeData(appDataKey, defaultAppData)
        ).then((appData) => {
          Promise.all(appData.docs.map((d) => get(d.id))).then(
            (docMetaDataFiles) => {
              appData.docs = appData.docs.map((d, i) => {
                d.lastModified = docMetaDataFiles[i]
                  ? JSON.parse(docMetaDataFiles[i]).lastModified
                  : d.lastModified;
                return d;
              });
              sync(appData, {}).then(resolve);
            }
          );
        });
      });
    },
    [props.tryItNow, state.appData, appDataKey, sync]
  );

  // converted methods:
  const openFile = (id) => {
    setState((prev) => ({ ...prev, currentDoc: false }));
    $(window).scrollTop(0);
    const appData = _.cloneDeep(state.appData);
    appData.currentDoc = id;
    sync(appData, { showDocs: false, showShelf: false, initialData: false });
  };

  const startNewFile = () => {
    console.log(`old doc: ${JSON.stringify(state.currentDoc)}`);
    setState((prev) => ({ ...prev, currentDoc: false }));
    $(window).scrollTop(0);
    const appData = _.cloneDeep(state.appData);
    const id = shortid.generate();
    appData.currentDoc = id;
    appData.docs.unshift({ id, title: false, lastModified: new Date() });
    sync(appData, { showDocs: false, initialData: false, showShelf: false });
  };

  const deleteFile = (fileName) => {
    const currentDoc = state.currentDoc;
    setState((prev) => ({ ...prev, currentDoc: false }));
    const appData = _.cloneDeep(state.appData);
    appData.docs = appData.docs.filter((file) => file.id !== fileName);
    if (currentDoc === fileName) {
      if (appData.docs.length) {
        appData.currentDoc = appData.docs[0].id;
      } else {
        const id = shortid.generate();
        appData.currentDoc = id;
        appData.docs.unshift({ id, title: false, lastModified: new Date() });
      }
    }
    sync(appData, { initialData: false });
    if (!props.tryItNow) {
      syncUtilsRef.current.find(fileName, (docMetadata) => {
        syncUtilsRef.current.deleteFiles(docMetadata.pageIds).then(() => {
          syncUtilsRef.current.deleteFile(fileName);
        });
      });
    }
  };

  const handleImport = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const appData = _.cloneDeep(state.appData);
      const id = shortid.generate();
      appData.currentDoc = id;
      appData.docs.unshift({ id, title: false, lastModified: new Date() });
      setState((prev) => ({ ...prev, currentDoc: false }));
      $(window).scrollTop(0);
      sync(appData, {
        initialData: ev.target.result,
        showDocs: false,
        showShelf: false,
      });
    };
    reader.readAsText(e.target.files[0]);
  };

  const setTitle = (id, title) => {
    const appData = _.cloneDeep(state.appData);
    appData.docs.forEach((f) => {
      if (f.id === id) {
        f.title = title;
      }
    });
    sync(appData, {});
  };

  const toggleArchive = (id) => {
    const appData = _.cloneDeep(state.appData);
    appData.docs.forEach((f) => {
      if (f.id === id) {
        f.archived = !f.archived;
      }
    });
    sync(appData, { newTitle: false, editTitle: false });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(state.searchString);
    let searchResults;
    if (!state.searchString) {
      searchResults = state.allLines
        .filter((id) => state.doc[id].startsWith("// "))
        .map((id) => ({ id, html: state.doc[id].replace("// ", "") }))
        .slice(0, 1000);
    } else if (/^#todo$/i.test(state.searchString)) {
      let searchRegex = /(?:[-*+]|(?:[0-9]+\.))\s+\[\s\]\s/;
      searchResults = state.allLines
        .filter((id) => searchRegex.test(state.doc[id]))
        .map((id) => ({
          id,
          html: marked(state.doc[id]).replace(
            searchRegex,
            (m) => `<mark>${m}</mark>`
          ),
        }))
        .slice(0, 1000);
    } else {
      const exactMatchRegex = /^"(.+)"$/;
      let searchRegex;
      if (exactMatchRegex.test(state.searchString)) {
        searchRegex = new RegExp(
          state.searchString
            .match(exactMatchRegex)[1]
            .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          "ig"
        );
      } else {
        const keywords = state.searchString
          .split(" ")
          .map((t) => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
        searchRegex = new RegExp(keywords.join("|"), "ig");
      }
      searchResults = state.allLines
        .filter((id) => searchRegex.test(state.doc[id]))
        .map((id) => ({
          id,
          html: marked(state.doc[id]).replace(
            searchRegex,
            (m) => `<mark>${m}</mark>`
          ),
        }))
        .slice(0, 1000);
    }
    setState((prev) => ({ ...prev, searchResults }));
  };

  const takeFileAction = (e, file) => {
    switch (e.target.value) {
      case "rename":
        var newTitle = prompt("Please select a new file name:");
        if (newTitle) {
          setTitle(file.id, newTitle);
        }
        break;
      case "export":
        let lastTag;
        const blocks = [];
        state.allLines.forEach((id) => {
          const nextTag =
            $(marked(state.doc[id])).length &&
            $(marked(state.doc[id]))[0].tagName;
          if (lastTag === "P" && nextTag === "P") {
            blocks.push("\n" + state.doc[id]);
          } else {
            blocks.push(state.doc[id]);
          }
          lastTag = nextTag;
        });
        const text = blocks.join("\n");
        const title = state.docs.filter((f) => f.id === state.currentDoc)[0]
          ? state.docs.filter((f) => f.id === state.currentDoc)[0].title
          : "Untitled";
        download(text, `${title}.txt`);
        break;
      case "toggleArchive":
        toggleArchive(file.id);
        break;
      case "delete":
        const confirmed = window.confirm(
          `Permanently delete ${file.title || "Untitled"}?`
        );
        if (confirmed) {
          deleteFile(file.id);
        }
        break;
      default:
        console.error(
          `Invalid action ${e.target.value} executed on file ${file.id}`
        );
    }
  };

  const setDarkMode = (value) => {
    setState((prev) => ({ ...prev, darkMode: value }));
    if (value) {
      $("body").addClass("m2-dark-mode");
    } else {
      $("body").removeClass("m2-dark-mode");
    }
    set("darkMode", JSON.stringify(value));
  };

  const setOfflineMode = (value) => {
    return new Promise((resolve) => {
      setState((prev) => ({ ...prev, offlineMode: value }));
      syncUtilsRef.current = value ? syncUtilsOffline() : syncUtils(state.gapi);
      set("offlineMode", JSON.stringify(value)).then(resolve);
    });
  };

  const setSpellcheck = (value) => {
    return new Promise((resolve) => {
      setState((prev) => ({ ...prev, spellcheck: value }));
      set("spellcheck", JSON.stringify(value)).then(resolve);
      $("body").attr("spellcheck", value);
    });
  };

  const setSerif = (value) => {
    return new Promise((resolve) => {
      setState((prev) => ({ ...prev, serif: value }));
      set("serif", JSON.stringify(value)).then(resolve);
      if (value) {
        $("#m2-doc").addClass("m2-serif");
      } else {
        $("#m2-doc").removeClass("m2-serif");
      }
    });
  };

  const handleViewImageFolder = () => {
    syncUtilsRef.current.getImagesFolder().then((id) => {
      window.open(`https://drive.google.com/drive/u/0/folders/${id}`, "_blank");
    });
  };

  const handleMentionOrHashtagSearch = (mentionOrHashtag) => {
    setState((prev) => ({
      ...prev,
      searchString: mentionOrHashtag,
      showSearch: true,
    }));
    handleSearch({ preventDefault: () => {} });
  };

  const goToSearchResult = (blockId) => {
    setState((prev) => ({
      ...prev,
      goToBlock: blockId,
      showSearch: false,
      searchString: "",
      searchResults: [],
      showShelf: false,
    }));
  };

  const closeSearchModal = () => {
    setState((prev) => ({
      ...prev,
      showSearch: false,
      searchString: "",
      searchResults: [],
    }));
  };

  // ...existing code for JSX unchanged...
  return (
    <div>
      {state.currentDoc && (
        <Doc
          key={state.currentDoc}
          currentDoc={state.currentDoc}
          gapi={props.gapi}
          handleLogout={props.handleLogout}
          handleSwitchUser={props.handleSwitchUser}
          handleLogin={props.handleLogin}
          tryItNow={props.tryItNow}
          initialData={state.initialData || (props.tryItNow && tryItNowText)}
          goToBlock={state.goToBlock}
          setDocData={(allLines, doc) =>
            setState((prev) => ({ ...prev, allLines, doc }))
          }
          offlineMode={state.offlineMode}
          spellcheck={state.spellcheck}
        />
      )}
      <Shelf
        handleLogout={props.handleLogout}
        handleSwitchUser={props.handleSwitchUser}
        gapi={props.gapi}
        tryItNow={props.tryItNow}
        offlineMode={state.offlineMode}
        showShelf={state.showShelf}
        setShelf={(val) => setState((prev) => ({ ...prev, showShelf: val }))}
        showDocs={(val) =>
          setState(
            (prev) => ({ ...prev, showDocs: val, viewArchive: false }),
            () => refreshDocs()
          )
        }
        showSearch={() =>
          setState(
            (prev) => ({ ...prev, showSearch: true }),
            () => handleSearch({ preventDefault: () => {} })
          )
        }
        showAbout={() => setState((prev) => ({ ...prev, showAbout: true }))}
        showHelp={() => setState((prev) => ({ ...prev, showHelp: true }))}
        showSettings={() =>
          setState((prev) => ({ ...prev, showSettings: true }))
        }
        showContact={() => setState((prev) => ({ ...prev, showContact: true }))}
      />

      {state.showSearch && (
        <SearchModal
          searchString={state.searchString}
          searchResults={state.searchResults}
          handleSearch={handleSearch}
          setSearchString={(value) =>
            setState((prev) => ({ ...prev, searchString: value }))
          }
          closeSearch={() => closeSearchModal()}
          goToBlock={(blockId) => goToSearchResult(blockId)}
        />
      )}

      {state.showDocs && (
        <DocsModal
          closeDocsModal={() =>
            setState((prev) => ({ ...prev, showDocs: false }))
          }
          handleImport={handleImport}
          startNewFile={startNewFile}
          offlineMode={state.offlineMode}
          docs={state.docs}
          viewArchive={state.viewArchive}
          toggleViewArchive={() =>
            setState((prev) => ({ ...prev, viewArchive: !prev.viewArchive }))
          }
          currentDoc={state.currentDoc}
          openFile={openFile}
          takeFileAction={takeFileAction}
        />
      )}

      {state.showSettings && (
        <SettingsModal
          closeSettings={() =>
            setState((prev) => ({ ...prev, showSettings: false }))
          }
          darkMode={state.darkMode}
          setDarkMode={setDarkMode}
          offlineMode={state.offlineMode}
          setOfflineMode={setOfflineMode}
          spellcheck={state.spellcheck}
          setSpellcheck={setSpellcheck}
          serif={state.serif}
          setSerif={setSerif}
          handleViewImageFolder={handleViewImageFolder}
        />
      )}

      {state.showContact && (
        <ContactModal
          closeContact={() =>
            setState((prev) => ({ ...prev, showContact: false }))
          }
        />
      )}

      {state.showAbout && (
        <AboutModal
          closeAbout={() => setState((prev) => ({ ...prev, showAbout: false }))}
        />
      )}

      {state.showHelp && (
        <HelpModal
          closeHelp={() => setState((prev) => ({ ...prev, showHelp: false }))}
        />
      )}
    </div>
  );
}

export default MarkThree;
