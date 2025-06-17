import { createI18n } from "vue-i18n";

import trTR from "@/core/config/i18n/tr-TR.json";
import enUS from "@/core/config/i18n/en-US.json";

const messages = { "en-US": enUS as any, "tr-TR": trTR as any };
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("language") as any,
  globalInjection: true,
  messages,
});

export default i18n;