import { Compartment, StateEffect, type Extension } from "@codemirror/state";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  foldKeymap,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  keymap,
  highlightActiveLine,
  dropCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  autocompletion,
  completionKeymap,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { EditorView } from "codemirror";
import { LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { moondustTheme } from "./theme";

@customElement("code-mirror")
export class CodeMirror extends LitElement {
  protected container: HTMLDivElement;
  protected editor: EditorView;
  protected extensions: { name: string; comp: Compartment; ext: Extension }[] =
    [];

  protected isWrapped: boolean = false;

  constructor() {
    super();

    // Default extensions
    this.extensions = [
      {
        name: "basic-setup",
        ext: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          dropCursor(),
          indentOnInput(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          autocompletion(),
          highlightActiveLine(),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
          ]),
        ],
        comp: new Compartment(),
      },
      {
        name: "theme",
        ext: moondustTheme(
          typeof this.getAttribute("dark") === "string" ? "dark" : "light"
        ),
        comp: new Compartment(),
      },
    ];

    const doc = document.createElement("div");
    doc.style.height = "100%";

    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(doc);

    const editor = new EditorView({
      doc: this.getAttribute("value") ?? "",
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

  @property() set wrap(value: string | null) {
    if (value !== null) {
      this.isWrapped = true;
      this.updateExtension("line-wrap", EditorView.lineWrapping);
    } else {
      this.isWrapped = false;
      this.removeExtension("line-wrap");
    }
  }

  get wrap(): boolean {
    return this.isWrapped;
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
