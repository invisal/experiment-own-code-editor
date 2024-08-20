import { Compartment, StateEffect, type Extension } from "@codemirror/state";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  foldKeymap,
  indentUnit,
} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentMore,
  indentLess,
} from "@codemirror/commands";
import {
  keymap,
  highlightActiveLine,
  dropCursor,
  lineNumbers,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  autocompletion,
  closeBracketsKeymap,
  acceptCompletion,
  completionStatus,
  startCompletion,
} from "@codemirror/autocomplete";
import { EditorView } from "codemirror";
import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { getPredefineTheme } from "./theme";
import { createRef, ref, Ref } from "lit/directives/ref.js";

@customElement("code-mirror")
export class CodeMirror extends LitElement {
  protected containerRef: Ref<HTMLDivElement> = createRef();
  protected editor?: EditorView;
  protected extensions: { name: string; comp: Compartment; ext: Extension }[] =
    [];

  protected isWrapped: boolean = false;
  protected _color: "dark" | "light" = "light";

  @property() theme: string = "moondust";

  static styles = [
    css`
      .cm-tooltip-autocomplete > ul > li {
        display: flex;
      }

      .cm-tooltip-autocomplete > ul > li > .cm-completionIcon {
        width: 1em !important;
        display: flex;
        align-self: center;
        justify-content: center;
      }

      .cm-tooltip-autocomplete .cm-completionLabel {
        flex-grow: 1;
      }

      .cm-tooltip-autocomplete .cm-completionDetail {
        padding-left: 15px;
      }

      .cm-completionIcon-property::after {
        content: "\\61" !important;
        font-family: "outerbase-icon" !important;
      }

      .cm-completionIcon-type::after {
        content: "\\62" !important;
        font-family: "outerbase-icon" !important;
      }

      .cm-completionIcon-function::after,
      .cm-completionIcon-method::after,
      .cm-completionIcon-variable::after,
      .cm-completionIcon-namespace::after,
      .cm-completionIcon-interface::after {
        content: "⚡" !important;
      }
    `,
  ];

  constructor() {
    super();

    // We will use icon font instead of SVG because CodeMirror rely
    // on :after content. It is easily to change the color of the icon
    // when we toggle dark/light mode.
    //
    // To construct the font, you can do it on
    // https://icomoon.io/app/
    // \62 => https://phosphoricons.com/?q=%22column%22
    // \61 => https://phosphoricons.com/?q=%22table%22
    if (!document.getElementById("codemirror-custom-font")) {
      const head = document.head || document.getElementsByTagName("head")[0];
      const iconFontStyle = document.createElement("style");
      iconFontStyle.id = "codemirror-custom-font";
      head.appendChild(iconFontStyle);

      iconFontStyle.innerHTML = `
        @font-face {
            font-family: 'outerbase-icon';
            font-weight: normal;
            font-style: normal;
            font-display: block;
            src: url(data:@file/octet-stream;base64,d09GRgABAAAAAAVQAAsAAAAABQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPUy8yAAABCAAAAGAAAABgDxEM4WNtYXAAAAFoAAAAVAAAAFT/9AFKZ2FzcAAAAbwAAAAIAAAACAAAABBnbHlmAAABxAAAAUAAAAFAAL6X5WhlYWQAAAMEAAAANgAAADYogzvlaGhlYQAAAzwAAAAkAAAAJAdiA8dobXR4AAADYAAAABgAAAAYDgAAAGxvY2EAAAN4AAAADgAAAA4AyAB0bWF4cAAAA4gAAAAgAAAAIAANADJuYW1lAAADqAAAAYYAAAGGmUoJ+3Bvc3QAAAUwAAAAIAAAACAAAwAAAAMDVQGQAAUAAAKZAswAAACPApkCzAAAAesAMwEJAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAQAAAAGIDwP/AAEADwABAAAAAAQAAAAAAAAAAAAAAIAAAAAAAAwAAAAMAAAAcAAEAAwAAABwAAwABAAAAHAAEADgAAAAKAAgAAgACAAEAIABi//3//wAAAAAAIABh//3//wAB/+P/owADAAEAAAAAAAAAAAAAAAEAAf//AA8AAQAA/8AAAAPAAAIAADc5AQAAAAABAAD/wAAAA8AAAgAANzkBAAAAAAEAAP/AAAADwAACAAA3OQEAAAAABAAA/8ADQAPAABMAFwArAC8AAAEjIgYVMREUFjMxMzI2NTERNCYjESMRMyUjIgYVMREUFjMxMzI2NTERNCYjESMRMwGgoBslJRugGyUlG6CgAWCgGyUlG6AbJSUboKADQCUb/YAbJSUbAoAbJf1AAoBAJRv9gBslJRsCgBsl/UACgAAABgAA/8ADoAPAABMAFwAbAB8AIwAnAAABISIGFTERFBYzMSEyNjUxETQmIwEzFSM3IRUhARUhNREzFSMpATUhA4D9AA0TJRsCwBslEw39IKCg4AHg/iAB4P1AoKACwP4gAeADABMN/eAbJSUbAiANE/8AgICAAUCAgP6AgIAAAAABAAAAAAAAbqA4a18PPPUACwQAAAAAAOLie7QAAAAA4uJ7tAAA/8ADoAPAAAAACAACAAAAAAAAAAEAAAPA/8AAAAQAAAAAAAOgAAEAAAAAAAAAAAAAAAAAAAAGBAAAAAAAAAAAAAAAAgAAAAQAAAAEAAAAAAAAAAAKABQAHgBgAKAAAAABAAAABgAwAAYAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAADgCuAAEAAAAAAAEABwAAAAEAAAAAAAIABwBgAAEAAAAAAAMABwA2AAEAAAAAAAQABwB1AAEAAAAAAAUACwAVAAEAAAAAAAYABwBLAAEAAAAAAAoAGgCKAAMAAQQJAAEADgAHAAMAAQQJAAIADgBnAAMAAQQJAAMADgA9AAMAAQQJAAQADgB8AAMAAQQJAAUAFgAgAAMAAQQJAAYADgBSAAMAAQQJAAoANACkaWNvbW9vbgBpAGMAbwBtAG8AbwBuVmVyc2lvbiAxLjAAVgBlAHIAcwBpAG8AbgAgADEALgAwaWNvbW9vbgBpAGMAbwBtAG8AbwBuaWNvbW9vbgBpAGMAbwBtAG8AbwBuUmVndWxhcgBSAGUAZwB1AGwAYQByaWNvbW9vbgBpAGMAbwBtAG8AbwBuRm9udCBnZW5lcmF0ZWQgYnkgSWNvTW9vbi4ARgBvAG4AdAAgAGcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAASQBjAG8ATQBvAG8AbgAuAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==) format('woff2');
        }  
      `;
    }
  }

