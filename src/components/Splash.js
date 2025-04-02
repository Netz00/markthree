import React from "react";
import MarkThree from "./MarkThree";
import "./Splash.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import $ from "jquery";
import { get, set } from "idb-keyval";
import logo from "../img/logo512.png";
import $script from "scriptjs";

class Splash extends React.Component {
  constructor(props) {
    super(props);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleSwitchUser = this.handleSwitchUser.bind(this);
    this.state = {
      tryItNow: document.location.pathname.startsWith("/try-it-now"),
      isAuthenticated: null,
    };
    Error.stackTraceLimit = 100;
  }

  componentWillMount() {
    $script("https://apis.google.com/js/client.js", () => {
      const gapi = window.gapi;
      if (gapi) {
        gapi.load("client:auth2", () => {
          const initSettings = {
            client_id:
              "346746556737-32h3br6e6beeerm71norabl2icv4rl7e.apps.googleusercontent.com",
            scope:
              "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata",
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            ],
            response_type: "id_token permission",
          };

          gapi.client.init(initSettings).then(() => {
            let isAuthenticated = gapi.auth2.getAuthInstance().isSignedIn.get();
            if (isAuthenticated) {
              try {
                window.gtag("event", "login", { method: "Google" });
              } catch {}
              const userEmail = gapi.auth2
                .getAuthInstance()
                .currentUser.get()
                .getBasicProfile()
                .getEmail();
              this.setState({ isAuthenticated, gapi, userEmail });
              set("userEmail", userEmail);
            } else {
              this.setState({ isAuthenticated, gapi });
            }
          });
        });
      } else {
        get("userEmail").then((userEmail) => {
          this.setState({
            isAuthenticated: true,
            offlineMode: true,
            userEmail,
          });
        });
      }
    });
  }

  handleLogin() {
    try {
      window.gtag("event", "sign_up", { method: "Google" });
    } catch {}

    this.state.gapi.auth2
      .getAuthInstance()
      .signIn()
      .then(() => {
        const isAuthenticated = this.state.gapi.auth2
          .getAuthInstance()
          .isSignedIn.get();
        if (isAuthenticated) {
          const userEmail = this.state.gapi.auth2
            .getAuthInstance()
            .currentUser.get()
            .getBasicProfile()
            .getEmail();
          this.setState({ isAuthenticated, userEmail });
          set("userEmail", userEmail);
          $(".m2-is-signed-out").hide();
        }
      });
  }

  handleSwitchUser() {
    this.state.gapi.auth2
      .getAuthInstance()
      .signIn({ prompt: "select_account" })
      .then(() => {
        window.location.reload();
      });
  }

  handleLogout() {
    this.state.gapi.auth2
      .getAuthInstance()
      .signOut()
      .then(() =>
        this.setState({ isAuthenticated: false }, () => {
          $(window).scrollTop(0);
          $("body").removeClass("m2-dark-mode");
        })
      );
  }

  render() {
    return (
      <div>
        {this.state.tryItNow && (
          <MarkThree
            gapi={this.state.gapi}
            handleLogout={() => (window.location = "/")}
            handleLogin={() =>
              alert(
                "You're in anonymous mode! To log in please sign in under your google account"
              )
            }
            handleSwitchUser={() =>
              alert("Sorry! Can't switch users in anonymous mode.")
            }
            tryItNow={true}
            offlineMode={this.state.offlineMode}
          />
        )}
        {!this.state.tryItNow && this.state.isAuthenticated && (
          <MarkThree
            key={this.state.userEmail}
            userEmail={this.state.userEmail}
            gapi={this.state.gapi}
            handleLogout={this.handleLogout}
            handleLogin={this.handleLogin}
            handleSwitchUser={this.handleSwitchUser}
            tryItNow={false}
            offlineMode={this.state.offlineMode}
          />
        )}
        {!this.state.tryItNow && this.state.isAuthenticated === null && (
          <div className="m2-load-screen">
            <h1 className="title is-1">
              <img src={logo} alt="logo" />
              MarkThree
              <img src={logo} alt="logo" />
            </h1>
          </div>
        )}
        {!this.state.tryItNow && this.state.isAuthenticated === false && (
          <div className="m2-splash-container">
            <div className="m2-splash">
              <div className="m2-hero">
                <h1 className="title is-1">
                  <img src={logo} alt="logo" />
                  MarkThree
                  <img src={logo} alt="logo" />
                </h1>
                <p>A seamless, speedy, syncing markdown editor.</p>
                <div className="m2-cta">
                  <a
                    className="button is-primary is-outlined"
                    href="/try-it-now"
                  >
                    Try the demo
                  </a>
                  <button
                    className="button is-primary is-outlined"
                    onClick={this.handleLogin}
                  >
                    <FontAwesomeIcon icon={faGoogle} />
                    &nbsp;&nbsp;Log in with Google
                  </button>
                </div>
              </div>

              <div className="m2-tiles">
                <div className="columns">
                  <div className="column">
                    <h4 className="title is-4">Seamless</h4>
                    <p>
                      Read and edit markdown from a single view. No need to
                      toggle back and forth.
                    </p>
                  </div>
                  <div className="column">
                    <h4 className="title is-4">Speedy</h4>
                    <p>
                      Tested on War & Peace, it's built for big docs like work
                      notes, personal notes, and journals.
                    </p>
                  </div>
                  <div className="column">
                    <h4 className="title is-4">Syncing</h4>
                    <p>
                      MarkThree is web-native, so it works across devices, and
                      your docs are always synced.
                    </p>
                  </div>
                </div>
                <hr />
                <div className="columns">
                  <div className="column">
                    <h4 className="title is-4">Private</h4>
                    <p>
                      MarkThree is a static app backed by your own Google
                      Drive&mdash;we don't store any of your data.
                    </p>
                  </div>
                  <div className="column">
                    <h4 className="title is-4">Powerful</h4>
                    <p>
                      Hashtags, search, reminders, slash commands, and much more
                      help you stay productive.
                    </p>
                  </div>
                  <div className="column">
                    <h4 className="title is-4">Free</h4>
                    <p>
                      No lock-in&mdash;MarkThree is free and open source, and
                      you can export your docs at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Splash;
