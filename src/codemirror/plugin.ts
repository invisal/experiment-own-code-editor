import { CodeMirror } from ".";

export class CodeMirrorPlugin extends HTMLElement {
  protected editor!: CodeMirror;

  connectedCallback() {
    let ancestor = this.parentElement;
    while (ancestor) {
      if (ancestor.tagName.toLowerCase() === "code-mirror") {
        break;
      }
      ancestor = ancestor.parentElement;
    }

    if (!ancestor) throw new Error("Failed to find parent <text-editor />");

    this.editor = ancestor as unknown as CodeMirror;
  }
}
