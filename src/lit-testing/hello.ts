import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { createRef, ref, Ref } from "lit/directives/ref.js";

@customElement("testing-lit")
export class Testing extends LitElement {
  containerRef: Ref<HTMLInputElement> = createRef();

  connectedCallback(): void {
    console.log("connected", this.containerRef.value);
  }

  firstUpdated() {
    console.log("first update", this.containerRef.value);
  }

  render() {
    console.log("render");
    return html`<div ${ref(this.containerRef)}></div>`;
  }
}
