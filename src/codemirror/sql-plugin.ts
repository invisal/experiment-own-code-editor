import { sql, SQLite, type SQLNamespace } from "@codemirror/lang-sql";
import { customElement, property } from "lit/decorators.js";
import { CodeMirrorPlugin } from "./base-plugin";

@customElement("code-mirror-sql")
export class CodeMirrorSqlPlugin extends CodeMirrorPlugin {
  protected schemaJson: SQLNamespace = {};

  @property() set schema(value: string) {
    try {
      this.schemaJson = JSON.parse(value);
    } catch {
      this.schemaJson = {};
    }

    // Reload the code mirror extensions
    this.editor.updateExtension(
      "sql-plugin",
      sql({
        dialect: SQLite,
        schema: this.schemaJson,
      })
    );
  }

  get schema(): string {
    return JSON.stringify(this.schemaJson);
  }

  connectedCallback() {
    super.connectedCallback();

    this.editor.updateExtension(
      "sql-plugin",
      sql({
        dialect: SQLite,
        schema: this.schemaJson,
      })
    );
  }

  disconnectedCallback() {
    this.editor.removeExtension("sql-plugin");
  }
}
