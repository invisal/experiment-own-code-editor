export function getNodePosition(line: Element, node: Node, offset: number) {
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
