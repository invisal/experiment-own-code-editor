import { EditorView } from "codemirror";
import { Prec, StateField, StateEffect } from "@codemirror/state";
import { WidgetType, Decoration, keymap } from "@codemirror/view";
import { AstraEditorPlugin } from "./base.js";
import { customElement } from "lit/decorators.js";

const effectAddHighlight = StateEffect.define<number>();
const effectClearHighlight = StateEffect.define();

class PlaceholderWidget extends WidgetType {
  toDOM(): HTMLElement {
    console.log("dom");
    const wrap = document.createElement("span");
    wrap.className = "cm-placeholder";
    wrap.style.padding = "";
    wrap.append(document.createTextNode("⌘ + L to get AI assistant"));
    return wrap;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

class PromptWidget extends WidgetType {
  cb: () => Promise<string>;

  constructor(cb: () => Promise<string>) {
    super();
    this.cb = cb;
  }

  toDOM(view: EditorView): HTMLElement {
    const cursorPosition = view.state.selection.main.head;

    // We keep previous suggestion so that we can remove it later
    // when we want to generate another suggestion or reject suggestion
    let previousSuggestion = "";

    const container = document.createElement("div");
    container.className = "prompt-container";

    container.innerHTML = `
      <div class='prompt-wrap'>
        <textarea rows="2" placeholder='New code instruction... (⇅ for history, @for code / documentation)'></textarea>
        <div class='prompt-action'>
          <div>
            <button id='prompt-generate'>Generate</button>
          </div>
          <div>
            <button id='prompt-reject'>Reject</button>
          </div>
          <div style='flex-grow:1; justify-content: end;'>Esc to close</div>
        </div>
      </div>
      <div class='prompt-preview'></div>
    `;

    const input = container.querySelector("textarea") as HTMLTextAreaElement;
    const preview = container.querySelector(
      ".prompt-preview"
    ) as HTMLDivElement;

    const generateButton = container.querySelector(
      "#prompt-generate"
    ) as HTMLButtonElement;
    const rejectButton = container.querySelector(
      "#prompt-reject"
    ) as HTMLButtonElement;

    rejectButton.addEventListener("click", () => {
      view.dispatch({
        changes: {
          from: cursorPosition,
          to: cursorPosition + previousSuggestion.length,
          insert: "",
        },
      });

      previousSuggestion = "";

      view.dispatch({
        effects: [effectClearHighlight.of(null)],
      });
    });

    generateButton.addEventListener("click", () => {
      generateButton.innerHTML = `
        <svg class='spin' xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader">
          <path d="M12 2v4"/>
          <path d="m16.2 7.8 2.9-2.9"/>
          <path d="M18 12h4"/>
          <path d="m16.2 16.2 2.9 2.9"/>
          <path d="M12 18v4"/>
          <path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/>
          <path d="m4.9 4.9 2.9 2.9"/>
        </svg> Generate`;

      this.cb()
        .then((r) => {
          // This plugin works on empty line. We need to add one dummy line
          // or else this widget will self-destruct
          const suggestion = "\n" + r;

          view.dispatch({
            changes: {
              from: cursorPosition,
              to: cursorPosition + previousSuggestion.length,
              insert: suggestion,
            },
          });

          view.dispatch({
            effects: [effectClearHighlight.of(null)],
          });

          const startLine = view.state.doc.lineAt(cursorPosition + 1).number;
          const endLine = view.state.doc.lineAt(
            cursorPosition + suggestion.length
          ).number;
          const lineEffect = [];

          for (let i = startLine; i <= endLine; i++) {
            lineEffect.push(effectAddHighlight.of(view.state.doc.line(i).from));
          }

          view.dispatch({ effects: lineEffect });

          previousSuggestion = suggestion;
          generateButton.innerText = "Generate";
        })
        .catch(console.error);
    });

    input.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        view.dispatch({ effects: [escapePrompt.of(null)] });
        setTimeout(() => view.focus(), 50);
        e.preventDefault();
      }

      e.stopPropagation();
    });

    setTimeout(() => input.focus(), 20);

