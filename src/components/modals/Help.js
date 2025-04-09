import React from 'react'

export const HelpModal = (closeHelp) => {
  return (
    <div className="m2-help modal is-active">
      <div className="modal-background" onClick={closeHelp}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Help</p>
          <button
            className="delete"
            aria-label="close"
            onClick={closeHelp}
          ></button>
        </header>
        <section className="modal-card-body content">
          <h2>General notes</h2>
          <p>Thanks for using MarkThree!</p>
          <ul>
            <li>
              When you select a block (paragraph), it automatically transforms
              that HTML into markdown, and when you exit the block, it renders
              to HTML. Since Markdown can be multiline, you'll have to press
              enter twice to exit a block.
            </li>
            <li>
              MarkThree continuously and efficiently syncs the document you're
              working via Google Drive. When the edit indicator bar turns light
              blue (or dark pink in dark mode), it means changes are being made.
              Once it turns dark blue (bright pink in dark mode), the changes
              are synced (a few seconds after you're done editing).
            </li>
            <li>
              We do not have access to your documents, they are as secure as
              your Google account (we recommend enabling two factor
              authentication).
            </li>
            <li>
              You can search for keywords, adding quotes matches "exact terms",
              and the special keyword #todo searches for all undone checklist
              tasks.
            </li>
          </ul>
          <h2>Writing with MarkThree</h2>
          <p>MarkThree supports most features of github flavored markdown.</p>
          <h5>Inline Formatting</h5>
          <pre>
            {`Italics: *single asterisks* or _single underscores_
Bold: **double asterisks** or __double underscores__
Strikethrough: ~tildas~
Code: \`backticks\`
Links: [Text in brackets](https://link-in-parentheses.com)`}
          </pre>

          <h5>Headers</h5>
          <pre>
            {`# One hash and a space for title header
## Two hashes makes a subheader

(3-6 hashes renders progressively smaller headers)`}
          </pre>
          <h5>Unorderd list</h5>
          <pre>
            {`- Dash or asterisk (*) followed by a space
- like this
    * Four spaces and a dash or asterisk starts a sub-list`}
          </pre>

          <h5>Ordered lists</h5>
          <pre>
            {`1. Any number followed by a period and space
1. The numbers themselves don't matter
    1. Again, four spaces starts a sub-list`}
          </pre>

          <h5>Todo lists and Reminders</h5>
          <p>
            MarkThree supports the standard syntax for todo lists. Additionally,
            it supports reminders&mdash;when a not-done todo list item contains
            a reminder string, you'll get a banner reminder when you load
            MarkThree on or after that day. The format for a reminder string is
            :reminder-ribbon: [date][semi-colon].
          </p>
          <pre>
            {`- [ ] A dash, a space, brackets with a space in between
- [x] An x in the middle marks it as done
- [ ] Reminders looks like this 🎗 July 2, 2024;`}
          </pre>

          <h5>Tables</h5>
          <pre>
            {`| Header1  | Header2 |
| -------  | ------- |
| entry 1  | entry2  |`}
          </pre>

          <h5>Block quotes</h5>
          <pre>
            {`> An angle bracket and a space will render a block quote.`}
          </pre>

          <h5>Code blocks</h5>
          <pre>
            {`\`\`\`
var success = "Text sandwiched by three backticks renders a code block";
\`\`\``}
          </pre>

          <h5>Horizontal Rule</h5>
          <p>
            A line consisting solely of three or more dashes renders a
            horizontal rule.
          </p>
          <pre>{`---`}</pre>

          <h5>Bookmarks</h5>
          <p>
            A line that starts with two slashes and a space gets rendered as a
            bookmark, and shows up by default in the <code>Search</code> view.
          </p>
          <pre>{`// January notes`}</pre>

          <h5>Images</h5>
          <p>
            Link to images across the web with standard markdown syntax, or
            upload your own with the <code>/image</code> command.
          </p>
          <pre>
            {`![alt-text](https://images.com/image-url.png)
/image`}
          </pre>

          <h5>HTML</h5>
          <p>
            The markdown spec is not intended to completely replace HTML. If
            you'd like a particular tag or style, you can just include it as
            HTML and it will render. For example:
          </p>
          <pre>
            {`Render highlighted text with the mark tag like <mark>this</mark>
And underlined text <u>like this</u>
<center>This will be centered</center>`}
          </pre>

          <h5>Text Tricks</h5>
          <p>
            MarkThree expands the strings <code>/today</code> and{' '}
            <code>/now</code> into the current date or date and time for your
            locale. You can also use <code>/date</code> to bring up a date
            picker&mdash;this is especially handy when you're setting reminders.
            Also, to make things easier to find later, <code>#hashtags</code>{' '}
            and <code>@mentions</code> autocomplete. You can also search for and
            enter emojis with colons like this: <code>:emojis:</code>
          </p>
          <pre>{`# Star date: /today
#hashtags, @mentions
:smiley_face:`}</pre>
          <p>
            <b>That's it, enjoy!</b>
          </p>
          <p>
            <br />
          </p>
        </section>
      </div>
    </div>
  )
}
