import { getElement } from './dom';

function clearHighlights(): void {
  document.querySelectorAll('.highlight').forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent === null) return;

    parent.replaceChild(
      document.createTextNode(highlight.textContent),
      highlight
    );
    parent.normalize();
  });
}

function highlight(node: Node, searchKey: string): void {
  if (node instanceof Text) {
    const index = node.data.toLowerCase().indexOf(searchKey.toLowerCase());
    if (index === -1) return;

    const matchNode = node.splitText(index);
    const rest = matchNode.splitText(searchKey.length);

    const mark = document.createElement('mark');
    mark.className = 'highlight';
    mark.textContent = matchNode.data;
    matchNode.replaceWith(mark);

    highlight(rest, searchKey);
  } else if (
    node instanceof Element &&
    node.tagName !== 'SCRIPT' &&
    node.tagName !== 'STYLE' &&
    node.tagName !== 'FORM'
  ) {
    Array.from(node.childNodes).forEach((child) => {
      highlight(child, searchKey);
    });
  }
}

export function initSearch(): void {
  const form = getElement('.search', HTMLFormElement);
  const searchInput = getElement('#q', HTMLInputElement);
  const mainElement = getElement('main', HTMLElement);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    clearHighlights();

    const searchKey = searchInput.value.trim();
    if (searchKey === '') return;

    highlight(mainElement, searchKey);
  });
}
