export function initCommentToggle() {
  const showHideBtn = document.querySelector(".show-hide");
  const commentWrapper = document.querySelector(".comment-wrapper");

  commentWrapper.hidden = true;

  showHideBtn.addEventListener("click", () => {
    commentWrapper.hidden = !commentWrapper.hidden;
    showHideBtn.textContent = commentWrapper.hidden
      ? "Show comments"
      : "Hide comments";
    showHideBtn.setAttribute("aria-expanded", String(!commentWrapper.hidden));
  });
}

export function initCommentForm() {
  const form = document.querySelector(".comment-form");
  const nameField = document.querySelector("#name");
  const commentField = document.querySelector("#comment");
  const list = document.querySelector(".comment-container");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameValue = nameField.value.trim();
    const commentValue = commentField.value.trim();

    if (!nameValue || !commentValue) return;

    const listItem = document.createElement("li");
    const namePara = document.createElement("p");
    const commentPara = document.createElement("p");

    namePara.textContent = nameValue;
    commentPara.textContent = commentValue;

    listItem.appendChild(namePara);
    listItem.appendChild(commentPara);
    list.appendChild(listItem);

    nameField.value = "";
    commentField.value = "";
  });
}
