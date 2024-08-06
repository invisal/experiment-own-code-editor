import { EditorView, basicSetup } from "codemirror";
import { promptPlugin } from "./propmt";
import { sql, SQLite } from "@codemirror/lang-sql";

export class CodeMirror extends HTMLElement {
  constructor() {
    super();

    const doc = document.createElement("div");
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(doc);

    const editor = new EditorView({
      extensions: [
        basicSetup,
        ...promptPlugin,
        sql({
          dialect: SQLite,
          schema: {
            outerbase: ["id", "name"],
            users: ["id", "name", "age"],
          },
        }),
      ],
      parent: doc,
    });

    editor.dispatch({
      changes: {
        from: 0,
        insert: `SELECT * FROM outerbase WHERE age < 10;

DELETE FROM users WHEER name = 'Visal';`,
      },
    });
  }
}

customElements.define("code-mirror", CodeMirror);
