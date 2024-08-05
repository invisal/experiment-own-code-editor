type LineRenderCallback = (
  line: string,
  lineNumber: number
) => (Element | Text)[] | string;

export class UniversalEditor extends HTMLElement {
  protected editor: HTMLPreElement;
  protected gutter: HTMLPreElement;
  protected lines: string[] = [];

  protected _selectStartLineNumber = 0;
  protected _selectStartColumnNumber = 0;
  protected _selectEndLineNumber = 0;
  protected _selectEndColumnNumber = 0;

  protected _blockSendSelectionChange = false;

  protected lineRender?: LineRenderCallback;

  static observedAttributes = ["value", "renderer", "wrap"];

  attributeChangedCallback(name: string, _: string, newValue: string) {
    if (name === "value") this.value = newValue;
    else if (name === "wrap") {
      if (typeof newValue === "string") this.editor.classList.add("wrap");
      else {
        this.editor.classList.remove("wrap");
      }
      this.buildLines();
    }
  }

  set value(value: string) {
    this.lines = value.split("\n");
    this.buildLines();
  }

  get value() {
    return this.lines.join("\n");
  }

  renderer(value: LineRenderCallback) {
    this.lineRender = value;
    this.buildLines();
  }

  getSelection() {
    return {
      startLineNumber: this._selectStartLineNumber,
      startLineColumnNumber: this._selectStartColumnNumber,
      endLineNumber: this._selectEndLineNumber,
      endColumnNumber: this._selectEndColumnNumber,
    };
  }

  buildLines() {
    const previousNodeList = this.editor.childNodes;

    // Attempt to replace existing line first
    for (let i = 0; i < previousNodeList.length; i++) {
      const currentNode = previousNodeList[i] as HTMLDivElement;

      if (i >= this.lines.length) {
        currentNode.remove();
      } else {
        let lineContent: (Element | Text)[] | string = this.lines[i];
        if (this.lineRender) {
          lineContent = this.lineRender(this.lines[i], i);
        }

        if (typeof lineContent === "string") {
          if (lineContent === "") {
            currentNode.innerHTML = "<br />";
          } else {
            currentNode.innerText = lineContent;
          }
        } else {
          currentNode.replaceChildren(...lineContent);
        }
      }
    }

    // Add remaining lines
    for (let i = previousNodeList.length; i < this.lines.length; i++) {
      let lineContent: (Element | Text)[] | string = this.lines[i];
      if (this.lineRender) {
        lineContent = this.lineRender(this.lines[i], i);
      }

      const newLineNode = document.createElement("div");
      newLineNode.className = "line";

      if (typeof lineContent === "string") {
        if (lineContent === "") {
          newLineNode.innerHTML = "<br />";
        } else {
          newLineNode.innerText = lineContent;
        }
      } else {
        newLineNode.append(...lineContent);
      }

      this.editor.append(newLineNode);
    }

    // Rebuild gutter line
    this.gutter.innerHTML = "";
    let lineCount = 1;
    for (const lineElement of this.editor.children) {
      const gutterLine = document.createElement("div");
      gutterLine.innerText = lineCount.toString();
      gutterLine.style.height =
        lineElement.getBoundingClientRect().height + "px";
      this.gutter.append(gutterLine);
      lineCount++;
    }
  }

  constructor() {
    super();

    const css = `
      .container {
        display: flex;
        width: 500px;
        height: 200px;
        background: #eee;
      }

      .gutter {
        flex-grow: 0;
        flex-shrink: 0;
        position: relative;
        width: 20px;
        background: #ccc;
        overflow: hidden;
      }

      .gutter-content {
        padding: 0;
        padding-right: 5px;
        text-align: right;
        margin: 0;
        width: 15px;
        position: absolute;
      }

      .editor.wrap {
        word-wrap: break-word;
        white-space: pre-wrap;
        overflow-x: hidden;
        overflow-y: auto;
      }

      .editor {
        padding: 0;
        margin: 0;
        flex-grow: 1;
        outline: 0;
        overflow-x: auto;
        overflow-y: auto;
      }    
    `;

    this.handleSelectionChange = this.handleSelectionChange.bind(this);

    const style = document.createElement("style");
    style.innerHTML = css;

    const editor = document.createElement("pre");
    editor.className = "editor";
    editor.contentEditable = "true";
    editor.spellcheck = false;

    editor.addEventListener("beforeinput", (e) => {
      e.preventDefault();
    });

    const container = document.createElement("div");
    container.className = "container";

    const gutterContainer = document.createElement("div");
    gutterContainer.className = "gutter";

    const gutterContent = document.createElement("pre");
    gutterContent.className = "gutter-content";
    gutterContainer.append(gutterContent);

    this.gutter = gutterContent;

    container.append(gutterContainer);
    container.append(editor);

    this.attachShadow({ mode: "open" });
    this.shadowRoot?.append(style);
    this.shadowRoot?.append(container);

    editor.addEventListener("scroll", () => {
      gutterContent.style.top = -editor.scrollTop + "px";
    });

    this.editor = editor;
  }

  connectedCallback(): void {
    document.addEventListener("selectionchange", this.handleSelectionChange);
  }

  disconnectedCallback(): void {
    document.removeEventListener("selectionchange", this.handleSelectionChange);
  }

  getParentLineNode(childNode: Node) {
    let ptr = childNode as HTMLElement;

    while (ptr) {
      if (ptr.className === "line") return ptr;
      if (ptr.parentNode === this.editor) return null;
      ptr = ptr.parentNode as HTMLElement;
    }

    return null;
  }

