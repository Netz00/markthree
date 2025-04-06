import React, { useState, useEffect, useCallback } from "react";
import MarkThree from "./MarkThree";
import "../style/Splash.scss";
import $ from "jquery";
import { get, set } from "idb-keyval";
import logo from "../img/logo512.png";
import $script from "scriptjs";
import { Home } from "./modals/Home";

const Splash = () => {
  const [tryItNow] = useState(
    document.location.pathname.startsWith("/try-it-now")
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gapiState, setGapiState] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  // add helper function for updating auth state
  const updateAuthState = (authInstance) => {
    const authenticated = authInstance.isSignedIn.get();
    if (authenticated) {
      try {
        window.gtag("event", "login", { method: "Google" });
      } catch (e) {}
      const email = authInstance.currentUser.get().getBasicProfile().getEmail();
      setUserEmail(email);
      setIsAuthenticated(true);
      set("userEmail", email);
    } else {
      setIsAuthenticated(false);
    }
  };

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
            setGapiState(gapi);
            updateAuthState(authInstance);
            setLoading(false); // set loading to false after auth check
          });
        });
      } else {
        get("userEmail").then((email) => {
          setUserEmail(email);
          setIsAuthenticated(true);
          setOfflineMode(true);
          setLoading(false); // set loading to false after fallback auth check
        });
      }
    });
  }, []);

  const handleLogin = useCallback(() => {
    try {
      window.gtag("event", "sign_up", { method: "Google" });
    } catch (e) {}
    if (gapiState) {
      const authInstance = gapiState.auth2.getAuthInstance();
      authInstance.signIn().then(() => {
        updateAuthState(authInstance);
        if (authInstance.isSignedIn.get()) {
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
      {!tryItNow &&
        loading && (
          <div className="m2-load-screen">
            <h1 className="title is-1">
              <img src={logo} alt="logo" />
              MarkThree
              <img src={logo} alt="logo" />
            </h1>
          </div>
        )}
      {!tryItNow && !loading && !isAuthenticated && (
        <Home handleLogin={handleLogin} />
      )}
    </div>
  );
};

export default Splash;
