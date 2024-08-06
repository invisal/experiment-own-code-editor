import { EditorView, basicSetup } from "codemirror";
import { promptPlugin } from "./propmt";
import { Compartment, Extension, StateEffect } from "@codemirror/state";

export class CodeMirror extends HTMLElement {
  protected editor: EditorView;
  protected extensions: { name: string; comp: Compartment; ext: Extension }[] =
    [];

  constructor() {
    super();

    const doc = document.createElement("div");
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(doc);

    const editor = new EditorView({
      extensions: [basicSetup, ...promptPlugin],
      parent: doc,
    });

    this.editor = editor;

    editor.dispatch({
      changes: {
        from: 0,
        insert: `SELECT * FROM outerbase WHERE age < 10;

DELETE FROM users WHEER name = 'Visal';`,
      },
    });
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

      console.log("add plugin");
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

  getEditor() {
    return this.editor;
  }
}

customElements.define("code-mirror", CodeMirror);
