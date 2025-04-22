import { FC } from "react";
import { CloseButtonProps, TypeOptions } from "react-toastify";

const colors: Record<TypeOptions, string> = {
  success: "#38D392",
  info: "#8380FF",
  error: "#FF0000",
  warning: "#FFA500",
  default: "#CCCCCC",
};

const CloseButton: FC<CloseButtonProps> = ({ closeToast, type = "default" }) => (
  <button className="toastClose" onClick={closeToast}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.4" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill={colors[type]} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.2984 15.3586C14.5913 15.6515 15.0662 15.6515 15.3591 15.3586C15.652 15.0657 15.652 14.5908 15.3591 14.2979L13.061 11.9999L15.3591 9.70185C15.652 9.40896 15.652 8.93408 15.3591 8.64119C15.0662 8.3483 14.5913 8.34829 14.2984 8.64119L12.0004 10.9392L9.70222 8.64106C9.40933 8.34816 8.93445 8.34816 8.64156 8.64106C8.34867 8.93395 8.34867 9.40882 8.64156 9.70172L10.9397 11.9999L8.64154 14.298C8.34865 14.5909 8.34865 15.0658 8.64154 15.3587C8.93444 15.6516 9.40931 15.6516 9.70221 15.3587L12.0004 13.0605L14.2984 15.3586Z"
        fill={colors[type]}
      />
    </svg>
  </button>
);

export default CloseButton;
