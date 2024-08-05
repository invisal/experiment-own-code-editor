import { UniversalPlugin } from "./base";

export class UniversalBasicEdit extends UniversalPlugin {
  constructor() {
    super();
    this.onBeforeInput = this.onBeforeInput.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.editor.addEventListener("beforeinput", this.onBeforeInput);
  }

  disconnectCallback(): void {
    this.editor.removeEventListener("beforeinput", this.onBeforeInput);
  }

  onBeforeInput(e: InputEvent) {
    const editor = this.editor;

    const s = editor.getSelection();

    if (e.inputType === "insertText") {
      editor.insertText(
        s.startLineNumber,
        s.startLineColumnNumber,
        e.data ?? ""
      );
      editor.setSelection(s.startLineNumber, s.startLineColumnNumber + 1);
    } else if (e.inputType === "deleteContentBackward") {
      if (s.startLineColumnNumber > 0) {
        editor.removeText(
          s.startLineNumber,
          s.startLineColumnNumber - 1,
          s.startLineNumber,
          s.startLineColumnNumber
        );
        editor.setSelection(s.startLineNumber, s.startLineColumnNumber - 1);
      } else {
        if (s.startLineNumber > 0) {
          const line = editor.getLineContent(s.startLineNumber);
          const line2 = editor.getLineContent(s.startLineNumber - 1);
          console.log(s.startLineNumber, line, line2);
          editor.removeLine(s.startLineNumber);
          editor.insertText(s.startLineNumber - 1, line2.length, line);
          editor.setSelection(s.startLineNumber - 1, line2.length);
        }
      }
    } else if (e.inputType === "insertParagraph") {
      editor.newLine(s.startLineNumber);
      editor.setSelection(s.startLineNumber + 1, 0);
    }

    e.preventDefault();
  }
}

customElements.define("universal-basic-edit", UniversalBasicEdit);
