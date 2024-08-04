import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { VisalEditor } from "./visal-editor";

@customElement("sql-editor")
export class SqlEditor extends LitElement {
  protected editor: VisalEditor;

  constructor() {
    super();
    const editor = document.createElement("visal-editor");
    this.editor = editor;
  }

  render() {
    return this.editor;
  }
}