    container.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    return container;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function createPromptStatePlugin(cb: () => Promise<string>) {
  return StateField.define({
    create() {
      return Decoration.none;
    },

    update(v, tr) {
      if (tr.effects.length > 0) {
        for (const e of tr.effects) {
          if (e.is(addPrompt)) {
            return Decoration.set([
              Decoration.widget({
                widget: new PromptWidget(cb),
                side: 1,
                block: true,
              }).range(e.value.from),
            ]);
          } else if (e.is(escapePrompt)) {
            return Decoration.none;
          } else if (e.is(effectClearHighlight)) {
            v = v.update({
              filter: (_, __, d) => d !== lineHighlightMark,
            });
          } else if (e.is(effectAddHighlight)) {
            console.log("line", e, e.value);
            v = v.update({
              add: [lineHighlightMark.range(e.value)],
            });
          }
        }
      }

      let widgetStillExist = false;
      v = v.update({
        filter: (f, _, d) => {
          if (d === lineHighlightMark) return true;

          const line = tr.state.doc.lineAt(tr.state.selection.main.from).text;
          if (line !== "") return false;
          widgetStillExist = f === tr.state.selection.main.from;
          return f === tr.state.selection.main.from;
        },
      });

      if (widgetStillExist) return v;

      const line = tr.state.doc.lineAt(tr.state.selection.main.from).text;
      if (line !== "") return Decoration.none;

      return Decoration.set([
        Decoration.widget({
          widget: new PlaceholderWidget(),
          side: 1,
          block: false,
        }).range(tr.state.selection.main.from),
      ]);
    },

    provide: (f) => EditorView.decorations.from(f),
  });
}

const addPrompt = StateEffect.define<{
  from: number;
  to: number;
}>({
  map: ({ from, to }, change) => {
    return {
      from: change.mapPos(from),
      to: change.mapPos(to),
    };
  },
});

const escapePrompt = StateEffect.define();

const lineHighlightMark = Decoration.line({
  class: "prompt-line-preview",
});

const promptKeyBinding = Prec.highest(
  keymap.of([
    {
      key: "Ctrl-l",
      mac: "Cmd-l",
      preventDefault: true,
      run: (v) => {
        if (v.state.doc.lineAt(v.state.selection.main.from).text === "") {
          v.dispatch({
            effects: [
              addPrompt.of({
                from: v.state.selection.main.from,
                to: v.state.selection.main.to,
              }),
            ],
          });
        }
        return true;
      },
    },
  ])
);

@customElement("astra-editor-prompt")
export class AstraEditorPromptPlugin extends AstraEditorPlugin {
  connectedCallback() {
    super.connectedCallback();

    this.editor.addStyle(
      "prompt",
      `
      .prompt-container {
        display: flex;
        flex-direction: column;
        padding: 5px 10px;
      }

      .prompt-wrap {
        border: 1px solid #aaa;
        border-radius: 5px;
        width: 100%;
        max-width: 500px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .prompt-wrap textarea {
        resize: none;
        border: none;
        padding: 5px 10px;
        overflow: hidden;
        outline: none;
        box-sizing: border-box;
        width: 100%;
      }

      .prompt-action {
        display: flex;
        padding: 5px 10px;
        gap: 5px;
      }

      .prompt-action div {
        display: flex;
      }

      .prompt-preview {
        display: flex;
        white-space: pre;
        padding: 5px;
        margin: 0;
        color: gray;
      }

      .prompt-line-preview {
        background: yellow;
      }

      #prompt-generate {
        display: flex;
      }
    `
    );

    this.editor.updateExtension("prompt", [
      promptKeyBinding,
      createPromptStatePlugin(async () => "Not implemented"),
    ]);
  }

  disconnectedCallback() {
    this.editor.removeStyle("prompt");
    this.editor.removeExtension("prompt");
  }

  handleSuggestion(callback: () => Promise<string>) {
    console.log("update extension");
    this.editor.updateExtension("prompt", [
      promptKeyBinding,
      createPromptStatePlugin(callback),
    ]);
  }
}
