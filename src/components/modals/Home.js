import React from "react";
import "../../style/Splash.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import logo from "../../img/logo512.png";

export const Home = ({handleLogin}) => {
  return (
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
                Read and edit markdown from a single view. No need to toggle
                back and forth.
              </p>
            </div>
            <div className="column">
              <h4 className="title is-4">Speedy</h4>
              <p>
                Tested on War & Peace, it's built for big docs like work notes,
                personal notes, and journals.
              </p>
            </div>
            <div className="column">
              <h4 className="title is-4">Syncing</h4>
              <p>
                MarkThree is web-native, so it works across devices, and your
                docs are always synced.
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
                Hashtags, search, reminders, slash commands, and much more help
                you stay productive.
              </p>
            </div>
            <div className="column">
              <h4 className="title is-4">Free</h4>
              <p>
                No lock-in&mdash;MarkThree is free and open source, and you can
                export your docs at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
