const HIGHLIGHT_CLASS = 'highlight';
const EXCLUDED_TAGS = ['SCRIPT', 'STYLE', 'FORM', 'BUTTON'];

export function clearHighlights(): void {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    if (parent === null) return;

    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

export function highlightMatches(node: Node, searchKey: string): void {
  if (node instanceof Text) {
    const index = node.data.toLowerCase().indexOf(searchKey.toLowerCase());
    if (index === -1) return;

    const matchNode = node.splitText(index);
    const rest = matchNode.splitText(searchKey.length);

    const mark = document.createElement('mark');
    mark.className = HIGHLIGHT_CLASS;
    mark.textContent = matchNode.data;
    matchNode.replaceWith(mark);

    highlightMatches(rest, searchKey);
  } else if (node instanceof Element && !EXCLUDED_TAGS.includes(node.tagName)) {
    Array.from(node.childNodes).forEach((child) => {
      highlightMatches(child, searchKey);
    });
  }
}
