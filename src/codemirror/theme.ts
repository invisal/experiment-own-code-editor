/*
.theme.moondust {
  --border-color: indigo;
  --line-number-fg-color: #737373;
  --line-number-bg-color: #000;
  --code-fg-color: #111111;
  --code-bg-color: white;
  --active-line-bg-color: #f6f8fa;
  --caret-color: indigo;
  --keyword-fg-color: #737373;
  --keyword-weight: normal;
  --keyword-style: normal;
  --keyword-decoration: none;
  --punctuation-fg-color: indigo;
  --operator-style: normal;
  --operator-weight: normal;
  --operator-fg-color: indigo;
  --comment-opacity: 1;
  --comment-fg-color: #737373;
  --boolean-style: normal;
  --boolean-decoration: none;
  --number-fg-color: indigo;
  --number-style: normal;
  --number-decoration: none;
  --string-fg-color: #737373;
  --string-style: normal;
  --string-decoration: none;
  --variable-fg-color: #111111;
  --function-fg-color: #111111;
  --invalid-fg-color: #ff0000;
}

.theme.moondust.dark {
  --border-color: indigo;
  --line-number-fg-color: #737373;
  --line-number-bg-color: #000;
  --code-fg-color: indigo;
  --code-bg-color: #9ca3af;
  --active-line-bg-color: #f6f8fa;
  --caret-color: indigo;
  --keyword-fg-color: black;
  --keyword-weight: normal;
  --keyword-style: normal;
  --keyword-decoration: none;
  --punctuation-fg-color: indigo;
  --operator-style: normal;
  --operator-weight: normal;
  --operator-fg-color: indigo;
  --comment-opacity: 1;
  --comment-fg-color: #737373;
  --boolean-style: normal;
  --boolean-decoration: none;
  --number-fg-color: indigo;
  --number-style: normal;
  --number-decoration: none;
  --string-fg-color: #9ca3af;
  --string-style: normal;
  --string-decoration: none;
  --variable-fg-color: indigo;
  --function-fg-color: indigo;
  --invalid-fg-color: #ff0000;
}
*/

import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import {
  HighlightStyle,
  type TagStyle,
  syntaxHighlighting,
} from "@codemirror/language";

import { tags as t } from "@lezer/highlight";

interface ThemeSetting {
  theme: "dark" | "light";
  foreground?: string;
  gutterBackground?: string;
  gutterForeground?: string;
  gutterActiveForeground?: string;
  gutterBorder?: string;
  lineHighlight?: string;
  selection?: string;
  selectionMatch?: string;
}

function createCodeMirrorTheme(
  styles: TagStyle[],
  settings: ThemeSetting
): Extension {
  const highlightStyle = HighlightStyle.define(styles);

  const themeStyles: Record<string, Record<string, string>> = {
    "&": {},
    ".cm-gutters": {
      paddingRight: "10px",
      paddingLeft: "5px",
    },
    ".cm-activeLineGutter": {},
    ".cm-activeLine": {},
    "&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection":
      {},
  };

  if (settings.foreground) {
    themeStyles["&"].color = settings.foreground;
  }

  if (settings.lineHighlight) {
    themeStyles[".cm-activeLine"].background = settings.lineHighlight;
  }

  if (settings.selection) {
    themeStyles[
      "&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection"
    ] = {
      background: settings.selection + " !important",
    };
  }
  if (settings.selectionMatch) {
    themeStyles["& .cm-selectionMatch"] = {
      backgroundColor: settings.selectionMatch,
    };
  }

  if (settings.gutterBackground) {
    themeStyles[".cm-gutters"].backgroundColor = settings.gutterBackground;
  }

  if (settings.gutterForeground) {
    themeStyles[".cm-gutters"].color = settings.gutterForeground;
  }

  if (settings.gutterBorder) {
    themeStyles[".cm-gutters"].borderRightColor = settings.gutterBorder;
  }

  if (settings.gutterActiveForeground) {
    themeStyles[".cm-activeLineGutter"].color = settings.gutterActiveForeground;
  }

  const themeExtension = EditorView.theme(themeStyles, {
    dark: settings.theme === "dark",
  });

  return [themeExtension, syntaxHighlighting(highlightStyle)];
}

export function getPredefineTheme(color: "dark" | "light", themeName: string) {
  if (themeName === "invasion") return createInvasionTheme(color);
  return createMoondustTheme(color);
}

