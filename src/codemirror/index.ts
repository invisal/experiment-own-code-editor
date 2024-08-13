import { Compartment, StateEffect, type Extension } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("code-mirror")
export class CodeMirror extends LitElement {
  protected container: HTMLDivElement;
  protected editor: EditorView;
  protected extensions: { name: string; comp: Compartment; ext: Extension }[] =
    [{ name: "basic-setup", ext: basicSetup, comp: new Compartment() }];

  constructor() {
    super();

    const doc = document.createElement("div");
    doc.style.height = "100%";

    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(doc);

    const editor = new EditorView({
      extensions: this.getExtensions(),
      parent: doc,
    });

    this.editor = editor;
    this.container = doc;
  }

  render() {
    return this.container;
  }

  @property() set value(value: string) {
    this.editor.dispatch({
      changes: {
        from: 0,
        to: this.editor.state.doc.length,
        insert: value,
      },
    });
  }

  get value(): string {
    return this.editor.state.doc.toString();
  }

  private getExtensions() {
    return [
      EditorView.theme({
        "&": {
          height: "100%",
        },
        "& .cm-scroller": {
          height: "100% !important",
        },
      }),
      ...this.extensions.map((ext) => ext.comp.of(ext.ext)),
    ];
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
