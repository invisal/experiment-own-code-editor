import { EditorView, basicSetup } from "codemirror";

export class CodeMirror extends HTMLElement {
  constructor() {
    super();

    const doc = document.createElement("div");
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(doc);

    new EditorView({
      extensions: [basicSetup],
      parent: doc,
    });
  }
}

customElements.define("code-mirror", CodeMirror);
