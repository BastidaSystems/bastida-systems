const siteLanguageStorageKey = 'site-language';

const sharedSiteTranslations = {
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.solutions': 'Solutions',
    'nav.industries': 'Industries',
    'nav.games': 'Games',
    'nav.websites': 'Websites',
    'nav.systems': 'Systems',
    'nav.about': 'About',
    'nav.aboutUs': 'About Us',
    'nav.portal': 'Client Portal',
    'nav.login': 'Login',
    'nav.contact': 'Contact',
    'nav.privacy': 'Privacy',
    'nav.language': 'Language',
    'nav.languageSelector': 'Language selector',
    'footer.rights': '© 2026 Bastida Systems. All rights reserved.'
  },
  es: {
    'nav.home': 'Inicio',
    'nav.products': 'Productos',
    'nav.solutions': 'Soluciones',
    'nav.industries': 'Industrias',
    'nav.games': 'Games',
    'nav.websites': 'Sitios Web',
    'nav.systems': 'Sistemas',
    'nav.about': 'Acerca de',
    'nav.aboutUs': 'About Us',
    'nav.portal': 'Portal de Clientes',
    'nav.login': 'Login',
    'nav.contact': 'Contacto',
    'nav.privacy': 'Privacidad',
    'nav.language': 'Idioma',
    'nav.languageSelector': 'Selector de idioma',
    'footer.rights': '© 2026 Bastida Systems. Todos los derechos reservados.'
  }
};

const getSiteTranslations = language => ({
  ...sharedSiteTranslations[language],
  ...((window.pageTranslations && window.pageTranslations[language]) || {})
});

let activeSiteLanguage = localStorage.getItem(siteLanguageStorageKey) || (navigator.language.startsWith('es') ? 'es' : 'en');

if (!sharedSiteTranslations[activeSiteLanguage]) {
  activeSiteLanguage = 'en';
}

const siteTranslate = key => (
  getSiteTranslations(activeSiteLanguage)[key] ||
  getSiteTranslations('en')[key] ||
  ''
);

const applySiteLanguage = language => {
  activeSiteLanguage = sharedSiteTranslations[language] ? language : 'en';
  document.documentElement.lang = activeSiteLanguage;
  localStorage.setItem(siteLanguageStorageKey, activeSiteLanguage);

  const title = siteTranslate('meta.title');
  if (title) {
    document.title = title;
  }

  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = siteTranslate(element.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    element.innerHTML = siteTranslate(element.dataset.i18nHtml);
  });

  document.querySelectorAll('[data-i18n-alt]').forEach(element => {
    element.setAttribute('alt', siteTranslate(element.dataset.i18nAlt));
  });

  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    element.setAttribute('aria-label', siteTranslate(element.dataset.i18nAriaLabel));
  });

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.value = activeSiteLanguage;
  }
};

const bindSiteLanguagePicker = () => {
  const languageSelect = document.getElementById('language-select');
  if (!languageSelect) return false;

  if (!languageSelect.dataset.languageBound) {
    languageSelect.addEventListener('change', event => {
      applySiteLanguage(event.target.value);
    });
    languageSelect.dataset.languageBound = 'true';
  }

  languageSelect.value = activeSiteLanguage;
  return true;
};

const setupSiteLanguage = () => {
  applySiteLanguage(activeSiteLanguage);

  if (bindSiteLanguagePicker()) return;

  const observer = new MutationObserver(() => {
    applySiteLanguage(activeSiteLanguage);
    if (bindSiteLanguagePicker()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSiteLanguage);
} else {
  setupSiteLanguage();
}
