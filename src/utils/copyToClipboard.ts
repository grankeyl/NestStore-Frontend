import { showToast } from "./showToast";

export const copyToClipboard = (text: string, toastMessage: string = "Copied successfully") => {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  const selection = document.getSelection();
  if (!selection) return;
  const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected) {
    selection.removeAllRanges();
    selection.addRange(selected);
  }
  if (toastMessage) {
    showToast(toastMessage, "info");
  }
};
