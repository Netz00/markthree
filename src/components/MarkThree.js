import React from "react";
import Shelf from "./Shelf";
import shortid from "shortid";
import Doc from "./Doc";
import "../style/MarkThree.scss";
import marked from "marked";
import syncUtils from "./syncUtils";
import syncUtilsOffline from "./syncUtilsOffline";
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

class MarkThree extends React.Component {
  constructor(props) {
    super(props);

    this.openFile = this.openFile.bind(this);
    this.startNewFile = this.startNewFile.bind(this);
    this.handleImport = this.handleImport.bind(this);
    this.toggleArchive = this.toggleArchive.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.takeFileAction = this.takeFileAction.bind(this);
    this.sync = this.sync.bind(this);
    this.refreshDocs = this.refreshDocs.bind(this);
    this.setOfflineMode = this.setOfflineMode.bind(this);
    this.setDarkMode = this.setDarkMode.bind(this);
    this.handleViewImageFolder = this.handleViewImageFolder.bind(this);
    this.handleMentionOrHashtagSearch =
      this.handleMentionOrHashtagSearch.bind(this);

    window.handleMentionOrHashtagSearch = this.handleMentionOrHashtagSearch;

    marked.setOptions({
      breaks: true,
      smartLists: true,
    });

    this.state = {
      gapi: this.props.gapi,
      searchString: "",
      searchResults: [],
      showShelf: false,
      darkMode: false,
      offlineMode: false,
      spellcheck: true,
      serif: false,
    };
  }

  componentDidMount() {
    this.appDataKey = `appData_${this.props.userEmail}`;
    get("offlineMode").then((offlineMode) => {
      offlineMode = !this.props.tryItNow
        ? (offlineMode && JSON.parse(offlineMode)) || !this.state.gapi
        : false;
      this.setState({ offlineMode }, () => {
        this.syncUtils = this.state.offlineMode
          ? syncUtilsOffline()
          : syncUtils(this.state.gapi);
        const currentDoc = shortid.generate();
        const defaultAppData = {
          currentDoc,
          docs: [{ id: currentDoc, title: false, lastModified: new Date() }],
          revision: 0,
          signUpDate: new Date(),
        };

        if (!this.props.tryItNow) {
          this.refreshDocs(defaultAppData);
        } else {
          this.setState({ ...defaultAppData, appData: defaultAppData });
        }

        get("darkMode").then(
          (value) => value && this.setDarkMode(JSON.parse(value))
        );
        get("spellcheck").then(
          (value) => value && this.setSpellcheck(JSON.parse(value))
        );
        get("serif").then((value) => value && this.setSerif(JSON.parse(value)));
        get("signUpDate").then(
          (value) => !value && set("signUpDate", JSON.stringify(new Date()))
        );
      });
    });
  }

  refreshDocs(defaultAppData) {
    return new Promise((resolve) => {
      (this.props.tryItNow
        ? new Promise((resolve) => resolve(_.clone(this.state.appData)))
        : this.syncUtils.initializeData(this.appDataKey, defaultAppData)
      ).then((appData) => {
        Promise.all(
          appData.docs.map((d) => {
            return get(d.id);
          })
        ).then((docMetaDataFiles) => {
          appData.docs = appData.docs.map((d, i) => {
            d.lastModified = docMetaDataFiles[i]
              ? JSON.parse(docMetaDataFiles[i]).lastModified
              : d.lastModified;
            return d;
          });
          this.sync(appData, {}).then(resolve);
        });
      });
    });
  }

  sync(appData, additionalState) {
    if (!this.syncing) {
      console.log(`starting sync: ${JSON.stringify(appData)}`);
      this.syncing = true;
      this.setState({ ...appData, ...additionalState, appData });
      return new Promise((resolve) => {
        if (!this.props.tryItNow) {
          this.syncUtils
            .syncByRevision(this.appDataKey, appData)
            .then((appData) => {
              console.log(`finished sync: ${JSON.stringify(appData)}`);
              this.setState({ ...appData, appData }, () => {
                this.syncing = false;
                resolve();
              });
            });
        } else {
          this.syncing = false;
          resolve();
        }
      });
    } else {
      // Return a Promise for the recursive call as well
      return new Promise((resolve) => {
        setTimeout(() => {
          this.sync(appData, additionalState).then(resolve);
        }, 200);
      });
    }
  }

  openFile(id) {
    this.setState({ currentDoc: false }, () => {
      $(window).scrollTop(0);
      const appData = _.cloneDeep(this.state.appData);
      appData.currentDoc = id;
      this.sync(appData, {
        showDocs: false,
        showShelf: false,
        initialData: false,
      });
    });
  }

  startNewFile() {
    console.log(`old doc: ${JSON.stringify(this.state.currentDoc)}`);
    this.setState({ currentDoc: false }, () => {
      console.log(`current doc: ${JSON.stringify(this.state.currentDoc)}`);
      $(window).scrollTop(0);
      const appData = _.cloneDeep(this.state.appData);
      const id = shortid.generate();
      appData.currentDoc = id;
      appData.docs.unshift({ id, title: false, lastModified: new Date() });
      this.sync(appData, {
        showDocs: false,
        initialData: false,
        showShelf: false,
      });
    });
  }

