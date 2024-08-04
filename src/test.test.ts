import { getNodePosition } from "./help";

it("test", () => {
  const lineElement = document.createElement("div");
  lineElement.className = "line someother-class";

  lineElement.innerHTML = `Hello <span id='target'>World</span> v2.0`;
  const textTarget = lineElement.querySelector("#target")
    ?.childNodes[0] as Node;
  const textOffset = 2;

  expect(getNodePosition(lineElement, textTarget, textOffset)).toBe(8);
});
