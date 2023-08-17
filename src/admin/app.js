import AuthLogo from "./extensions/authLogo.png";
import favicon from "./extensions/favicon.png";
const config = {
  auth: {
    logo: AuthLogo,
  },
  // Replace the favicon
  head: {
    favicon: favicon,
  },
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "FoodApp Admin",
      "Auth.form.welcome.subtitle": "Log in to your FoodApp Admin account",
      "Auth.form.welcome.title": "Welcome to FoodApp!",
    },
  },
  locales: [
    // 'ar',
    // 'fr',
    // 'cs',
    // 'de',
    // 'dk',
    // 'es',
    // 'he',
    // 'id',
    // 'it',
    // 'ja',
    // 'ko',
    // 'ms',
    // 'nl',
    // 'no',
    // 'pl',
    // 'pt-BR',
    // 'pt',
    // 'ru',
    // 'sk',
    // 'sv',
    // 'th',
    // 'tr',
    // 'uk',
    // 'vi',
    // 'zh-Hans',
    // 'zh',
  ],
};

const bootstrap = (app) => {};

export default {
  config,
  bootstrap,
};
