const heroBackground = "WhatsApp Image 2026-06-23 at 10.18.27 AM.jpeg";

const translations = {
  es: {
    navServices: "Servicios",
    navContact: "Contacto",
    heroKicker: "Estudio creativo",
    heroText: "Imagen, estilo y contenido visual para proyectos que necesitan verse claros, memorables y listos para compartir.",
    heroGallery: "Ver servicios",
    heroContact: "Contactar",
    introKicker: "Trabajo visual",
    introTitle: "Una presencia limpia para mostrar el portafolio.",
    introText: "Una pagina directa para presentar la identidad de Dunia Studio 7 con una imagen de fondo, servicios claros y contacto visible.",
    featureKicker: "Slogan",
    featureTitle: "Soft light. Real stories. Beautiful memories.",
    featureText: "Fotografia con direccion, estilo y sensibilidad para capturar lo que hace unico cada momento.",
    servicesKicker: "Servicios",
    servicesTitle: "Produccion con direccion clara",
    serviceOneTitle: "Fotografia",
    serviceOneText: "Sesiones enfocadas en imagen personal, producto y contenido social.",
    serviceTwoTitle: "Direccion visual",
    serviceTwoText: "Conceptos, paletas, encuadres y referencias para mantener coherencia.",
    serviceThreeTitle: "Contenido digital",
    serviceThreeText: "Material listo para publicar en web, redes y presentaciones.",
    contactKicker: "Contacto",
    contactTitle: "Listos para el siguiente proyecto."
  },
  en: {
    navServices: "Services",
    navContact: "Contact",
    heroKicker: "Creative studio",
    heroText: "Image, style, and visual content for projects that need to look clear, memorable, and ready to share.",
    heroGallery: "View services",
    heroContact: "Contact",
    introKicker: "Visual work",
    introTitle: "A clean presence for showing the portfolio.",
    introText: "A direct page for presenting Dunia Studio 7's identity with a background image, clear services, and visible contact.",
    featureKicker: "Slogan",
    featureTitle: "Soft light. Real stories. Beautiful memories.",
    featureText: "Photography with direction, style, and sensitivity to capture what makes every moment unique.",
    servicesKicker: "Services",
    servicesTitle: "Production with clear direction",
    serviceOneTitle: "Photography",
    serviceOneText: "Sessions focused on personal branding, products, and social content.",
    serviceTwoTitle: "Visual direction",
    serviceTwoText: "Concepts, palettes, framing, and references to keep every piece consistent.",
    serviceThreeTitle: "Digital content",
    serviceThreeText: "Material ready to publish on websites, social media, and presentations.",
    contactKicker: "Contact",
    contactTitle: "Ready for the next project."
  }
};

const heroMedia = document.querySelector("#heroMedia");
const languageButtons = document.querySelectorAll(".language-button");
let currentLanguage = "es";

function imagePath(file) {
  return encodeURI(`Imagenes/${file}`);
}

function setHeroImage() {
  heroMedia.style.backgroundImage = `url("${imagePath(heroBackground)}")`;
}

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = translations[language][key];
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === language);
  });
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

setHeroImage();
applyLanguage(currentLanguage);
