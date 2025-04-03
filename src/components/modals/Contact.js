import React from "react";

export const ContactModal = (closeContact) => {
  return (
    <div className="m2-contact modal is-active">
      <div className="modal-background" onClick={closeContact}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Thanks for reaching out!</p>
          <button
            className="delete"
            aria-label="close"
            onClick={closeContact}
          ></button>
        </header>
        <section className="modal-card-body">
          <p>
            I welcome bug reports, feature requests, questions, comments,
            complaints, gossip, tirades, manifestos, rants, and much more.
            I&apos;ll do my best to get back to you within two business days.
          </p>
          <br />
          <form name="m2-contact" method="post" action="/submitted">
            <input type="hidden" name="form-name" value="m2-contact" />

            <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Your name..."
                  name="name"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Email</label>
              <div className="control">
                <input
                  className="input"
                  type="email"
                  placeholder="your@email.com"
                  name="email"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Message</label>
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="Your message..."
                  name="message"
                ></textarea>
              </div>
            </div>

            <div className="field is-grouped">
              <div className="control">
                <button type="submit" className="button is-link">
                  Submit
                </button>
              </div>
              <div className="control">
                <button className="button is-text" onClick={closeContact}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
