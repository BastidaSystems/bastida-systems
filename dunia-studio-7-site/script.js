const images = [
  {
    file: "WhatsApp Image 2026-06-23 at 10.18.27 AM.jpeg",
    title: {
      es: "Sesion en exterior",
      en: "Outdoor session"
    },
    category: "studio"
  },
  {
    file: "WhatsApp Image 2026-06-23 at 10.18.27 AM(1).jpeg",
    title: {
      es: "Sesion creativa",
      en: "Creative session"
    },
    category: "studio"
  },
  {
    file: "WhatsApp Image 2026-06-23 at 10.18.27 AM(2).jpeg",
    title: {
      es: "Detalle visual",
      en: "Visual detail"
    },
    category: "detalle"
  },
  {
    file: "WhatsApp Image 2026-06-23 at 10.18.27 AM(3).jpeg",
    title: {
      es: "Composicion",
      en: "Composition"
    },
    category: "studio"
  },
  {
    file: "WhatsApp Image 2026-06-23 at 10.18.27 AM(4).jpeg",
    title: {
      es: "Textura y luz",
      en: "Texture and light"
    },
    category: "detalle"
  }
];

const translations = {
  es: {
    navGallery: "Galeria",
    navServices: "Servicios",
    navContact: "Contacto",
    heroKicker: "Estudio creativo",
    heroText: "Imagen, estilo y contenido visual para proyectos que necesitan verse claros, memorables y listos para compartir.",
    heroGallery: "Ver galeria",
    heroContact: "Contactar",
    introKicker: "Trabajo visual",
    introTitle: "Una presencia limpia para mostrar el portafolio.",
    introText: 'Esta pagina usa las imagenes de la carpeta <strong>Imagenes</strong> y las organiza en una experiencia simple, responsiva y facil de editar.',
    galleryKicker: "Galeria",
    galleryTitle: "Imagenes destacadas",
    filterAll: "Todo",
    filterStudio: "Studio",
    filterDetail: "Detalle",
    servicesKicker: "Servicios",
    servicesTitle: "Produccion con direccion clara",
    serviceOneTitle: "Fotografia",
    serviceOneText: "Sesiones enfocadas en imagen personal, producto y contenido social.",
    serviceTwoTitle: "Direccion visual",
    serviceTwoText: "Conceptos, paletas, encuadres y referencias para mantener coherencia.",
    serviceThreeTitle: "Contenido digital",
    serviceThreeText: "Material listo para publicar en web, redes y presentaciones.",
    contactKicker: "Contacto",
    contactTitle: "Listos para el siguiente proyecto.",
    closeButton: "Cerrar",
    openImage: "Abrir imagen"
  },
  en: {
    navGallery: "Gallery",
    navServices: "Services",
    navContact: "Contact",
    heroKicker: "Creative studio",
    heroText: "Image, style, and visual content for projects that need to look clear, memorable, and ready to share.",
    heroGallery: "View gallery",
    heroContact: "Contact",
    introKicker: "Visual work",
    introTitle: "A clean presence for showing the portfolio.",
    introText: 'This page uses the images from the <strong>Imagenes</strong> folder and organizes them into a simple, responsive experience that is easy to edit.',
    galleryKicker: "Gallery",
    galleryTitle: "Featured images",
    filterAll: "All",
    filterStudio: "Studio",
    filterDetail: "Detail",
    servicesKicker: "Services",
    servicesTitle: "Production with clear direction",
    serviceOneTitle: "Photography",
    serviceOneText: "Sessions focused on personal branding, products, and social content.",
    serviceTwoTitle: "Visual direction",
    serviceTwoText: "Concepts, palettes, framing, and references to keep every piece consistent.",
    serviceThreeTitle: "Digital content",
    serviceThreeText: "Material ready to publish on websites, social media, and presentations.",
    contactKicker: "Contact",
    contactTitle: "Ready for the next project.",
    closeButton: "Close",
    openImage: "Open image"
  }
};

const galleryGrid = document.querySelector("#galleryGrid");
const heroMedia = document.querySelector("#heroMedia");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
const closeLightbox = document.querySelector(".lightbox-close");
const controls = document.querySelectorAll(".control");
const languageButtons = document.querySelectorAll(".language-button");
const carouselImage = document.querySelector("#carouselImage");
const carouselCaption = document.querySelector("#carouselCaption");
const carouselDots = document.querySelector("#carouselDots");
const prevSlide = document.querySelector("#prevSlide");
const nextSlide = document.querySelector("#nextSlide");
let currentLanguage = "es";
let currentFilter = "todo";
let currentSlide = 0;
let carouselTimer;

function imagePath(file) {
  return encodeURI(`Imagenes/${file}`);
}

function setHeroImage() {
  if (!images.length) return;
  heroMedia.style.backgroundImage = `url("${imagePath(images[0].file)}")`;
}

function renderGallery(filter = "todo") {
  currentFilter = filter;
  const visibleImages = filter === "todo"
    ? images
    : images.filter((image) => image.category === filter);

  galleryGrid.innerHTML = "";

  visibleImages.forEach((image) => {
    const button = document.createElement("button");
    button.className = "gallery-item";
    button.type = "button";
    button.setAttribute("aria-label", `${translations[currentLanguage].openImage}: ${image.title[currentLanguage]}`);

    const img = document.createElement("img");
    img.src = imagePath(image.file);
    img.alt = image.title[currentLanguage];
    img.loading = "lazy";

    const caption = document.createElement("span");
    caption.textContent = image.title[currentLanguage];

    button.append(img, caption);
    button.addEventListener("click", () => openLightbox(image));
    galleryGrid.appendChild(button);
  });
}

function renderCarousel() {
  const image = images[currentSlide];
  if (!image) return;

  carouselImage.src = imagePath(image.file);
  carouselImage.alt = image.title[currentLanguage];
  carouselCaption.textContent = image.title[currentLanguage];

  carouselDots.innerHTML = "";
  images.forEach((item, index) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `${translations[currentLanguage].openImage}: ${item.title[currentLanguage]}`);
    dot.classList.toggle("is-active", index === currentSlide);
    dot.addEventListener("click", () => {
      currentSlide = index;
      renderCarousel();
      restartCarousel();
    });
    carouselDots.appendChild(dot);
  });
}

function moveSlide(direction) {
  currentSlide = (currentSlide + direction + images.length) % images.length;
  renderCarousel();
  restartCarousel();
}

function restartCarousel() {
  window.clearInterval(carouselTimer);
  carouselTimer = window.setInterval(() => {
    currentSlide = (currentSlide + 1) % images.length;
    renderCarousel();
  }, 4200);
}

function openLightbox(image) {
  lightboxImage.src = imagePath(image.file);
  lightboxImage.alt = image.title[currentLanguage];
  lightboxCaption.textContent = image.title[currentLanguage];
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
}

function hideLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
}

controls.forEach((control) => {
  control.addEventListener("click", () => {
    controls.forEach((item) => item.classList.remove("is-active"));
    control.classList.add("is-active");
    renderGallery(control.dataset.filter);
  });
});

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.innerHTML = translations[language][key];
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === language);
  });

  renderCarousel();
  renderGallery(currentFilter);
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

closeLightbox.addEventListener("click", hideLightbox);
prevSlide.addEventListener("click", () => moveSlide(-1));
nextSlide.addEventListener("click", () => moveSlide(1));

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    hideLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideLightbox();
  }
});

setHeroImage();
applyLanguage(currentLanguage);
restartCarousel();
