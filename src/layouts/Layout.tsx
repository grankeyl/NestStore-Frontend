import { FC, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Menu from "@components/Menu";
import Header from "@components/Header";
import UseTelegram from "@hooks/useTelegram";

const Layout: FC = () => {
  const { webApp } = UseTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    const startParam = webApp.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith("order_")) navigate("/orders");
  }, []);

  return (
    <div className="container">
      <Header />
      <Outlet />
      <Menu />
    </div>
  );
};

export default Layout;
