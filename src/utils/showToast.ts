import { toast } from "react-toastify";

export const showToast = (text: string, type: "success" | "error" | "info" | "warning") => {
  toast(text, {
    type,
    className: `toast toast${type[0].toUpperCase() + type.slice(1)}`, 
  });
};