  deleteFile(fileName) {
    const currentDoc = this.state.currentDoc;
    this.setState({ currentDoc: false }, () => {
      const appData = _.cloneDeep(this.state.appData);
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
      this.sync(appData, { initialData: false });
      !this.props.tryItNow &&
        this.syncUtils.find(fileName, (docMetadata) => {
          this.syncUtils.deleteFiles(docMetadata.pageIds).then((results) => {
            this.syncUtils.deleteFile(fileName);
          });
        });
    });
  }

  handleImport(e) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const appData = _.cloneDeep(this.state.appData);
      const id = shortid.generate();
      appData.currentDoc = id;
      appData.docs.unshift({ id, title: false, lastModified: new Date() });
      this.setState({ currentDoc: false }, () => {
        $(window).scrollTop(0);
        this.sync(appData, {
          initialData: e.target.result,
          showDocs: false,
          showShelf: false,
        });
      });
    };
    reader.readAsText(e.target.files[0]);
  }

  setTitle(id, title) {
    const appData = _.cloneDeep(this.state.appData);
    appData.file = appData.docs.forEach((f) => {
      if (f.id === id) {
        f.title = title;
      }
    });
    this.sync(appData, {});
  }

  toggleArchive(id) {
    const appData = _.cloneDeep(this.state.appData);
    appData.file = appData.docs.forEach((f) => {
      if (f.id === id) {
        f.archived = !f.archived;
      }
    });
    this.sync(appData, { newTitle: false, editTitle: false });
  }

  handleSearch(e) {
    e.preventDefault();
    console.log(this.state.searchString);
    let searchResults;
    if (!this.state.searchString) {
      searchResults = this.state.allLines
        .filter((id) => this.state.doc[id].startsWith("// "))
        .map((id) => ({ id, html: this.state.doc[id].replace("// ", "") }))
        .slice(0, 1000);
    } else if (/^#todo$/i.test(this.state.searchString)) {
      let searchRegex = /(?:[-*+]|(?:[0-9]+\.))\s+\[\s\]\s/;
      searchResults = this.state.allLines
        .filter((id) => searchRegex.test(this.state.doc[id]))
        .map((id) => ({
          id,
          html: marked(this.state.doc[id]).replace(
            searchRegex,
            (m) => `<mark>${m}</mark>`
          ),
        }))
        .slice(0, 1000);
    } else {
      const exactMatchRegex = /^"(.+)"$/;
      let searchRegex;
      if (exactMatchRegex.test(this.state.searchString)) {
        searchRegex = new RegExp(
          this.state.searchString
            .match(exactMatchRegex)[1]
            .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          "ig"
        );
      } else {
        const keywords = this.state.searchString
          .split(" ")
          .map((t) => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")); // comment out regex expressions
        searchRegex = new RegExp(keywords.join("|"), "ig");
      }
      const whitespaceRegex = new RegExp("^[\\s\\n]*$");
      searchResults = this.state.allLines
        .filter((id) => searchRegex.test(this.state.doc[id]))
        .map((id) => ({
          id,
          html: marked(this.state.doc[id]).replace(
            searchRegex,
            (m) => `<mark>${m}</mark>`
          ),
        }))
        .slice(0, 1000);
    }
    this.setState({ searchResults });
  }

  takeFileAction(e, file) {
    switch (e.target.value) {
      case "rename":
        var newTitle = prompt("Please select a new file name:");
        if (newTitle) {
          this.setTitle(file.id, newTitle);
        }
        break;
      case "export":
        let lastTag;
        const blocks = [];
        this.state.allLines.forEach((id, i) => {
          const nextTag =
            $(marked(this.state.doc[id])).length &&
            $(marked(this.state.doc[id]))[0].tagName;
          if (lastTag === "P" && nextTag === "P") {
            blocks.push("\n" + this.state.doc[id]);
          } else {
            blocks.push(this.state.doc[id]);
          }
          lastTag = nextTag;
        });

        const text = blocks.join("\n");
        const title =
          this.state.docs.filter((f) => f.id === this.state.currentDoc).title ||
          "Untitled";
        download(text, `${title}.txt`);
        break;
      case "toggleArchive":
        this.toggleArchive(file.id);
        break;
      case "delete":
        const confirmed = window.confirm(
          `Permanently delete ${file.title || "Untitled"}?`
        );
        if (confirmed) {
          this.deleteFile(file.id);
        }
        break;
      default:
        console.error(
          `Invalid action ${e.target.value} executed on file ${file.id}`
        );
    }
  }

  setDarkMode(value) {
    this.setState({ darkMode: value }, () => {
      this.state.darkMode
        ? $("body").addClass("m2-dark-mode")
        : $("body").removeClass("m2-dark-mode");
      set("darkMode", JSON.stringify(value));
    });
  }

  setOfflineMode(value, callback) {
    return new Promise((resolve) => {
      this.setState({ offlineMode: value }, () => {
        this.syncUtils = this.state.offlineMode
          ? syncUtilsOffline()
          : syncUtils(this.state.gapi);
        set("offlineMode", JSON.stringify(value)).then(resolve);
      });
    });
  }

  setSpellcheck(value, callback) {
    return new Promise((resolve) => {
      this.setState({ spellcheck: value }, () => {
        set("spellcheck", JSON.stringify(value)).then(resolve);
        $("body").attr("spellcheck", this.state.spellcheck);
      });
    });
  }

  setSerif(value, callback) {
    return new Promise((resolve) => {
      this.setState({ serif: value }, () => {
        set("serif", JSON.stringify(value)).then(resolve);
        if (this.state.serif) {
          $("#m2-doc").addClass("m2-serif");
        } else {
          $("#m2-doc").removeClass("m2-serif");
        }
      });
    });
  }

  handleViewImageFolder(e) {
    this.syncUtils.getImagesFolder().then((id) => {
      window.open(`https://drive.google.com/drive/u/0/folders/${id}`, "_blank");
    });
  }

  handleMentionOrHashtagSearch(mentionOrHashtag) {
    this.setState({ searchString: mentionOrHashtag, showSearch: true }, () => {
      this.handleSearch({ preventDefault: () => {} });
    });
  }

  goToSearchResult(blockId) {
    this.setState({
      goToBlock: blockId,
      showSearch: false,
      searchString: "",
      searchResults: [],
      showShelf: false,
    });
  }

  closeSearchModal() {
    this.setState({
      showSearch: false,
      searchString: "",
      searchResults: [],
    });
  }

  render() {
    return (
      <div>
        {this.state.currentDoc && (
          <Doc
            key={this.state.currentDoc}
            currentDoc={this.state.currentDoc}
            gapi={this.props.gapi}
            handleLogout={this.props.handleLogout}
            handleSwitchUser={this.props.handleSwitchUser}
            handleLogin={this.props.handleLogin}
            tryItNow={this.props.tryItNow}
            initialData={
              this.state.initialData || (this.props.tryItNow && tryItNowText)
            }
            goToBlock={this.state.goToBlock}
            setDocData={(allLines, doc) => this.setState({ allLines, doc })}
            offlineMode={this.state.offlineMode}
            spellcheck={this.state.spellcheck}
          />
        )}
        <Shelf
          handleLogout={this.props.handleLogout}
          handleSwitchUser={this.props.handleSwitchUser}
          gapi={this.props.gapi}
          tryItNow={this.props.tryItNow}
          offlineMode={this.state.offlineMode}
          showShelf={this.state.showShelf}
          setShelf={(val) => this.setState({ showShelf: val })}
          showDocs={(val) =>
            this.setState(
              { showDocs: val, viewArchive: false },
              this.refreshDocs
            )
          }
          showSearch={() =>
            this.setState({ showSearch: true }, () =>
              this.handleSearch({ preventDefault: () => {} })
            )
          }
          showAbout={() => this.setState({ showAbout: true })}
          showHelp={() => this.setState({ showHelp: true })}
          showSettings={() => this.setState({ showSettings: true })}
          showContact={() => this.setState({ showContact: true })}
        />

        {this.state.showSearch && (
          <SearchModal
            searchString={this.state.searchString}
            searchResults={this.state.searchResults}
            handleSearch={this.handleSearch}
            setSearchString={(value) => this.setState({ searchString: value })}
            closeSearch={() => this.closeSearchModal()}
            goToBlock={(blockId) => this.goToSearchResult(blockId)}
          />
        )}

        {this.state.showDocs && (
          <DocsModal
            closeDocsModal={() => this.setState({ showDocs: false })}
            handleImport={this.handleImport}
            startNewFile={this.startNewFile}
            offlineMode={this.state.offlineMode}
            docs={this.state.docs}
            viewArchive={this.state.viewArchive}
            toggleViewArchive={() =>
              this.setState({ viewArchive: !this.state.viewArchive })
            }
            currentDoc={this.state.currentDoc}
            openFile={this.openFile}
            takeFileAction={this.takeFileAction}
          />
        )}

        {this.state.showSettings && (
          <SettingsModal
            closeSettings={() => this.setState({ showSettings: false })}
            darkMode={this.state.darkMode}
            setDarkMode={this.setDarkMode}
            offlineMode={this.state.offlineMode}
            setOfflineMode={this.setOfflineMode}
            spellcheck={this.state.spellcheck}
            setSpellcheck={this.setSpellcheck}
            serif={this.state.serif}
            setSerif={this.setSerif}
            handleViewImageFolder={this.handleViewImageFolder}
          />
        )}

        {this.state.showContact && (
          <ContactModal
            closeContact={() => this.setState({ showContact: false })}
          />
        )}

        {this.state.showAbout && (
          <AboutModal closeAbout={() => this.setState({ showAbout: false })} />
        )}

        {this.state.showHelp && (
          <HelpModal closeHelp={() => this.setState({ showHelp: false })} />
        )}
      </div>
    );
  }
}

export default MarkThree;
