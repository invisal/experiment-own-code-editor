import { UniversalPlugin } from "./base";

function createHintElement(hint: string) {
  const hintElement = document.createElement("i");
  hintElement.innerText = hint;
  hintElement.style.color = "blue";
  hintElement.contentEditable = "false";
  hintElement.style.userSelect = "none";
  hintElement.style.display = "inline";
  return hintElement;
}

export class UniversalPlainTextPlugin extends UniversalPlugin {
  hint: string = "";

  static observedAttributes = ["hint"];

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (name === "hint") {
      this.hint = newValue;
      this.editor.buildLines();
      this.editor.reselect();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.editor.addEventListener("selectchange", () => {
      console.log("select change");
      if (this.hint) {
        this.editor.buildLines();
        this.editor.reselect();
      }
    });

    this.editor.renderer((text: string, line: number) => {
      const s = this.editor.getSelection();
      let dom: any[] = [];

      if (
        this.hint &&
        line === s.startLineNumber &&
        s.startLineNumber === s.endLineNumber &&
        s.startLineColumnNumber === s.endColumnNumber
      ) {
        dom = [
          document.createTextNode(text.substring(0, s.startLineColumnNumber)),
          createHintElement(this.hint),
          document.createTextNode(text.substring(s.startLineColumnNumber)),
        ];
      } else {
        dom = [
          text === ""
            ? document.createElement("br")
            : document.createTextNode(text),
        ];
      }

      if (text.indexOf("sex") >= 0) {
        const warning = document.createElement("div");
        warning.contentEditable = "false";
        warning.style.userSelect = "none";
        warning.innerHTML =
          "<div style='border:1px; padding: 5px; font-size:10px; color:white; background: red; border-radius: 4px; margin: 2px;'>This line contains bad word</div>";
        dom.push(warning);
      }

      return dom;
    });
  }
}

customElements.define("universal-plain-text", UniversalPlainTextPlugin);