  getLineNumberFromLineNode(lineNode: Element | null) {
    if (!lineNode) return 0;

    let prev = lineNode;
    let count = 0;

    while (prev.previousElementSibling) {
      count++;
      prev = prev.previousElementSibling;
    }

    return count;
  }

  getColumnNumberFromNode(line: Element, node: Node, offset: number) {
    let pos = 0;

    for (const child of line.childNodes) {
      // We skip all the child except <span> and text node
      if (child.nodeType !== Node.TEXT_NODE && child.nodeName !== "SPAN")
        continue;

      if (child === node) return pos + offset;
      if (child.contains(node)) return pos + offset;

      if (child.nodeType === Node.TEXT_NODE)
        pos += (child.nodeValue ?? "").length;
      else {
        pos += (child.textContent ?? "").length;
      }
    }

    return 0;
  }

  handleSelectionChange() {
    const previousStartLine = this._selectStartLineNumber;
    const previousStartColumn = this._selectStartColumnNumber;
    const previousEndLine = this._selectEndLineNumber;
    const previousEndColumn = this._selectEndColumnNumber;

    if (this.shadowRoot) {
      const selection = (this.shadowRoot as any).getSelection() as Selection;

      if (selection && selection.anchorNode && selection.focusNode) {
        const lineElement = this.getParentLineNode(selection.anchorNode);
        if (lineElement) {
          this._selectStartLineNumber =
            this.getLineNumberFromLineNode(lineElement);
          this._selectStartColumnNumber = this.getColumnNumberFromNode(
            lineElement,
            selection.anchorNode,
            selection.anchorOffset
          );
        }

        const lineElement2 = this.getParentLineNode(selection.anchorNode);
        if (lineElement2) {
          this._selectEndColumnNumber = this.getColumnNumberFromNode(
            lineElement2,
            selection.focusNode,
            selection.focusOffset
          );

          this._selectEndLineNumber =
            this.getLineNumberFromLineNode(lineElement2);
        }

        if (
          previousStartColumn !== this._selectStartColumnNumber ||
          previousStartLine !== this._selectStartLineNumber ||
          previousEndLine !== this._selectEndLineNumber ||
          previousEndColumn !== this._selectEndColumnNumber
        ) {
          this.dispatchEvent(
            new CustomEvent("selectchange", { bubbles: false })
          );
        }
      }
    }
  }

  reselect() {
    this.setSelection(
      this._selectStartLineNumber,
      this._selectStartColumnNumber,
      this._selectEndLineNumber,
      this._selectEndColumnNumber
    );
  }

  getLineContent(lineNumber: number) {
    return this.lines[lineNumber];
  }

  removeText(y1: number, x1: number, y2: number, x2: number) {
    if (y1 === y2) {
      // remove from the same line
      const lineContent = this.lines[y1];
      this.lines[y1] = lineContent.substring(0, x1) + lineContent.substring(x2);
      this.buildLines();
    }
  }

  removeLine(y1: number) {
    this.lines.splice(y1, 1);
    this.buildLines();
  }

  newLine(y: number) {
    this.lines.splice(y + 1, 0, "");
    console.log(this.lines);
    this.buildLines();
  }

  insertText(y1: number, x1: number, text: string) {
    const lineValue = this.lines[y1];
    const left = lineValue.substring(0, x1);
    const right = lineValue.substring(x1);
    const newLineValue = left + text + (right ?? "");
    this.lines[y1] = newLineValue;

    this.buildLines();
  }

  handleLineRendering(cb: LineRenderCallback) {
    this.lineRender = cb;
  }

  getNodeFromColumnNumber(
    nodes: NodeListOf<ChildNode>,
    col: number
  ): [Node | null, number] {
    let offset = col;

    for (let c of nodes) {
      if (c.nodeType !== Node.TEXT_NODE && c.nodeName !== "SPAN") continue;
      if (c.nodeType !== Node.TEXT_NODE) c = c.childNodes[0];
      const n = (c.nodeValue ?? "").length;
      if (offset > n) offset -= n;
      else return [c, offset];
    }

    return [null, 0];
  }

  setSelection(line: number, col: number, endLine?: number, endCol?: number) {
    const lineElement = this.editor.querySelectorAll(".line")[line];
    if (lineElement) {
      const [node, offset] = this.getNodeFromColumnNumber(
        lineElement.childNodes,
        col
      );
      if (node) {
        const range = new Range();
        range.setStart(node, offset);

        if (
          endLine !== undefined &&
          endCol !== undefined &&
          (endLine !== line || col !== endCol)
        ) {
          const endLineElement = this.editor.querySelectorAll(".line")[endLine];
          const [endNode, endOffset] = this.getNodeFromColumnNumber(
            endLineElement.childNodes,
            endCol
          );

          if (endNode) {
            range.setEnd(endNode, endOffset);
          }
        }

        document.getSelection()?.removeAllRanges();
        document.getSelection()?.addRange(range);

        const rangeBound = range.getBoundingClientRect();
        const editorBound = range.getBoundingClientRect();
        if (this.editor.scrollLeft + editorBound.width < rangeBound.x) {
          this.editor.scrollLeft = rangeBound.x - editorBound.width;
        }
      } else {
        const range = new Range();
        range.setStart(lineElement.childNodes[0], 0);
        document.getSelection()?.removeAllRanges();
        document.getSelection()?.addRange(range);
      }
    }
  }
}

customElements.define("universal-editor", UniversalEditor);

declare global {
  interface HTMLElementTagNameMap {
    "universal-editor": UniversalEditor;
  }
}