function createMoondustTheme(theme: "dark" | "light"): Extension {
  if (theme === "light") {
    return createCodeMirrorTheme(
      [
        { tag: t.keyword, color: "#737373" },
        {
          tag: [t.name, t.deleted, t.character, t.macroName],
          color: "#111111",
        },
        { tag: [t.propertyName], color: "#737373" },
        {
          tag: [t.string, t.special(t.string)],
          color: "#737373",
        },
        { tag: [t.function(t.variableName), t.labelName], color: "#737373" },
        { tag: [t.className], color: "#737373" },
        {
          tag: [
            t.number,
            t.changed,
            t.annotation,
            t.modifier,
            t.self,
            t.namespace,
          ],
          color: "indigo",
        },
        { tag: [t.typeName], color: "#111111" },
        { tag: [t.operator, t.operatorKeyword], color: "24292e" },
        { tag: [t.meta, t.comment], color: "#737373" },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#111111" },
      ],
      {
        theme,
        foreground: "#111111",
        selection: "#ccc",
        lineHighlight: "#eee",
        gutterForeground: "#737373",
        gutterBackground: "inherit",
        gutterActiveForeground: "#000",
        gutterBorder: "transparent",
      }
    );
  } else {
    return createCodeMirrorTheme(
      [
        { tag: t.keyword, color: "#737373" },
        {
          tag: [t.name, t.deleted, t.character, t.macroName],
          color: "white",
        },
        { tag: [t.propertyName], color: "white" },
        {
          tag: [t.string, t.special(t.string)],
          color: "#737373",
        },
        { tag: [t.function(t.variableName), t.labelName], color: "#737373" },
        { tag: [t.className], color: "#737373" },
        {
          tag: [
            t.number,
            t.changed,
            t.annotation,
            t.modifier,
            t.self,
            t.namespace,
          ],
          color: "white",
        },
        { tag: [t.typeName], color: "white" },
        { tag: [t.operator, t.operatorKeyword], color: "white" },
        { tag: [t.meta, t.comment], color: "#737373" },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#111111" },
      ],
      {
        theme,
        foreground: "#fff",
        selection: "#333",
        lineHighlight: "#151515",
        gutterForeground: "#737373",
        gutterBackground: "inherit",
        gutterActiveForeground: "#fff",
        gutterBorder: "transparent",
      }
    );
  }
}

function createInvasionTheme(theme: "dark" | "light"): Extension {
  if (theme === "light") {
    return createCodeMirrorTheme(
      [
        { tag: [t.keyword, t.typeName, t.standard(t.name)], color: "#7f00ff" },
        { tag: [t.string], color: "#228b22" },
        { tag: [t.className], color: "#737373" },
        {
          tag: [t.number],
          color: "#0000ff",
        },
        { tag: [t.operator, t.operatorKeyword], color: "#24292e" },
        { tag: [t.lineComment, t.blockComment, t.comment], color: "#a3a3a3" },
        { tag: [t.null, t.bool], color: "#7f00ff" },
      ],
      {
        theme,
        foreground: "#000000",
        selection: "#ccc",
        lineHighlight: "#eee",
        gutterForeground: "#737373",
        gutterBackground: "inherit",
        gutterActiveForeground: "#000",
        gutterBorder: "transparent",
      }
    );
  } else {
    return createCodeMirrorTheme(
      [
        { tag: t.keyword, color: "#737373" },
        {
          tag: [t.name, t.deleted, t.character, t.macroName],
          color: "white",
        },
        { tag: [t.propertyName], color: "white" },
        {
          tag: [t.string, t.special(t.string)],
          color: "#737373",
        },
        { tag: [t.function(t.variableName), t.labelName], color: "#737373" },
        { tag: [t.className], color: "#737373" },
        {
          tag: [
            t.number,
            t.changed,
            t.annotation,
            t.modifier,
            t.self,
            t.namespace,
          ],
          color: "white",
        },
        { tag: [t.typeName], color: "white" },
        { tag: [t.operator, t.operatorKeyword], color: "white" },
        { tag: [t.meta, t.comment], color: "#737373" },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#111111" },
      ],
      {
        theme,
        foreground: "#fff",
        selection: "#333",
        lineHighlight: "#151515",
        gutterForeground: "#737373",
        gutterBackground: "inherit",
        gutterActiveForeground: "#fff",
        gutterBorder: "transparent",
      }
    );
  }
}
