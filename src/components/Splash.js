import React, { useState, useEffect, useCallback } from "react";
import MarkThree from "./MarkThree";
import "../style/Splash.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import $ from "jquery";
import { get, set } from "idb-keyval";
import logo from "../img/logo512.png";
import $script from "scriptjs";

const Splash = () => {
  const [tryItNow] = useState(document.location.pathname.startsWith("/try-it-now"));
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [gapiState, setGapiState] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
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
            const authInstance = gapi.auth2.getAuthInstance();
            const authenticated = authInstance.isSignedIn.get();
            setGapiState(gapi);
            if (authenticated) {
              try {
                window.gtag("event", "login", { method: "Google" });
              } catch (e) {}
              const email = authInstance
                .currentUser.get()
                .getBasicProfile()
                .getEmail();
              setUserEmail(email);
              setIsAuthenticated(authenticated);
              set("userEmail", email);
            } else {
              setIsAuthenticated(authenticated);
            }
          });
        });
      } else {
        get("userEmail").then((email) => {
          setUserEmail(email);
          setIsAuthenticated(true);
          setOfflineMode(true);
        });
      }
    });
  }, []);

  const handleLogin = useCallback(() => {
    try {
      window.gtag("event", "sign_up", { method: "Google" });
    } catch (e) {}
    if (gapiState) {
      gapiState.auth2
        .getAuthInstance()
        .signIn()
        .then(() => {
          const authenticated = gapiState.auth2.getAuthInstance().isSignedIn.get();
          if (authenticated) {
            const email = gapiState.auth2
              .getAuthInstance()
              .currentUser.get()
              .getBasicProfile()
              .getEmail();
            setUserEmail(email);
            setIsAuthenticated(authenticated);
            set("userEmail", email);
            $(".m2-is-signed-out").hide();
          }
        });
    }
  }, [gapiState]);

  const handleSwitchUser = useCallback(() => {
    if (gapiState) {
      gapiState.auth2
        .getAuthInstance()
        .signIn({ prompt: "select_account" })
        .then(() => window.location.reload());
    }
  }, [gapiState]);

  const handleLogout = useCallback(() => {
    if (gapiState) {
      gapiState.auth2
        .getAuthInstance()
        .signOut()
        .then(() => {
          setIsAuthenticated(false);
          $(window).scrollTop(0);
          $("body").removeClass("m2-dark-mode");
        });
    }
  }, [gapiState]);

  return (
    <div>
      {tryItNow && (
        <MarkThree
          gapi={gapiState}
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
          offlineMode={offlineMode}
        />
      )}
      {!tryItNow && isAuthenticated && (
        <MarkThree
          key={userEmail}
          userEmail={userEmail}
          gapi={gapiState}
          handleLogout={handleLogout}
          handleLogin={handleLogin}
          handleSwitchUser={handleSwitchUser}
          tryItNow={false}
          offlineMode={offlineMode}
        />
      )}
      {!tryItNow && isAuthenticated === null && (
        <div className="m2-load-screen">
          <h1 className="title is-1">
            <img src={logo} alt="logo" />
            MarkThree
            <img src={logo} alt="logo" />
          </h1>
        </div>
      )}
      {!tryItNow && isAuthenticated === false && (
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
                <a className="button is-primary is-outlined" href="/try-it-now">
                  Try the demo
                </a>
                <button
                  className="button is-primary is-outlined"
                  onClick={handleLogin}
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
};

export default Splash;
