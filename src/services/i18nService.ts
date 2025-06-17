// import {createApp, type App  } from "vue";
// import axios from "axios";
// import VueAxios from "vue-axios";
// import JwtService from "@/services/JwtService";

// export default class i18nService {
 
//   public static init(app: App<Element>) {
//     localStorage.setItem("language", app.config.globalProperties.$runtimeConfigs.lang)
      
//   }
// //   setActiveLanguage(lang:any) {
// //     localStorage.setItem("language", lang);
// //     document.documentElement.setAttribute("lang", lang);
// //   }
// }
const i18nService = {
  defaultLanguage: "tr-TR",
  languages: [
    {
      lang: "en-US",
      name: "English",
    },
    {
      lang: "tr-TR",
      name: "Turkish",
    },
  ],

  /**
   * Keep the active language in the localStorage
   * @param lang
   */
  setActiveLanguage(lang:any) {
    localStorage.setItem("language", lang);
    document.documentElement.setAttribute("lang", lang);
  },

  /**
   * Get the current active language
   * @returns {string | string}
   */
  getActiveLanguage() {
    return localStorage.getItem("language") || this.defaultLanguage;
  },
};

export default i18nService;