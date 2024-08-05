import { UniversalEditor } from "..";

export class UniversalPlugin extends HTMLElement {
  protected editor!: UniversalEditor;

  connectedCallback() {
    let ancestor = this.parentElement;
    while (ancestor) {
      if (ancestor.tagName.toLowerCase() === "universal-editor") {
        break;
      }
      ancestor = ancestor.parentElement;
    }

    if (!ancestor) throw new Error("Failed to find parent <text-editor />");

    this.editor = ancestor as unknown as UniversalEditor;
  }
}
