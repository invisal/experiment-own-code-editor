import { EditorView } from "codemirror";
import { Prec, StateField, StateEffect } from "@codemirror/state";
import { WidgetType, Decoration, keymap } from "@codemirror/view";
import { CodeMirrorPlugin } from "./plugin";
import { customElement } from "lit/decorators.js";

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
  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement("div");
    wrap.style.border = "1px solid #aaa";
    wrap.style.borderRadius = "5px";
    wrap.style.width = "100%";
    wrap.style.boxSizing = "border-box";
    wrap.style.overflow = "hidden";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";

    const input = document.createElement("textarea");
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.outline = "none";
    input.rows = 2;
    wrap.append(input);

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

    input.placeholder =
      "New code instruction... (⇅ for history, @for code / documentation)";
    input.style.resize = "none";
    input.style.border = "none";
    input.style.padding = "5px 10px";
    input.rows = 1;
    input.style.overflow = "hidden";

    const escapeInstruction = document.createElement("div");
    escapeInstruction.innerText = "Esc to close";
    escapeInstruction.style.fontSize = "10px";
    escapeInstruction.style.padding = "0 10px 5px 10px";
    escapeInstruction.style.color = "#555";
    wrap.append(escapeInstruction);

    setTimeout(() => input.focus(), 20);

    const container = document.createElement("div");
    container.style.padding = "5px 10px";
    container.append(wrap);

    return container;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const promptStatePlugin = StateField.define({
  create() {
    return Decoration.none;
  },

  update(v, tr) {
    if (tr.effects.length > 0) {
      for (const e of tr.effects) {
        if (e.is(addPrompt)) {
          return Decoration.set([
            Decoration.widget({
              widget: new PromptWidget(),
              side: 0,
              block: true,
            }).range(e.value.from),
          ]);
        } else if (e.is(escapePrompt)) {
          return Decoration.none;
        }
      }
    }

    const x = v.update({
      filter: (f) => {
        const line = tr.state.doc.lineAt(tr.state.selection.main.from).text;
        if (line !== "") return false;
        return f === tr.state.selection.main.from;
      },
    });

    if (x.size > 0) return x;

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

@customElement("code-mirror-prompt")
export class PromptCodeMirrorPlugin extends CodeMirrorPlugin {
  connectedCallback() {
    super.connectedCallback();

    this.editor.updateExtension("prompt", [
      promptKeyBinding,
      promptStatePlugin,
    ]);
  }

  disconnectedCallback() {
    this.editor.removeExtension("prompt");
  }
}
