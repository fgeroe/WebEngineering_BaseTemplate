import { getElement } from './dom';

interface CommentEntry {
  name: string;
  text: string;
}

export function initCommentToggle(): void {
  const showHideBtn = getElement('.show-hide', HTMLButtonElement);
  const commentWrapper = getElement('.comment-wrapper', HTMLElement);

  commentWrapper.hidden = true;

  showHideBtn.addEventListener('click', () => {
    commentWrapper.hidden = !commentWrapper.hidden;
    showHideBtn.textContent = commentWrapper.hidden
      ? 'Show comments'
      : 'Hide comments';
    showHideBtn.setAttribute('aria-expanded', String(!commentWrapper.hidden));
  });
}

function createCommentElement(comment: CommentEntry): HTMLLIElement {
  const listItem = document.createElement('li');
  const namePara = document.createElement('p');
  const commentPara = document.createElement('p');

  namePara.textContent = comment.name;
  commentPara.textContent = comment.text;

  listItem.appendChild(namePara);
  listItem.appendChild(commentPara);

  return listItem;
}

export function initCommentForm(): void {
  const form = getElement('.comment-form', HTMLFormElement);
  const nameField = getElement('#name', HTMLInputElement);
  const commentField = getElement('#comment', HTMLTextAreaElement);
  const list = getElement('.comment-container', HTMLUListElement);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameValue = nameField.value.trim();
    const commentValue = commentField.value.trim();

    if (nameValue === '' || commentValue === '') return;
    list.appendChild(
      createCommentElement({ name: nameValue, text: commentValue })
    );

    nameField.value = '';
    commentField.value = '';
  });
}
