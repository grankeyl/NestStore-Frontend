import "i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"; 
    resources: {
      translation: typeof en & typeof ru;
    };
  }
}