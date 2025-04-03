import React from "react";
import me from "../../img/me.jpg";
import coffee from "../../img/coffee.png";

export const AboutModal = (closeAbout) => {
  return (
    <div className="m2-about modal is-active">
      <div className="modal-background" onClick={closeAbout}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">About</p>
          <button
            className="delete"
            aria-label="close"
            onClick={closeAbout}
          ></button>
        </header>
        <section className="modal-card-body">
          <p>
            MarkThree was created by me, Anthony Garvan. I&apos;m a software
            developer based out of Chicago. I love spending time with my family,
            working with my team, and tinkering with random projects like this
            one.
          </p>

          <p>
            MarkThree is my second attempt at a markdown editor, and obviously
            my best. It took many months to get right, if you enjoy using it
            please consider showing your appreciation by buying me a cup of
            coffee ☕❤️.
          </p>
          <div className="m2-me">
            <img className="m2-profile" src={me} alt="developer" />
            <div></div>
          </div>
        </section>
        <footer className="modal-card-foot">
          <a href="/privacy.txt" target="_blank">
            Privacy
          </a>
          <a href="/terms.txt" target="_blank">
            Terms
          </a>
          <a
            href="https://github.com/anthonygarvan/markthree"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
          <a
            className="m2-coffee is-pulled-right"
            href="https://www.buymeacoffee.com/GDsZofV"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={coffee} alt="Buy Me A Coffee" />
          </a>
        </footer>
      </div>
    </div>
  );
};
