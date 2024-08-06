import { CodeMirrorPlugin } from "./plugin";
import { sql, SQLite } from "@codemirror/lang-sql";

export class CodeMirrorSqlPlugin extends CodeMirrorPlugin {
  connectedCallback() {
    super.connectedCallback();

    console.log("here");

    this.editor.updateExtension(
      "sql-plugin",
      sql({
        dialect: SQLite,
        schema: {
          outerbase: ["id", "name"],
          users: ["id", "name", "age"],
        },
      })
    );
  }
}

customElements.define("code-mirror-sql", CodeMirrorSqlPlugin);
