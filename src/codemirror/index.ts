import { EditorView, basicSetup } from "codemirror";
import { Compartment, Extension, StateEffect } from "@codemirror/state";

export class CodeMirror extends HTMLElement {
  static observedAttributes = ["code"];

  protected editor: EditorView;
  protected extensions: { name: string; comp: Compartment; ext: Extension }[] =
    [{ name: "basic-setup", ext: basicSetup, comp: new Compartment() }];

  constructor() {
    super();

    const doc = document.createElement("div");
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(doc);

    const editor = new EditorView({
      extensions: this.getExtensions(),
      parent: doc,
    });

    this.editor = editor;
  }

  attributeChangedCallback(name: string, _: string, value: string) {
    if (name === "code") {
      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: value,
        },
      });
    }
  }

  private getExtensions() {
    return this.extensions.map((ext) => ext.comp.of(ext.ext));
  }

  updateExtension(extensionName: string, ext: any) {
    const exist = this.extensions.find(({ name }) => extensionName === name);

    if (!exist) {
      const extEntry = {
        name: extensionName,
        comp: new Compartment(),
        ext,
      };

      this.extensions.push(extEntry);

      this.editor.dispatch({
        effects: [StateEffect.appendConfig.of(extEntry.comp.of(ext))],
      });
    } else {
      exist.ext = ext;
      this.editor.dispatch({
        effects: [exist.comp.reconfigure(ext)],
      });
    }
  }

  removeExtension(name: string) {
    const extIndex = this.extensions.findIndex((ext) => ext.name === name);
    if (extIndex >= 0) {
      this.extensions.splice(extIndex, 1);
      this.editor.dispatch({
        effects: StateEffect.reconfigure.of(this.getExtensions()),
      });
    }
  }

  getEditor() {
    return this.editor;
  }
}

customElements.define("code-mirror", CodeMirror);
