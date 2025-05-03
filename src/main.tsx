import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { UserProfileProvider } from "@contexts/user-profile";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import Toast from "@components/Toast/index.tsx";
import { I18nextProvider } from "react-i18next";
import i18n from "@i18n";
import { StrictMode } from "react";
import checkDevice from "@utils/checkDevice.ts";

const tg = window.Telegram.WebApp as any;
const rootElement = document.getElementById("root");

tg.expand();
if (!checkDevice()) { tg.requestFullscreen(); }

createRoot(rootElement!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl="https://testnet.nestdex.dev/utils/manifest.json">
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <UserProfileProvider>
            <App />
            <Toast />
          </UserProfileProvider>
        </BrowserRouter>
      </I18nextProvider>
    </TonConnectUIProvider>
  </StrictMode>
);