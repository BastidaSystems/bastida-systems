const heroBackground = "WhatsApp Image 2026-06-23 at 10.18.27 AM.jpeg";

const translations = {
  es: {
    navServices: "Servicios",
    navContact: "Contacto",
    heroKicker: "Estudio creativo",
    heroText: "Imagen, estilo y contenido visual para proyectos que necesitan verse claros, memorables y listos para compartir.",
    heroGallery: "Ver servicios",
    heroContact: "Contactar",
    featureKicker: "Slogan",
    featureTitle: "Soft light. Real stories. Beautiful memories.",
    featureText: "Fotografía con dirección, estilo y sensibilidad para capturar lo que hace único cada momento.",
    servicesKicker: "Servicios",
    servicesTitle: "Producción con dirección clara",
    serviceOneTitle: "Fotografía",
    serviceOneText: "Sesiones enfocadas en imagen personal, producto y contenido social.",
    serviceTwoTitle: "Dirección visual",
    serviceTwoText: "Conceptos, paletas, encuadres y referencias para mantener coherencia.",
    serviceThreeTitle: "Contenido digital",
    serviceThreeText: "Material listo para publicar en web, redes y presentaciones.",
    contactKicker: "Contacto",
    contactTitle: "Capturemos tu <span>momento dorado.</span>",
    contactText: "Reserva una sesión, haz una pregunta o sigue a Dunia Studio 7 en Instagram.",
    phoneLabel: "Teléfono",
    bookButton: "Reservar sesión",
    followButton: "Seguir en Instagram"
  },
  en: {
    navServices: "Services",
    navContact: "Contact",
    heroKicker: "Creative studio",
    heroText: "Image, style, and visual content for projects that need to look clear, memorable, and ready to share.",
    heroGallery: "View services",
    heroContact: "Contact",
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
    contactKicker: "Get in touch",
    contactTitle: "Let's capture your <span>golden moment.</span>",
    contactText: "Book a session, ask a question, or follow Dunia Studio 7 on Instagram.",
    phoneLabel: "Phone",
    bookButton: "Book a session",
    followButton: "Follow on Instagram"
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

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;
    element.innerHTML = translations[language][key];
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
