import { CompletionContext } from "@codemirror/autocomplete";
import { SQLite } from "@codemirror/lang-sql";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
} from "@codemirror/view";
import { customElement } from "lit/decorators.js";

import { CodeMirrorPlugin } from "./base-plugin";

const handlebarMark = Decoration.mark({ class: "cm-handlebar" });

function decorateHandlebar(view: EditorView) {
  const decorationList: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);

    for (const match of text.matchAll(
      /(\{\{[\w\d-_]+\}\})|(\[\[[\w\d-_]+\]\])/g
    )) {
      decorationList.push(
        handlebarMark.range(
          from + match.index,
          from + match.index + match[0].length
        )
      );
    }
  }

  return Decoration.set(decorationList);
}

@customElement("code-mirror-handlebar")
export class CodeMirrorHandlebarPlugin extends CodeMirrorPlugin {
  connectedCallback() {
    super.connectedCallback();

    const markHandlebarPlugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = decorateHandlebar(view);
        }
        update(update: ViewUpdate) {
          this.decorations = decorateHandlebar(update.view);
        }
      },
      { decorations: (v) => v.decorations }
    );

    const markHandlebarTheme = EditorView.baseTheme({
      ".cm-handlebar": {
        backgroundColor: "#7ed6df",
        padding: "1px",
        border: "1px solid #22a6b3",
      },
    });

    function handlebarCompletion(context: CompletionContext) {
      const node = syntaxTree(context.state).resolveInner(context.pos);

      let ptr = node.parent;
      if (ptr?.type.name !== "Braces") return null;

      return {
        from: node.from + 1,
        options: [
          { label: "variable1", type: "keyword" },
          { label: "variable2", type: "keyword" },
        ],
      };
    }

    this.editor.updateExtension("handlebars", [
      markHandlebarPlugin,
      markHandlebarTheme,
      SQLite.language.data.of({ autocomplete: handlebarCompletion }),
    ]);
  }
}