  protected firstUpdated(): void {
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
          indentUnit.of("  "),
          keymap.of([
            {
              key: "Tab",
              preventDefault: true,
              run: (target) => {
                if (completionStatus(target.state) === "active") {
                  acceptCompletion(target);
                } else {
                  indentMore(target);
                }
                return true;
              },
              shift: indentLess,
            },
            {
              key: "Ctrl-Space",
              mac: "Cmd-i",
              preventDefault: true,
              run: startCompletion,
            },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
          ]),
        ],
        comp: new Compartment(),
      },
      {
        name: "theme",
        ext: getPredefineTheme(this._color, this.theme),
        comp: new Compartment(),
      },
    ];

    const editor = new EditorView({
      doc: this.getAttribute("value") ?? "",
      extensions: this.getExtensions(),
      parent: this.containerRef.value,
      root: this.shadowRoot as ShadowRoot,
    });

    this.editor = editor;
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("theme")) {
      this.updateExtension("theme", getPredefineTheme(this._color, this.theme));
    }
  }

  render() {
    return html`<div
      id="container"
      ${ref(this.containerRef)}
      style="height: 100%"
    ></div>`;
  }

  @property() set value(value: string) {
    if (this.editor) {
      this.editor.dispatch({
        changes: {
          from: 0,
          to: this.editor.state.doc.length,
          insert: value,
        },
      });
    }
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

  @property() set color(value: string | null) {
    this._color = value === "dark" ? "dark" : "light";

    if (this._color === "dark") {
      this.containerRef.value?.classList.add("dark");
    } else {
      this.containerRef.value?.classList.remove("dark");
    }

    this.updateExtension("theme", getPredefineTheme(this._color, this.theme));
  }

  // @property() set theme(value: string) {
  //   this._theme = value;
  //   this.updateExtension("theme", getPredefineTheme(this._color, this._theme));
  // }

  // get theme() {
  //   return this._theme;
  // }

  get color() {
    return this._color;
  }

  get wrap(): boolean {
    return this.isWrapped;
  }

  get value(): string {
    if (this.editor) {
      return this.editor.state.doc.toString();
    }
    return "";
  }

  private getExtensions() {
    return [
      EditorView.theme({
        "&": {
          height: "100%",
        },
        "&.cm-scroller": {
          height: "100% !important",
        },
        "&.cm-focused": {
          outline: "none !important",
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

      if (this.editor) {
        this.editor.dispatch({
          effects: [StateEffect.appendConfig.of(extEntry.comp.of(ext))],
        });
      }
    } else {
      exist.ext = ext;
      if (this.editor) {
        this.editor.dispatch({
          effects: [exist.comp.reconfigure(ext)],
        });
      }
    }
  }

  removeExtension(name: string) {
    const extIndex = this.extensions.findIndex((ext) => ext.name === name);
    if (extIndex >= 0) {
      this.extensions.splice(extIndex, 1);

      if (this.editor) {
        this.editor.dispatch({
          effects: StateEffect.reconfigure.of(this.getExtensions()),
        });
      }
    }
  }

  getEditor() {
    return this.editor;
  }
}
