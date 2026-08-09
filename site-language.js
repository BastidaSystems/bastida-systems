const siteLanguageStorageKey = 'site-language';

const sharedSiteTranslations = {
  en: {
    'nav.home': 'Home',
    'nav.store': 'Store',
    'nav.openMenu': 'Open navigation menu',
    'nav.websitesDescription': 'Websites and digital experiences for real businesses.',
    'nav.systemsDescription': 'Custom platforms, automation, and business technology.',
    'nav.industriesDescription': 'Technology shaped around real operational needs.',
    'nav.filtracoreDescription': 'Smart water monitoring hardware and software.',
    'nav.beoflowDescription': 'Event and business workflow platform.',
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
    'nav.freeQuote': 'Free Quote',
    'nav.getStarted': 'Get Started',
    'nav.privacy': 'Privacy',
    'nav.language': 'Language',
    'nav.languageSelector': 'Language selector',
    'footer.rights': '© 2026 Bastida Systems. All rights reserved.',
    'home.hero.label': 'BASTIDA SYSTEMS',
    'home.hero.ariaTitle': 'The Leading Technology Company in Las Vegas, Nevada.',
    'home.hero.titleLine1': 'The Leading',
    'home.hero.titleLine2': 'Technology Company',
    'home.hero.titleLine3': 'in',
    'home.hero.titleHighlight': 'Las Vegas, Nevada.',
    'home.hero.subheadline': 'Technology You Can Trust.',
    'home.founderPortfolio.ariaLabel': 'Open David Bastida personal portfolio',
    'home.founderPortfolio.label': 'David Bastida personal portfolio',
    'home.rodrigoPortfolio.ariaLabel': 'Open Rodrigo Bastida personal portfolio',
    'home.rodrigoPortfolio.label': 'Rodrigo Bastida personal portfolio',
    'home.websites.label': 'SELECTED WORK',
    'home.websites.titleLine1': 'Selected Technology',
    'home.websites.titleLine2': 'Work.',
    'home.websites.copy': 'Websites, platforms, and digital systems created to make businesses clearer, more reliable, and easier to operate.',
    'home.websites.meta': 'Websites · Applications · Business Systems',
    'home.project.viewWebsite': 'View Website',
    'home.cleanSweep.category': 'Street Sweeping Information Platform',
    'home.cleanSweep.name': 'Clean Sweep',
    'home.cleanSweep.location': 'Los Angeles County, California',
    'home.cleanSweep.headline': 'A Clearer Way to Navigate Street Sweeping.',
    'home.cleanSweep.description': 'A practical digital platform designed to help Los Angeles County residents find street-sweeping information and avoid unnecessary parking citations.',
    'home.cleanSweep.linkAria': 'View Clean Sweep website in a new tab',
    'home.cleanSweep.visualAria': 'Clean Sweep project screenshot',
    'home.cleanSweep.imageAlt': 'Clean Sweep website homepage screenshot',
    'home.cocofilms.category': 'Creative Portfolio Website',
    'home.cocofilms.name': 'CocoFilms',
    'home.cocofilms.headline': 'A Cinematic Home for Visual Storytelling.',
    'home.cocofilms.description': 'A refined photography and film production website shaped around weddings, events, fashion, music videos, and commercial visuals.',
    'home.cocofilms.linkAria': 'View CocoFilms website in a new tab',
    'home.cocofilms.visualAria': 'CocoFilms project screenshot',
    'home.cocofilms.imageAlt': 'CocoFilms website homepage screenshot',
    'home.davidBastida.category': 'Personal Portfolio Website',
    'home.davidBastida.name': 'David Bastida',
    'home.davidBastida.headline': 'One Identity Across Creative and Founder Work.',
    'home.davidBastida.description': 'A dual-path portfolio presenting cinematics, 3D art, UI/UX, mobile apps, SaaS products, and business systems with a clear personal brand.',
    'home.davidBastida.linkAria': 'View David Bastida website in a new tab',
    'home.davidBastida.visualAria': 'David Bastida project screenshot',
    'home.davidBastida.imageAlt': 'David Bastida portfolio website homepage screenshot',
    'home.loyalRoofing.category': 'Construction Business Website',
    'home.loyalRoofing.name': 'The Loyal Roofing Company',
    'home.loyalRoofing.headline': 'Trust-Building Design for a Local Service Business.',
    'home.loyalRoofing.description': 'A roofing and siding website built to present services, credibility, project galleries, and direct quote paths with confidence.',
    'home.loyalRoofing.linkAria': 'View The Loyal Roofing Company website in a new tab',
    'home.loyalRoofing.visualAria': 'The Loyal Roofing Company project screenshot',
    'home.loyalRoofing.imageAlt': 'The Loyal Roofing Company website homepage screenshot',
    'home.caterVegas.category': 'Interactive Event Platform',
    'home.caterVegas.name': 'Cater Vegas',
    'home.caterVegas.headline': 'A Guided Event Planning Experience.',
    'home.caterVegas.description': 'An interactive hospitality platform where customers begin with a date and move through setup, menu, lodging, review, and payment.',
    'home.caterVegas.linkAria': 'View Cater Vegas website in a new tab',
    'home.caterVegas.visualAria': 'Cater Vegas project screenshot',
    'home.caterVegas.imageAlt': 'Cater Vegas event planning calendar screenshot',
    'home.progress.label': 'Homepage panel navigation',
    'home.progress.home': 'Home',
    'home.progress.websites': 'Selected Work',
    'home.progress.cleanSweep': 'Clean Sweep',
    'home.progress.cocofilms': 'CocoFilms',
    'home.progress.davidBastida': 'David Bastida',
    'home.progress.loyalRoofing': 'The Loyal Roofing Company',
    'home.progress.caterVegas': 'Cater Vegas',
    'home.progress.whatsNext': "What's Next",
    'home.next.title': "What's Next?",
    'home.next.ariaLabel': 'Open FiltraCore App Store page in a new tab',
    'home.progress.footer': 'Footer',
    'home.footer.ariaLabel': 'Footer'
  },
  es: {
    'nav.home': 'Inicio',
    'nav.store': 'Tienda',
    'nav.openMenu': 'Abrir menu de navegacion',
    'nav.websitesDescription': 'Sitios web y experiencias digitales para negocios reales.',
    'nav.systemsDescription': 'Plataformas, automatización y tecnología empresarial.',
    'nav.industriesDescription': 'Tecnología adaptada a necesidades operativas reales.',
    'nav.filtracoreDescription': 'Hardware y software inteligente para monitoreo de agua.',
    'nav.beoflowDescription': 'Plataforma de flujos de trabajo para eventos y negocios.',
    'nav.solutions': 'Soluciones',
    'nav.industries': 'Industrias',
    'nav.games': 'Games',
    'nav.websites': 'Sitios Web',
    'nav.systems': 'Sistemas',
    'nav.about': 'Acerca de',
    'nav.aboutUs': 'Sobre nosotros',
    'nav.portal': 'Portal de Clientes',
    'nav.login': 'Login',
    'nav.contact': 'Contacto',
    'nav.freeQuote': 'Cotizacion gratis',
    'nav.getStarted': 'Empezar',
    'nav.privacy': 'Privacidad',
    'nav.language': 'Idioma',
    'nav.languageSelector': 'Selector de idioma',
    'footer.rights': '© 2026 Bastida Systems. Todos los derechos reservados.',
    'home.hero.label': 'BASTIDA SYSTEMS',
    'home.hero.ariaTitle': 'La empresa lider de tecnologia en Las Vegas, Nevada.',
    'home.hero.titleLine1': 'La empresa lider',
    'home.hero.titleLine2': 'de tecnologia',
    'home.hero.titleLine3': 'en',
    'home.hero.titleHighlight': 'Las Vegas, Nevada.',
    'home.hero.subheadline': 'Tecnologia en la que puedes confiar.',
    'home.founderPortfolio.ariaLabel': 'Abrir el portafolio personal de David Bastida',
    'home.founderPortfolio.label': 'Portafolio personal de David Bastida',
    'home.rodrigoPortfolio.ariaLabel': 'Abrir el portafolio personal de Rodrigo Bastida',
    'home.rodrigoPortfolio.label': 'Portafolio personal de Rodrigo Bastida',
    'home.websites.label': 'TRABAJO SELECCIONADO',
    'home.websites.titleLine1': 'Trabajo tecnologico',
    'home.websites.titleLine2': 'seleccionado.',
    'home.websites.copy': 'Sitios web, plataformas y sistemas digitales creados para hacer los negocios mas claros, confiables y faciles de operar.',
    'home.websites.meta': 'Sitios web · Aplicaciones · Sistemas empresariales',
    'home.project.viewWebsite': 'Ver sitio web',
    'home.cleanSweep.category': 'Plataforma de informacion de barrido de calles',
    'home.cleanSweep.name': 'Clean Sweep',
    'home.cleanSweep.location': 'Condado de Los Angeles, California',
    'home.cleanSweep.headline': 'Una forma mas clara de navegar el barrido de calles.',
    'home.cleanSweep.description': 'Una plataforma digital practica disenada para ayudar a residentes del Condado de Los Angeles a encontrar informacion de barrido de calles y evitar multas de estacionamiento innecesarias.',
    'home.cleanSweep.linkAria': 'Ver el sitio web de Clean Sweep en una nueva pestana',
    'home.cleanSweep.visualAria': 'Captura del proyecto Clean Sweep',
    'home.cleanSweep.imageAlt': 'Captura de la pagina principal del sitio web Clean Sweep',
    'home.cocofilms.category': 'Sitio web de portafolio creativo',
    'home.cocofilms.name': 'CocoFilms',
    'home.cocofilms.headline': 'Un hogar cinematografico para historias visuales.',
    'home.cocofilms.description': 'Un sitio web refinado de fotografia y produccion de video enfocado en bodas, eventos, moda, videos musicales y visuales comerciales.',
    'home.cocofilms.linkAria': 'Ver el sitio web de CocoFilms en una nueva pestana',
    'home.cocofilms.visualAria': 'Captura del proyecto CocoFilms',
    'home.cocofilms.imageAlt': 'Captura de la pagina principal del sitio web CocoFilms',
    'home.davidBastida.category': 'Sitio web de portafolio personal',
    'home.davidBastida.name': 'David Bastida',
    'home.davidBastida.headline': 'Una identidad para el trabajo creativo y fundador.',
    'home.davidBastida.description': 'Un portafolio de doble ruta que presenta cinematica, arte 3D, UI/UX, apps moviles, productos SaaS y sistemas empresariales con una marca personal clara.',
    'home.davidBastida.linkAria': 'Ver el sitio web de David Bastida en una nueva pestana',
    'home.davidBastida.visualAria': 'Captura del proyecto David Bastida',
    'home.davidBastida.imageAlt': 'Captura de la pagina principal del portafolio David Bastida',
    'home.loyalRoofing.category': 'Sitio web para negocio de construccion',
    'home.loyalRoofing.name': 'The Loyal Roofing Company',
    'home.loyalRoofing.headline': 'Diseno que genera confianza para un negocio local de servicios.',
    'home.loyalRoofing.description': 'Un sitio web de techos y revestimientos creado para presentar servicios, credibilidad, galerias de proyectos y rutas directas para solicitar cotizaciones.',
    'home.loyalRoofing.linkAria': 'Ver el sitio web de The Loyal Roofing Company en una nueva pestana',
    'home.loyalRoofing.visualAria': 'Captura del proyecto The Loyal Roofing Company',
    'home.loyalRoofing.imageAlt': 'Captura de la pagina principal del sitio web The Loyal Roofing Company',
    'home.caterVegas.category': 'Plataforma interactiva para eventos',
    'home.caterVegas.name': 'Cater Vegas',
    'home.caterVegas.headline': 'Una experiencia guiada para planificar eventos.',
    'home.caterVegas.description': 'Una plataforma interactiva de hospitalidad donde los clientes comienzan con una fecha y avanzan por configuracion, menu, hospedaje, revision y pago.',
    'home.caterVegas.linkAria': 'Ver el sitio web de Cater Vegas en una nueva pestana',
    'home.caterVegas.visualAria': 'Captura del proyecto Cater Vegas',
    'home.caterVegas.imageAlt': 'Captura del calendario de planificacion de eventos de Cater Vegas',
    'home.progress.label': 'Navegacion de paneles de inicio',
    'home.progress.home': 'Inicio',
    'home.progress.websites': 'Trabajo seleccionado',
    'home.progress.cleanSweep': 'Clean Sweep',
    'home.progress.cocofilms': 'CocoFilms',
    'home.progress.davidBastida': 'David Bastida',
    'home.progress.loyalRoofing': 'The Loyal Roofing Company',
    'home.progress.caterVegas': 'Cater Vegas',
    'home.progress.whatsNext': 'Qué sigue',
    'home.next.title': '¿Qué sigue?',
    'home.next.ariaLabel': 'Ver FiltraCore en App Store en una nueva pestana',
    'home.progress.footer': 'Pie de pagina',
    'home.footer.ariaLabel': 'Pie de pagina'
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
