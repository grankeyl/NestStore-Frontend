import { FC } from "react";
import { Slide, ToastContainer } from "react-toastify";
import CloseButton from "./CloseButton";

const Toast: FC = () => {
  return (
    <ToastContainer
      toastClassName={"toast"}
      className={"toastContainer"}
      progressClassName={"toastProgress"}
      closeButton={CloseButton}
      position="bottom-center"
      limit={3} 
      stacked
      autoClose={4000}
      closeOnClick
      hideProgressBar
      newestOnTop={false}
      draggable
      icon={false}
      pauseOnHover={false}
      pauseOnFocusLoss={false}
      theme="dark"
      transition={Slide}
    />
  );
};

export default Toast;