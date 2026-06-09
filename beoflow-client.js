const config = window.BEOFLOW_CLIENT_PROD_CONFIG || {};
const missingAnonKeyValues = new Set([
  '',
  '[PEGA AQUÍ TU ANON PUBLIC KEY]',
  'PASTE_CLIENT_PROD_ANON_PUBLIC_KEY_HERE'
]);

const DEFAULT_WASTE_PERCENTAGE = 0.1;
const DEFAULT_FOOD_FACTOR = 1;
const MAX_INLINE_RECIPE_IMAGE_BYTES = 1.5 * 1024 * 1024;
const RECIPE_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMMON_UNIT_OPTIONS = ['each', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'batch', 'portion'];
const LANGUAGE_STORAGE_KEY = 'beoflow_language';
const SUPPORTED_LANGUAGES = new Set(['en', 'es']);
const LANGUAGE_LABELS = {
  en: 'English',
  es: 'Español'
};

const UI_TRANSLATIONS_ES = {
  'Beoflow App | Bastida Systems': 'Beoflow App | Bastida Systems',
  'Loading session': 'Cargando sesión',
  'Preparing your secure Beoflow workspace.': 'Preparando tu espacio seguro de Beoflow.',
  'Kitchen operations workspace': 'Espacio de operaciones de cocina',
  'Sign in or create an account to manage your restaurant, events, recipes, inventory, staff, and reports.': 'Inicia sesión o crea una cuenta para administrar tu restaurante, eventos, recetas, inventario, personal y reportes.',
  'Sign in': 'Iniciar sesión',
  'Create account': 'Crear cuenta',
  'Full name': 'Nombre completo',
  'Your name': 'Tu nombre',
  'Email': 'Correo electrónico',
  'Password': 'Contraseña',
  'Minimum 6 characters': 'Mínimo 6 caracteres',
  'Confirm password': 'Confirmar contraseña',
  'Forgot password?': '¿Olvidaste tu contraseña?',
  'Send reset email': 'Enviar correo de recuperación',
  'Back to sign in': 'Volver a iniciar sesión',
  'Reset your password': 'Restablecer contraseña',
  'Enter and confirm your new Beoflow password.': 'Ingresa y confirma tu nueva contraseña de Beoflow.',
  'New password': 'Nueva contraseña',
  'Confirm new password': 'Confirmar nueva contraseña',
  'Minimum 8 characters': 'Mínimo 8 caracteres',
  'Update password': 'Actualizar contraseña',
  'Show password': 'Mostrar contraseña',
  'Hide password': 'Ocultar contraseña',
  'Step 1 of 1': 'Paso 1 de 1',
  'Set up your first restaurant': 'Configura tu primer restaurante',
  'Create a workspace for your restaurant, kitchen, or operation.': 'Crea un espacio para tu restaurante, cocina u operación.',
  'Restaurant / Operation Name': 'Nombre del restaurante / operación',
  'Restaurant name': 'Nombre del restaurante',
  'Business Type': 'Tipo de negocio',
  'Restaurant': 'Restaurante',
  'Catering': 'Catering',
  'Casino Kitchen': 'Cocina de casino',
  'Hotel Kitchen': 'Cocina de hotel',
  'Bar': 'Bar',
  'Food Truck': 'Food truck',
  'Company': 'Empresa',
  'Other': 'Otro',
  'City optional': 'Ciudad opcional',
  'State optional': 'Estado opcional',
  'Timezone optional': 'Zona horaria opcional',
  'Create Workspace': 'Crear espacio',
  'Beoflow Workspace': 'Espacio Beoflow',
  'Workspace created': 'Espacio creado',
  'Your Beoflow workspace is ready.': 'Tu espacio Beoflow está listo.',
  'Continue to dashboard': 'Continuar al dashboard',
  'Choose workspace': 'Elegir espacio',
  'Choose your workspace': 'Elige tu espacio',
  'Select the restaurant or operation you want to manage.': 'Selecciona el restaurante u operación que quieres administrar.',
  'Add another restaurant': 'Agregar otro restaurante',
  'Open menu': 'Abrir menú',
  'Close menu': 'Cerrar menú',
  'Beoflow navigation': 'Navegación de Beoflow',
  'Beoflow modules': 'Módulos de Beoflow',
  'Workspace actions': 'Acciones del espacio',
  'Dashboard': 'Dashboard',
  'Events': 'Eventos',
  'Menu': 'Menú',
  'Recipes': 'Recetas',
  'Subrecipes': 'Subrecetas',
  'Inventory': 'Inventario',
  'Production': 'Producción',
  'Staff': 'Personal',
  'Reports': 'Reportes',
  'Switch workspace': 'Cambiar espacio',
  'Switch restaurant': 'Cambiar restaurante',
  'Add restaurant': 'Agregar restaurante',
  'Workspace settings': 'Configuración del espacio',
  'Sign out': 'Cerrar sesión',
  'Loading your restaurant workspace.': 'Cargando el espacio de tu restaurante.',
  'Current workspace': 'Espacio actual',
  'Restaurant workspace': 'Espacio del restaurante',
  'Welcome to your Beoflow workspace. Your operating modules are ready for real restaurant data when your team starts building.': 'Bienvenido a tu espacio Beoflow. Tus módulos operativos están listos para datos reales del restaurante cuando tu equipo empiece a trabajar.',
  'Operations Calendar': 'Calendario de operaciones',
  'Beoflow module empty states': 'Estados vacíos de módulos Beoflow',
  'No events yet': 'Sin eventos todavía',
  'No menu items yet': 'Sin elementos de menú todavía',
  'No recipes yet': 'Sin recetas todavía',
  'No subrecipes yet': 'Sin subrecetas todavía',
  'No inventory items yet': 'Sin inventario todavía',
  'Search': 'Buscar',
  'Selected': 'Seleccionado',
  'Selected product': 'Producto seleccionado',
  'No image': 'Sin imagen',
  'No production logs yet': 'Sin registros de producción todavía',
  'No staff members yet': 'Sin personal todavía',
  'No reports yet': 'Sin reportes todavía',
  'Beoflow Module': 'Módulo Beoflow',
  '0 records': '0 registros',
  'New Event': 'Nuevo evento',
  'No events yet.': 'No hay eventos todavía.',
  'Create your first event to start planning service operations.': 'Crea tu primer evento para empezar a planear la operación.',
  'This module is ready for the next build.': 'Este módulo está listo para la siguiente etapa.',
  'Add record': 'Agregar registro',
  'Create a new workspace record.': 'Crea un nuevo registro del espacio.',
  'Close': 'Cerrar',
  'Cancel': 'Cancelar',
  'Save': 'Guardar',
  'Save Changes': 'Guardar cambios',
  'Save settings': 'Guardar configuración',
  'Edit the business name and type for the active Beoflow workspace.': 'Edita el nombre y tipo de negocio del espacio Beoflow activo.',
  'Business name': 'Nombre del negocio',
  'Business type': 'Tipo de negocio',
  'Default waste percentage': 'Porcentaje de merma predeterminado',
  'Food factor': 'Factor de alimento',
  'Plan catering events, service days, banquets, and production schedules.': 'Planea eventos de catering, días de servicio, banquetes y calendarios de producción.',
  'Link menu items to recipes and track selling price, cost, margin, and profit.': 'Vincula elementos de menú con recetas y controla precio de venta, costo, margen y utilidad.',
  'Standardize recipes, ingredients, procedures, and consistency.': 'Estandariza recetas, ingredientes, procedimientos y consistencia.',
  'Create reusable preparations such as sauces, bases, doughs, and garnishes.': 'Crea preparaciones reutilizables como salsas, bases, masas y guarniciones.',
  'Register kitchen inputs by code, presentation, supplier, and cost.': 'Registra insumos de cocina por presentación, proveedor y costo.',
  'Organize prep tasks, production logs, and kitchen execution.': 'Organiza tareas de preparación, registros de producción y ejecución de cocina.',
  'Manage team members, roles, schedules, and responsibilities.': 'Administra miembros del equipo, roles, horarios y responsabilidades.',
  'View operational insights once Beoflow has activity.': 'Consulta indicadores operativos cuando Beoflow tenga actividad.',
  'New Menu Item': 'Nuevo elemento de menú',
  'New Recipe': 'Nueva receta',
  'New Subrecipe': 'Nueva subreceta',
  'New Ingredient': 'Nuevo ingrediente',
  'New Production Plan': 'Nuevo plan de producción',
  'Add Staff Member': 'Agregar miembro del personal',
  'View Reports': 'Ver reportes',
  'No menu items yet.': 'No hay elementos de menú todavía.',
  'Add your first menu item once a recipe is ready.': 'Agrega tu primer elemento de menú cuando una receta esté lista.',
  'No recipes yet.': 'No hay recetas todavía.',
  'Add your first recipe to begin building your recipe library.': 'Agrega tu primera receta para empezar tu biblioteca.',
  'No subrecipes yet.': 'No hay subrecetas todavía.',
  'Create reusable preparations manually when you are ready.': 'Crea preparaciones reutilizables cuando estés listo.',
  'No inventory items yet.': 'No hay inventario todavía.',
  'Add your first input to start building recipe costs.': 'Agrega tu primer insumo para empezar a costear recetas.',
  'No production records yet.': 'No hay registros de producción todavía.',
  'Start a production log when operations begin.': 'Inicia un registro cuando empiece la operación.',
  'No staff members yet.': 'No hay miembros del personal todavía.',
  'Add your first staff member or invite a user.': 'Agrega tu primer miembro del personal o invita a un usuario.',
  'No reports yet.': 'No hay reportes todavía.',
  'Reports will appear after events, inventory, and production activity.': 'Los reportes aparecerán después de actividad en eventos, inventario y producción.',
  'Event Name': 'Nombre del evento',
  'Event Type': 'Tipo de evento',
  'Event Date': 'Fecha del evento',
  'Start Time': 'Hora de inicio',
  'End Time': 'Hora de fin',
  'Guest Count': 'Número de invitados',
  'Location': 'Ubicación',
  'Status': 'Estado',
  'Notes': 'Notas',
  'Item Name': 'Nombre del elemento',
  'Linked Recipe': 'Receta vinculada',
  'Category': 'Categoría',
  'Sale Price': 'Precio de venta',
  'Recipe Name': 'Nombre de receta',
  'Recipe Number': 'Número de receta',
  'Yield Quantity': 'Rendimiento',
  'Yield Unit': 'Unidad de rendimiento',
  'Portions / Pax': 'Porciones / Pax',
  'Prep Time': 'Tiempo de preparación',
  'Cook Time': 'Tiempo de cocción',
  'Recipe Photo': 'Foto de receta',
  'Procedure': 'Procedimiento',
  'Subrecipe Name': 'Nombre de subreceta',
  'Subrecipe Number': 'Número de subreceta',
  'Automatic': 'Automático',
  'Yield / Rendimiento': 'Rendimiento',
  'Name / Description': 'Nombre / descripción',
  'Base Unit': 'Unidad base',
  'Package Quantity': 'Cantidad por paquete',
  'Package Unit': 'Unidad del paquete',
  'Package Price': 'Precio del paquete',
  'Current Stock': 'Stock actual',
  'Minimum Stock': 'Stock mínimo',
  'Supplier': 'Proveedor',
  'Log Title': 'Título del registro',
  'Production Date': 'Fecha de producción',
  'Shift': 'Turno',
  'Assigned To': 'Asignado a',
  'Full Name': 'Nombre completo',
  'Role': 'Rol',
  'Phone': 'Teléfono',
  'Ingredient': 'Ingrediente',
  'Ingredients': 'Ingredientes',
  'Inventory ingredient': 'Ingrediente de inventario',
  'Search inventory': 'Buscar inventario',
  'Search by ingredient, category, or supplier': 'Buscar por ingrediente, categoría o proveedor',
  'Quantity': 'Cantidad',
  'Unit': 'Unidad',
  'Select unit': 'Seleccionar unidad',
  'Add selected': 'Agregar seleccionado',
  'Create inventory item': 'Crear ingrediente de inventario',
  'Create new': 'Crear nuevo',
  'Create': 'Crear',
  'Create and add': 'Crear y agregar',
  'Qty to add': 'Cantidad a agregar',
  'Cost / Price': 'Costo / precio',
  'Ingredient name': 'Nombre del ingrediente',
  'Add Ingredient': 'Agregar ingrediente',
  'Ingredient list': 'Lista de ingredientes',
  'Cost summary': 'Resumen de costos',
  'Cost': 'Costo',
  'Actions': 'Acciones',
  'Inventory connection': 'Conexión con inventario',
  'In inventory': 'En inventario',
  'Not in inventory': 'No está en inventario',
  'Add to Inventory': 'Agregar a inventario',
  'Total ingredient cost': 'Costo total de ingredientes',
  'Waste': 'Merma',
  'Suggested sale price': 'Precio de venta sugerido',
  'Cost per yield/unit': 'Costo por unidad de rendimiento',
  'Cost per portion': 'Costo por porción',
  'Margin': 'Margen',
  'Not set': 'Sin definir',
  'View Recipe': 'Ver receta',
  'View Details': 'Ver detalles',
  'Edit': 'Editar',
  'Edit Recipe': 'Editar receta',
  'Edit Subrecipe': 'Editar subreceta',
  'Edit Ingredient': 'Editar ingrediente',
  'Archive': 'Archivar',
  'Active': 'Activo',
  'Low Stock': 'Stock bajo',
  'No Price': 'Sin precio',
  'No Pack': 'Sin empaque',
  'Costed': 'Costeado',
  'Valid': 'Válido',
  'Invalid': 'No válido',
  'Connected': 'Conectado',
  'Unconnected': 'Sin conectar',
  'Missing inventory': 'Falta inventario',
  'Inventory connected': 'Inventario conectado',
  'No ingredients yet.': 'No hay ingredientes todavía.',
  'Recipe workspace': 'Espacio de receta',
  'Subrecipe': 'Subreceta',
  'Stock': 'Stock',
  'Package': 'Paquete',
  'Unit cost': 'Costo unitario',
  'Recipe Usage': 'Uso en recetas',
  'Not used in recipes or subrecipes yet.': 'Aún no se usa en recetas o subrecetas.',
  'Use in recipe': 'Usar en receta',
  'Add to recipe': 'Agregar a receta',
  'Add to Recipe': 'Agregar a receta',
  'Remove ingredient': 'Eliminar ingrediente',
  'Remove this ingredient?': 'Eliminar este ingrediente?',
  'Delete ingredient': 'Eliminar ingrediente',
  'Ingredient details': 'Detalles del ingrediente',
  'Inventory actions': 'Acciones de inventario',
  'Calendar controls': 'Controles de calendario',
  'Loading recipes.': 'Cargando recetas.',
  'Recipe': 'Receta',
  'Recipe workspace': 'Espacio de receta',
  'No linked recipe': 'Sin receta vinculada',
  'No recipes available': 'No hay recetas disponibles',
  'No inventory ingredient found': 'No se encontró ingrediente en inventario',
  'Select inventory ingredient': 'Seleccionar ingrediente de inventario',
  'No subrecipes available': 'No hay subrecetas disponibles',
  'Select subrecipe': 'Seleccionar subreceta',
  'Subrecipe search': 'Buscar subreceta',
  'Add Subrecipe': 'Agregar subreceta',
  'Today': 'Hoy',
  'No events scheduled for this date.': 'No hay eventos programados para esta fecha.',
  'Event calendar': 'Calendario de eventos',
  'Previous month': 'Mes anterior',
  'Next month': 'Mes siguiente',
  'Monthly operations': 'Operaciones mensuales',
  'Create event': 'Crear evento',
  'Loading': 'Cargando',
  'Loading metrics': 'Cargando métricas',
  'Unable to load': 'No se pudo cargar',
  'Loading workspace records.': 'Cargando registros del espacio.',
  'Add workspace': 'Agregar espacio',
  'Create another Beoflow workspace for a restaurant, kitchen, or operation.': 'Crea otro espacio Beoflow para un restaurante, cocina u operación.',
  'Complete recipe details for this workspace.': 'Completa los detalles de la receta para este espacio.',
  'Complete subrecipe details for this workspace.': 'Completa los detalles de la subreceta para este espacio.',
  'Reset password. Enter and confirm your new password.': 'Restablece tu contraseña. Ingresa y confirma tu nueva contraseña.',
  'Creating account': 'Creando cuenta',
  'Signing in': 'Iniciando sesión',
  'Sending reset email': 'Enviando correo de recuperación',
  'Updating password': 'Actualizando contraseña',
  'Password reset email sent. Check your inbox.': 'Correo de recuperación enviado. Revisa tu bandeja.',
  'Password updated successfully.': 'Contraseña actualizada correctamente.',
  'Password updated successfully. Sign in with your new password.': 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.',
  'Check your email to confirm your account. After confirmation, return to Beoflow to continue.': 'Revisa tu correo para confirmar tu cuenta. Después de confirmar, vuelve a Beoflow para continuar.',
  'Authentication failed.': 'No se pudo autenticar.',
  'Unable to send password reset email.': 'No se pudo enviar el correo de recuperación.',
  'Unable to update password.': 'No se pudo actualizar la contraseña.',
  'Unable to create restaurant.': 'No se pudo crear el restaurante.',
  'Unable to update workspace settings.': 'No se pudo actualizar la configuración del espacio.',
  'Unable to load session.': 'No se pudo cargar la sesión.',
  'Unable to load your Beoflow workspace.': 'No se pudo cargar tu espacio Beoflow.',
  'Unable to load dashboard counts.': 'No se pudieron cargar los conteos del dashboard.',
  'Unable to load dashboard calendar.': 'No se pudo cargar el calendario del dashboard.',
  'Unable to save recipe.': 'No se pudo guardar la receta.',
  'Unable to add ingredient.': 'No se pudo agregar el ingrediente.',
  'Unable to add subrecipe.': 'No se pudo agregar la subreceta.',
  'Unable to create ingredient.': 'No se pudo crear el ingrediente.',
  'Unable to add ingredient to inventory.': 'No se pudo agregar el ingrediente al inventario.',
  'Unable to connect ingredient to recipe.': 'No se pudo conectar el ingrediente a la receta.',
  'Unable to load recipes.': 'No se pudieron cargar las recetas.',
  'Unable to load image.': 'No se pudo cargar la imagen.',
  'Choose a JPG, PNG, or WebP image.': 'Elige una imagen JPG, PNG o WebP.',
  'Image is too large. Choose an image under 1.5 MB.': 'La imagen es muy grande. Elige una imagen menor a 1.5 MB.',
  'Password must be at least 8 characters.': 'La contraseña debe tener al menos 8 caracteres.',
  'Passwords do not match.': 'Las contraseñas no coinciden.',
  'Restaurant / Operation Name is required.': 'El nombre del restaurante u operación es obligatorio.',
  'Business name is required.': 'El nombre del negocio es obligatorio.',
  'Open a workspace before editing settings.': 'Abre un espacio antes de editar la configuración.',
  'Open a restaurant workspace before creating records.': 'Abre un espacio de restaurante antes de crear registros.',
  'Open a restaurant workspace before updating records.': 'Abre un espacio de restaurante antes de actualizar registros.',
  'Sign in before managing Beoflow records.': 'Inicia sesión antes de administrar registros de Beoflow.',
  'Sign in before creating a restaurant.': 'Inicia sesión antes de crear un restaurante.',
  'Client-prod is not configured.': 'Client-prod no está configurado.',
  'Supabase client library failed to load.': 'No se pudo cargar la librería cliente de Supabase.',
  'Workspace settings updated.': 'Configuración del espacio actualizada.',
  'Recipe created.': 'Receta creada.',
  'Recipe updated.': 'Receta actualizada.',
  'Recipe name is required.': 'El nombre de la receta es obligatorio.',
  'Recipe record was not found. Reload Recipes and try again.': 'No se encontró la receta. Recarga Recipes e inténtalo de nuevo.',
  'Choose or name an ingredient first.': 'Elige o escribe un ingrediente primero.',
  'Choose a valid recipe ingredient.': 'Elige un ingrediente válido para la receta.',
  'Ingredient name is required.': 'El nombre del ingrediente es obligatorio.',
  'Ingredient name is required before adding it to inventory.': 'El nombre del ingrediente es obligatorio antes de agregarlo al inventario.',
  'Ingredient quantity cannot be negative.': 'La cantidad del ingrediente no puede ser negativa.',
  'Package Price cannot be negative.': 'El precio del paquete no puede ser negativo.',
  'Subrecipe quantity cannot be negative.': 'La cantidad de la subreceta no puede ser negativa.',
  'Add at least one ingredient before saving this recipe.': 'Agrega al menos un ingrediente antes de guardar esta receta.',
  'Every ingredient needs a name before saving.': 'Cada ingrediente necesita nombre antes de guardar.',
  'Package Quantity cannot be 0.': 'La cantidad por paquete no puede ser 0.',
  'Choose a valid linked recipe.': 'Elige una receta vinculada válida.',
  'Choose a recipe to connect this ingredient.': 'Elige una receta para conectar este ingrediente.',
  'Choose a valid inventory ingredient.': 'Elige un ingrediente de inventario válido.',
  'Choose an inventory ingredient first.': 'Elige primero un ingrediente de inventario.',
  'Choose a subrecipe first.': 'Elige primero una subreceta.',
  'Ingredient quantity must be greater than zero.': 'La cantidad del ingrediente debe ser mayor que cero.',
  'Subrecipes are already connected as reusable preparations.': 'Las subrecetas ya están conectadas como preparaciones reutilizables.',
  'This recipe cost is 0. Add ingredients and costs before activating this menu item.': 'El costo de esta receta es 0. Agrega ingredientes y costos antes de activar este elemento de menú.',
  'Language': 'Idioma',
  'English': 'Inglés',
  'Spanish': 'Español'
};

let isApplyingLanguage = false;
let languageObserver = null;

function getInitialLanguage() {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.has(storedLanguage)) return storedLanguage;
  } catch (error) {
    // Ignore storage errors and fall back to the browser language.
  }

  const browserLanguage = String(navigator.language || '').toLowerCase();
  return browserLanguage.startsWith('es') ? 'es' : 'en';
}

const state = {
  supabase: null,
  user: null,
  profile: null,
  language: getInitialLanguage(),
  userClients: [],
  activeClient: null,
  activeSection: 'dashboard',
  moduleRecords: {},
  moduleCounts: {},
  reportsData: null,
  modalSection: null,
  editingRecord: null,
  recipeIngredientsDraft: [],
  recipeIngredientSearch: '',
  recipeQuickIngredientOpen: false,
  recipeInlineNewOpen: false,
  recipeInlineNewIngredient: null,
  recipeLinkIngredient: null,
  subrecipeSearch: '',
  dashboardCalendarDate: new Date(),
  dashboardSelectedDate: null,
  dashboardEvents: [],
  mobileDrawerOpen: false,
  onboardingMode: 'first',
  authMode: 'signin',
  isRecoveryMode: false,
  passwordUpdatePending: false,
  loading: false
};

function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.has(language) ? language : 'en';
}

function translateSingular(value) {
  const labels = {
    event: 'evento',
    'menu item': 'elemento de menú',
    recipe: 'receta',
    subrecipe: 'subreceta',
    'inventory item': 'ingrediente',
    'production log': 'registro de producción',
    'staff member': 'miembro del personal'
  };

  return labels[String(value || '').toLowerCase()] || value;
}

function translateModuleTitle(value) {
  return UI_TRANSLATIONS_ES[value] || value;
}

function translateCountLabel(count, singular, plural) {
  const labels = {
    event: ['evento', 'eventos'],
    events: ['evento', 'eventos'],
    'menu item': ['elemento de menú', 'elementos de menú'],
    'menu items': ['elemento de menú', 'elementos de menú'],
    recipe: ['receta', 'recetas'],
    recipes: ['receta', 'recetas'],
    subrecipe: ['subreceta', 'subrecetas'],
    subrecipes: ['subreceta', 'subrecetas'],
    'inventory item': ['ingrediente', 'ingredientes'],
    'inventory items': ['ingrediente', 'ingredientes'],
    'production log': ['registro de producción', 'registros de producción'],
    'production logs': ['registro de producción', 'registros de producción'],
    'staff member': ['miembro del personal', 'miembros del personal'],
    'staff members': ['miembro del personal', 'miembros del personal'],
    ingredient: ['ingrediente', 'ingredientes'],
    ingredients: ['ingrediente', 'ingredientes'],
    metric: ['métrica', 'métricas'],
    metrics: ['métrica', 'métricas'],
    product: ['producto', 'productos'],
    products: ['producto', 'productos'],
    record: ['registro', 'registros'],
    records: ['registro', 'registros']
  };
  const labelKey = String(Number(count) === 1 ? singular : plural || singular || 'records').toLowerCase();
  const fallbackKey = String(singular || plural || 'records').toLowerCase();
  const pair = labels[labelKey] || labels[fallbackKey] || labels.records;
  return `${count} ${Number(count) === 1 ? pair[0] : pair[1]}`;
}

function translateCoreText(text) {
  if (state.language !== 'es') return text;
  if (!text) return text;

  const exactTranslation = UI_TRANSLATIONS_ES[text];
  if (exactTranslation) return exactTranslation;

  let match = text.match(/^(\d+)\s+(event|events|menu item|menu items|recipe|recipes|subrecipe|subrecipes|inventory item|inventory items|production log|production logs|staff member|staff members|ingredient|ingredients|metric|metrics|product|products|record|records)$/i);
  if (match) {
    return translateCountLabel(match[1], match[2], match[2]);
  }

  match = text.match(/^Update this (.+?) for (.+)\.$/);
  if (match) {
    return `Actualiza este registro de ${translateSingular(match[1])} para ${match[2]}.`;
  }

  match = text.match(/^Create a new (.+?) for (.+)\.$/);
  if (match) {
    return `Crea un nuevo registro de ${translateSingular(match[1])} para ${match[2]}.`;
  }

  match = text.match(/^Welcome to (.+)\. Your Beoflow modules are ready for real operating data when your team starts building\.$/);
  if (match) {
    return `Bienvenido a ${match[1]}. Tus módulos Beoflow están listos para datos operativos reales cuando tu equipo empiece a trabajar.`;
  }

  match = text.match(/^(.+) is ready in Beoflow\.$/);
  if (match) return `${match[1]} está listo en Beoflow.`;

  match = text.match(/^Complete (.+?) details for (.+)\.$/);
  if (match) {
    return `Completa los detalles de ${translateSingular(match[1])} para ${match[2]}.`;
  }

  match = text.match(/^(.+) record updated\.$/);
  if (match) return `Registro de ${translateModuleTitle(match[1])} actualizado.`;

  match = text.match(/^(.+) record created\.$/);
  if (match) return `Registro de ${translateModuleTitle(match[1])} creado.`;

  match = text.match(/^(.+) record archived\.$/);
  if (match) return `Registro de ${translateModuleTitle(match[1])} archivado.`;

  match = text.match(/^Archive (.+)\?$/);
  if (match) return `¿Archivar ${match[1]}?`;

  match = text.match(/^Unable to load (.+)\.$/);
  if (match) return `No se pudo cargar ${translateModuleTitle(match[1])}.`;

  match = text.match(/^Unable to save (.+)\.$/);
  if (match) return `No se pudo guardar ${translateSingular(match[1])}.`;

  match = text.match(/^Unable to archive (.+)\.$/);
  if (match) return `No se pudo archivar ${translateSingular(match[1])}.`;

  match = text.match(/^(.+) is required\.$/);
  if (match) return `${translateModuleTitle(match[1])} es obligatorio.`;

  match = text.match(/^(.+) must be a valid number\.$/);
  if (match) return `${translateModuleTitle(match[1])} debe ser un número válido.`;

  match = text.match(/^(.+) cannot be negative\.$/);
  if (match) return `${translateModuleTitle(match[1])} no puede ser negativo.`;

  match = text.match(/^(.+) already exists in Inventory\. Use the existing ingredient instead of creating a duplicate\.$/);
  if (match) return `${match[1]} ya existe en Inventario. Usa el ingrediente existente en vez de crear un duplicado.`;

  match = text.match(/^Add at least one inventory input before saving this (.+)\.$/);
  if (match) return `Agrega al menos un insumo de inventario antes de guardar esta ${translateSingular(match[1])}.`;

  match = text.match(/^(.+) added to inventory and connected\.$/);
  if (match) return `${match[1]} agregado al inventario y conectado.`;

  match = text.match(/^(.+) connected from inventory\.$/);
  if (match) return `${match[1]} conectado desde inventario.`;

  match = text.match(/^(.+) added to inventory and recipe\.$/);
  if (match) return `${match[1]} agregado al inventario y a la receta.`;

  match = text.match(/^(.+) added to (.+)\.$/);
  if (match) return `${match[1]} agregado a ${match[2]}.`;

  return text;
}

function translateText(value) {
  const rawText = String(value ?? '');
  if (state.language !== 'es') return rawText;
  const match = rawText.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return rawText;
  return `${match[1]}${translateCoreText(match[2])}${match[3]}`;
}

function applyLanguageToTextNode(node) {
  if (!node?.nodeValue || !node.nodeValue.trim()) return;
  const parent = node.parentElement;
  if (!parent || parent.closest('script, style, textarea, [contenteditable="true"]')) return;

  const currentText = node.nodeValue;
  if (
    node.__beoflowOriginalText === undefined
    || (currentText !== node.__beoflowLastAppliedText && currentText !== node.__beoflowOriginalText)
  ) {
    node.__beoflowOriginalText = currentText;
  }

  const nextText = state.language === 'es' ? translateText(node.__beoflowOriginalText) : node.__beoflowOriginalText;
  node.__beoflowLastAppliedText = nextText;
  if (node.nodeValue !== nextText) node.nodeValue = nextText;
}

function applyLanguageToElementAttributes(element) {
  if (!(element instanceof Element)) return;
  const translatableAttributes = ['placeholder', 'title', 'aria-label', 'alt'];

  translatableAttributes.forEach(attribute => {
    if (!element.hasAttribute(attribute)) return;
    const currentValue = element.getAttribute(attribute);
    element.__beoflowOriginalAttributes = element.__beoflowOriginalAttributes || {};
    element.__beoflowLastAppliedAttributes = element.__beoflowLastAppliedAttributes || {};

    if (
      element.__beoflowOriginalAttributes[attribute] === undefined
      || (
        currentValue !== element.__beoflowLastAppliedAttributes[attribute]
        && currentValue !== element.__beoflowOriginalAttributes[attribute]
      )
    ) {
      element.__beoflowOriginalAttributes[attribute] = currentValue;
    }

    const originalValue = element.__beoflowOriginalAttributes[attribute];
    const nextValue = state.language === 'es' ? translateText(originalValue) : originalValue;
    element.__beoflowLastAppliedAttributes[attribute] = nextValue;
    if (element.getAttribute(attribute) !== nextValue) {
      element.setAttribute(attribute, nextValue);
    }
  });
}

function applyLanguageToDocument(root = document.body) {
  if (!root || isApplyingLanguage) return;
  isApplyingLanguage = true;

  try {
    document.documentElement.lang = state.language;
    document.title = state.language === 'es'
      ? translateText('Beoflow App | Bastida Systems')
      : 'Beoflow App | Bastida Systems';

    document.querySelectorAll('[data-language-select]').forEach(select => {
      select.value = state.language;
    });

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      applyLanguageToTextNode(textNode);
      textNode = walker.nextNode();
    }

    const attributeRoot = root.nodeType === Node.ELEMENT_NODE ? root : document.body;
    if (attributeRoot instanceof Element) applyLanguageToElementAttributes(attributeRoot);
    attributeRoot.querySelectorAll?.('*').forEach(applyLanguageToElementAttributes);
  } finally {
    isApplyingLanguage = false;
  }
}

function scheduleLanguageApply(root = document.body) {
  window.requestAnimationFrame(() => applyLanguageToDocument(root));
}

function startLanguageObserver() {
  if (languageObserver || !document.body) return;
  languageObserver = new MutationObserver(mutations => {
    if (isApplyingLanguage) return;
    const targetMutation = mutations.find(mutation => mutation.target);
    const target = targetMutation?.target;
    const root = target?.nodeType === Node.ELEMENT_NODE ? target : document.body;
    scheduleLanguageApply(root);
  });

  languageObserver.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true
  });
}

function setLanguage(language) {
  state.language = normalizeLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  } catch (error) {
    // Ignore storage errors; the current session still switches language.
  }

  applyLanguageToDocument(document.body);
}

const MODULE_SECTIONS = {
  events: {
    title: 'Events',
    subtitle: 'Plan catering events, service days, banquets, and production schedules.',
    emptyTitle: 'No events yet.',
    emptyCopy: 'Create your first event to start planning service operations.',
    action: 'New Event',
    singular: 'event',
    plural: 'events',
    table: 'beoflow_events',
    index: '01',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['event_type', 'event_date', 'start_time', 'guest_count', 'location'],
    detailFields: ['end_time', 'notes'],
    fields: [
      { name: 'name', label: 'Event Name', type: 'text', required: true },
      { name: 'event_type', label: 'Event Type', type: 'text' },
      { name: 'event_date', label: 'Event Date', type: 'date' },
      { name: 'start_time', label: 'Start Time', type: 'time' },
      { name: 'end_time', label: 'End Time', type: 'time' },
      { name: 'guest_count', label: 'Guest Count', type: 'number', min: '0', step: '1' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  menu: {
    title: 'Menu',
    subtitle: 'Link menu items to recipes and track selling price, cost, margin, and profit.',
    emptyTitle: 'No menu items yet.',
    emptyCopy: 'Add your first menu item once a recipe is ready.',
    action: 'New Menu Item',
    singular: 'menu item',
    plural: 'menu items',
    table: 'beoflow_menu_items',
    index: '02',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['category', 'sale_price', 'recipe_cost', 'cost_percentage', 'margin_percentage', 'profit', 'price_cost_ratio'],
    detailFields: ['recipe_name', 'notes'],
    fields: [
      { name: 'name', label: 'Item Name', type: 'text', required: true },
      { name: 'recipe_id', label: 'Linked Recipe', type: 'recipe-select' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'sale_price', label: 'Sale Price', type: 'number', min: '0', step: '0.01' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' }
    ]
  },
  recipes: {
    title: 'Recipes',
    subtitle: 'Standardize recipes, ingredients, procedures, and consistency.',
    emptyTitle: 'No recipes yet.',
    emptyCopy: 'Add your first recipe to begin building your recipe library.',
    action: 'New Recipe',
    singular: 'recipe',
    plural: 'recipes',
    table: 'beoflow_recipes',
    index: '03',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['recipe_number', 'category', 'pax', 'yield_quantity', 'yield_unit', 'prep_time', 'cook_time', 'total_cost', 'waste_cost', 'suggested_sale_price', 'manual_sale_price', 'cost_percentage', 'margin_percentage', 'profit'],
    detailFields: ['procedure', 'notes'],
    fields: [
      { name: 'name', label: 'Recipe Name', type: 'text', required: true, wide: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'recipe_number', label: 'Recipe Number', type: 'text' },
      { name: 'yield_quantity', label: 'Yield Quantity', type: 'number', min: '0', step: '0.01' },
      { name: 'yield_unit', label: 'Yield Unit', type: 'text', placeholder: 'portions, oz, trays' },
      { name: 'pax', label: 'Portions / Pax', type: 'number', min: '0', step: '0.01' },
      { name: 'prep_time', label: 'Prep Time', type: 'text', placeholder: '20 min' },
      { name: 'cook_time', label: 'Cook Time', type: 'text', placeholder: '35 min' },
      { name: 'photo_url', label: 'Recipe Photo', type: 'image-file', wide: true },
      { name: 'procedure', label: 'Procedure', type: 'textarea', wide: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' }
    ]
  },
  subrecipes: {
    title: 'Subrecipes',
    subtitle: 'Create reusable preparations such as sauces, bases, doughs, and garnishes.',
    emptyTitle: 'No subrecipes yet.',
    emptyCopy: 'Create reusable preparations manually when you are ready.',
    action: 'New Subrecipe',
    singular: 'subrecipe',
    plural: 'subrecipes',
    table: 'beoflow_subrecipes',
    index: '04',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['recipe_number', 'category', 'yield_quantity', 'yield_unit', 'total_cost', 'cost_per_yield_unit'],
    detailFields: ['procedure', 'notes'],
    fields: [
      { name: 'name', label: 'Subrecipe Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'recipe_number', label: 'Subrecipe Number', type: 'text', placeholder: 'Automatic', readonly: true },
      { name: 'yield_quantity', label: 'Yield / Rendimiento', type: 'number', min: '0', step: '0.01' },
      { name: 'yield_unit', label: 'Yield Unit', type: 'text', placeholder: 'portions, lb, oz, trays' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'procedure', label: 'Procedure', type: 'textarea', wide: true },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  inventory: {
    title: 'Inventory',
    subtitle: 'Register kitchen inputs by code, presentation, supplier, and cost.',
    emptyTitle: 'No inventory items yet.',
    emptyCopy: 'Add your first input to start building recipe costs.',
    action: 'New Ingredient',
    singular: 'inventory item',
    plural: 'inventory items',
    table: 'beoflow_inventory_items',
    index: '05',
    titleField: 'name',
    badgeField: 'status',
    metaFields: ['category', 'brand', 'base_unit', 'package_quantity', 'package_unit', 'package_price', 'cost_per_unit', 'supplier'],
    detailFields: ['current_stock', 'minimum_stock', 'notes'],
    fields: [
      { name: 'name', label: 'Name / Description', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'inventory-category-select' },
      { name: 'brand', label: 'Brand', type: 'text' },
      { name: 'base_unit', label: 'Base Unit', type: 'text', required: true, placeholder: 'oz, lb, each' },
      { name: 'package_quantity', label: 'Package Quantity', type: 'number', min: '0.01', step: '0.01' },
      { name: 'package_unit', label: 'Package Unit', type: 'text', placeholder: 'case, bag, bottle' },
      { name: 'package_price', label: 'Package Price', type: 'number', min: '0', step: '0.01' },
      { name: 'current_stock', label: 'Current Stock', type: 'number', step: '0.01' },
      { name: 'minimum_stock', label: 'Minimum Stock', type: 'number', step: '0.01' },
      { name: 'supplier', label: 'Supplier', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  production: {
    title: 'Production',
    subtitle: 'Organize prep tasks, production logs, and kitchen execution.',
    emptyTitle: 'No production records yet.',
    emptyCopy: 'Start a production log when operations begin.',
    action: 'New Production Plan',
    singular: 'production log',
    plural: 'production logs',
    table: 'beoflow_production_logs',
    index: '06',
    titleField: 'title',
    badgeField: 'status',
    metaFields: ['production_date', 'shift', 'assigned_to'],
    detailFields: ['notes'],
    fields: [
      { name: 'title', label: 'Log Title', type: 'text', required: true },
      { name: 'production_date', label: 'Production Date', type: 'date' },
      { name: 'shift', label: 'Shift', type: 'text' },
      { name: 'assigned_to', label: 'Assigned To', type: 'text' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  staff: {
    title: 'Staff',
    subtitle: 'Manage team members, roles, schedules, and responsibilities.',
    emptyTitle: 'No staff members yet.',
    emptyCopy: 'Add your first staff member or invite a user.',
    action: 'Add Staff Member',
    singular: 'staff member',
    plural: 'staff members',
    table: 'beoflow_staff',
    index: '07',
    titleField: 'full_name',
    badgeField: 'status',
    metaFields: ['role', 'email', 'phone'],
    detailFields: ['notes'],
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'status', label: 'Status', type: 'text', defaultValue: 'active' },
      { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
    ]
  },
  reports: {
    title: 'Reports',
    subtitle: 'View operational insights once Beoflow has activity.',
    emptyTitle: 'No reports yet.',
    emptyCopy: 'Reports will appear after events, inventory, and production activity.',
    action: 'View Reports',
    singular: 'report',
    plural: 'reports',
    table: null,
    index: '08'
  }
};

const DATA_SECTIONS = Object.keys(MODULE_SECTIONS).filter(section => MODULE_SECTIONS[section].table);

const MODULE_VISUALS = {
  dashboard: {
    icon: 'gauge',
    accent: '#2563eb',
    soft: 'rgba(37, 99, 235, 0.1)',
    copy: 'Live operating overview'
  },
  events: {
    icon: 'calendar',
    accent: '#0ea5e9',
    soft: 'rgba(14, 165, 233, 0.12)',
    copy: 'Service dates and guest counts'
  },
  menu: {
    icon: 'utensils',
    accent: '#f97316',
    soft: 'rgba(249, 115, 22, 0.12)',
    copy: 'Selling prices and margins'
  },
  recipes: {
    icon: 'book',
    accent: '#2563eb',
    soft: 'rgba(37, 99, 235, 0.1)',
    copy: 'Costed kitchen standards'
  },
  subrecipes: {
    icon: 'layers',
    accent: '#7c3aed',
    soft: 'rgba(124, 58, 237, 0.1)',
    copy: 'Reusable prep foundations'
  },
  inventory: {
    icon: 'package',
    accent: '#16a34a',
    soft: 'rgba(22, 163, 74, 0.12)',
    copy: 'Inputs, stock, and costs'
  },
  production: {
    icon: 'checklist',
    accent: '#0891b2',
    soft: 'rgba(8, 145, 178, 0.12)',
    copy: 'Prep plans and execution'
  },
  staff: {
    icon: 'users',
    accent: '#64748b',
    soft: 'rgba(100, 116, 139, 0.12)',
    copy: 'Team roles and contacts'
  },
  reports: {
    icon: 'barChart',
    accent: '#9333ea',
    soft: 'rgba(147, 51, 234, 0.1)',
    copy: 'Cost and margin signals'
  }
};

const INVENTORY_CATEGORY_VISUALS = [
  { keywords: ['subrecipe', 'subrecipes', 'preparation', 'preparations', 'prep'], icon: 'layers', className: 'category-subrecipe' },
  { keywords: ['produce', 'vegetable', 'vegetables', 'fruit', 'fruits', 'herb', 'lettuce', 'tomato'], icon: 'apple', className: 'category-produce' },
  { keywords: ['meat', 'beef', 'pork', 'protein'], icon: 'chefHat', className: 'category-protein' },
  { keywords: ['poultry', 'chicken', 'turkey'], icon: 'drumstick', className: 'category-protein' },
  { keywords: ['seafood', 'fish', 'shrimp', 'shellfish'], icon: 'fish', className: 'category-seafood' },
  { keywords: ['dairy', 'milk', 'cream', 'cheese', 'butter'], icon: 'milk', className: 'category-dairy' },
  { keywords: ['grain', 'grains', 'rice', 'pasta'], icon: 'wheat', className: 'category-dry' },
  { keywords: ['bakery', 'bread', 'dough'], icon: 'bread', className: 'category-dry' },
  { keywords: ['dry', 'goods', 'flour', 'spice', 'spices', 'seasoning', 'seasonings'], icon: 'box', className: 'category-dry' },
  { keywords: ['oil', 'oils', 'vinegar', 'vinegars'], icon: 'droplet', className: 'category-condiment' },
  { keywords: ['sauce', 'sauces', 'condiment', 'condiments'], icon: 'cup', className: 'category-condiment' },
  { keywords: ['beverage', 'beverages', 'drink', 'juice', 'wine', 'beer'], icon: 'cup', className: 'category-beverage' },
  { keywords: ['frozen', 'ice'], icon: 'snowflake', className: 'category-frozen' },
  { keywords: ['canned', 'can', 'cans'], icon: 'can', className: 'category-canned' },
  { keywords: ['cleaning', 'supply', 'supplies'], icon: 'spray', className: 'category-supplies' },
  { keywords: ['disposable', 'disposables'], icon: 'package', className: 'category-supplies' }
];

const INVENTORY_CATEGORY_OPTIONS = [
  'Fruits and Vegetables',
  'Dairy',
  'Meat',
  'Poultry',
  'Seafood',
  'Dry Goods',
  'Grains and Pasta',
  'Bakery',
  'Spices and Seasonings',
  'Oils and Vinegars',
  'Sauces and Condiments',
  'Beverages',
  'Frozen',
  'Canned Goods',
  'Cleaning Supplies',
  'Disposables',
  'Other'
];

const els = {};

function cacheElements() {
  [
    'auth-view',
    'auth-title',
    'auth-subtitle',
    'session-loading-view',
    'workspace-view',
    'config-alert',
    'auth-message',
    'auth-tabs',
    'auth-form',
    'auth-full-name',
    'auth-email',
    'auth-password',
    'auth-confirm-password',
    'auth-submit',
    'forgot-password-button',
    'password-reset-request-form',
    'reset-email',
    'reset-submit',
    'back-to-sign-in-button',
    'password-recovery-form',
    'new-password',
    'confirm-new-password',
    'update-password-submit',
    'full-name-field',
    'confirm-password-field',
    'show-sign-in',
    'show-sign-up',
    'workspace-header',
    'workspace-title',
    'workspace-subtitle',
    'workspace-message',
    'onboarding-view',
    'onboarding-step',
    'onboarding-title',
    'onboarding-description',
    'onboarding-message',
    'workspace-created-view',
    'workspace-created-description',
    'continue-dashboard-button',
    'client-selector-view',
    'dashboard-view',
    'client-form',
    'client-name',
    'client-type',
    'client-city',
    'client-state',
    'client-timezone',
    'create-client-button',
    'client-list',
    'selector-add-client-button',
    'dashboard-title',
    'dashboard-description',
    'operations-calendar',
    'workspace-control-name',
    'workspace-sidebar',
    'mobile-workspace-name',
    'mobile-menu-button',
    'mobile-drawer-overlay',
    'mobile-drawer-close',
    'mobile-switch-client-button',
    'mobile-add-restaurant-button',
    'mobile-workspace-settings-button',
    'mobile-sign-out-button',
    'module-view',
    'module-title',
    'module-subtitle',
    'module-count-badge',
    'module-header-action-button',
    'module-empty-state',
    'module-empty-icon',
    'module-empty-title',
    'module-empty-copy',
    'module-action-button',
    'module-record-list',
    'module-toast',
    'module-modal',
    'module-modal-title',
    'module-modal-subtitle',
    'module-modal-close',
    'module-form-message',
    'module-form',
    'module-form-fields',
    'module-cancel-button',
    'module-save-button',
    'switch-client-button',
    'add-restaurant-button',
    'workspace-settings-button',
    'workspace-switcher-modal',
    'workspace-switcher-list',
    'workspace-switcher-close',
    'workspace-switcher-add-button',
    'workspace-settings-modal',
    'workspace-settings-close',
    'workspace-settings-message',
    'workspace-settings-form',
    'workspace-settings-name',
    'workspace-settings-type',
    'workspace-settings-waste',
    'workspace-settings-factor',
    'workspace-settings-cancel',
    'workspace-settings-save',
    'sign-out-button'
  ].forEach(id => {
    els[id] = document.getElementById(id);
  });
}

function isMissingClientProdKey() {
  return !config.anonKey || missingAnonKeyValues.has(String(config.anonKey).trim());
}

function getProductionRedirectUrl() {
  return config.productionRedirectUrl || 'https://bastidasystems.com/beoflow-app.html';
}

function getAuthRedirectUrl() {
  const redirectOverride = new URLSearchParams(window.location.search).get('auth_redirect');
  if (redirectOverride === 'local') {
    return config.localRedirectUrl || window.location.href;
  }

  if (redirectOverride === 'production') {
    return getProductionRedirectUrl();
  }

  if (config.authRedirectMode === 'production') {
    return getProductionRedirectUrl();
  }

  const hostname = window.location.hostname || '';
  if (hostname.includes('localhost') || hostname === '127.0.0.1') {
    return config.localRedirectUrl || window.location.href;
  }

  return getProductionRedirectUrl();
}

function getEmailActionRedirectUrl() {
  const redirectOverride = new URLSearchParams(window.location.search).get('auth_redirect');
  if (redirectOverride === 'local') {
    return config.localRedirectUrl || window.location.href;
  }

  return getProductionRedirectUrl();
}

function getCombinedAuthParam(name) {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return searchParams.get(name) || hashParams.get(name);
}

function sanitizeAuthUrlPart(value) {
  if (!value) return '';

  const prefix = value.startsWith('#') ? '#' : value.startsWith('?') ? '?' : '';
  const params = new URLSearchParams(value.replace(/^[#?]/, ''));
  [
    'access_token',
    'refresh_token',
    'token',
    'token_hash',
    'code',
    'provider_token',
    'provider_refresh_token'
  ].forEach(key => {
    if (params.has(key)) params.set(key, '[redacted]');
  });

  const sanitized = params.toString();
  return sanitized ? `${prefix}${sanitized}` : prefix;
}

function getAuthUrlState() {
  const type = getCombinedAuthParam('type');
  const accessToken = getCombinedAuthParam('access_token');
  const refreshToken = getCombinedAuthParam('refresh_token');
  const code = getCombinedAuthParam('code');
  const error = getCombinedAuthParam('error');
  const errorDescription = getCombinedAuthParam('error_description');
  const hasTokenParams = Boolean(accessToken || refreshToken);
  const hasCode = Boolean(code);
  const hasError = Boolean(error || errorDescription);
  const hasAuthParams = Boolean(type || hasTokenParams || hasCode || hasError);
  const isRecovery = type === 'recovery' || (!type && (hasTokenParams || hasCode));

  return {
    type,
    accessToken,
    refreshToken,
    code,
    error,
    errorDescription,
    hasTokenParams,
    hasCode,
    hasError,
    hasAuthParams,
    isRecovery
  };
}

function logAuthUrlState() {
  console.log('[Beoflow Auth] URL hash/search detected', {
    hash: sanitizeAuthUrlPart(window.location.hash),
    search: sanitizeAuthUrlPart(window.location.search)
  });
}

function cleanAuthUrl() {
  if (!window.history?.replaceState) return;
  if (!window.location.search && !window.location.hash) return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

function showAlert(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('app-alert-success', type === 'success');
  if (message) applyLanguageToDocument(element);
}

function clearAlerts() {
  showAlert(els['auth-message'], '');
  showAlert(els['workspace-message'], '');
  showAlert(els['module-form-message'], '');
  showAlert(els['workspace-settings-message'], '');
  showAlert(els['onboarding-message'], '');
}

function setLoading(isLoading) {
  state.loading = isLoading;
  [
    els['auth-submit'],
    els['reset-submit'],
    els['update-password-submit'],
    els['create-client-button'],
    els['module-action-button'],
    els['module-header-action-button'],
    els['module-save-button'],
    els['module-cancel-button'],
    els['module-modal-close'],
    els['continue-dashboard-button'],
    els['selector-add-client-button'],
    els['sign-out-button'],
    els['switch-client-button'],
    els['add-restaurant-button'],
    els['workspace-settings-button'],
    els['mobile-switch-client-button'],
    els['mobile-add-restaurant-button'],
    els['mobile-workspace-settings-button'],
    els['mobile-sign-out-button'],
    els['workspace-switcher-close'],
    els['workspace-switcher-add-button'],
    els['workspace-settings-close'],
    els['workspace-settings-cancel'],
    els['workspace-settings-save']
  ].forEach(button => {
    if (button) button.disabled = isLoading;
  });
}

function formatClientType(value) {
  return String(value || 'client')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function renderIcon(name, extraClass = '') {
  const icons = {
    add: '<path d="M12 5v14M5 12h14"></path>',
    alert: '<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>',
    apple: '<path d="M12 6c-2.8 0-5 2.3-5 5.7C7 16.7 9.6 21 12 21s5-4.3 5-9.3C17 8.3 14.8 6 12 6Z"></path><path d="M12 6c0-2 1.5-3 3-3"></path><path d="M9.5 5.3C9 4.3 8.2 3.8 7 4"></path>',
    archive: '<path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1Z"></path><path d="M10 12h4"></path>',
    barChart: '<path d="M3 3v18h18"></path><path d="M7 16V9"></path><path d="M12 16V5"></path><path d="M17 16v-3"></path>',
    box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"></path><path d="M3 8v8l9 5 9-5V8"></path><path d="M12 13v8"></path>',
    bread: '<path d="M4 11a8 8 0 0 1 16 0v8H4v-8Z"></path><path d="M8 19v-5"></path><path d="M12 19v-6"></path><path d="M16 19v-5"></path>',
    calendar: '<path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M3 10h18"></path><path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"></path>',
    can: '<ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5"></path><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"></path>',
    check: '<path d="m4 12 5 5L20 6"></path>',
    checklist: '<path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path><path d="m3 6 1 1 2-2"></path><path d="m3 12 1 1 2-2"></path><path d="m3 18 1 1 2-2"></path>',
    chefHat: '<path d="M6 13.9V21h12v-7.1"></path><path d="M6.1 14A4 4 0 0 1 8 6.5 4.5 4.5 0 0 1 16 6.5 4 4 0 0 1 17.9 14"></path><path d="M8 17h8"></path>',
    chevronLeft: '<path d="m15 18-6-6 6-6"></path>',
    chevronRight: '<path d="m9 18 6-6-6-6"></path>',
    circle: '<circle cx="12" cy="12" r="4"></circle>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    close: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    cup: '<path d="M4 5h12v8a6 6 0 0 1-12 0V5Z"></path><path d="M16 8h2a3 3 0 0 1 0 6h-2"></path><path d="M3 21h18"></path>',
    droplet: '<path d="M12 2.5 6.5 9A7 7 0 1 0 17.5 9L12 2.5Z"></path>',
    drumstick: '<path d="M15.5 5.5a5.5 5.5 0 0 1 0 7.8l-4.2 4.2a2.2 2.2 0 0 1-3.1 0l-1.4-1.4a2.2 2.2 0 0 1 0-3.1l4.2-4.2"></path><path d="M17 4a3 3 0 0 1 4 4"></path><path d="M18.5 8.5 21 11"></path>',
    fish: '<path d="M3 12s4-6 10-6 8 6 8 6-2 6-8 6-10-6-10-6Z"></path><path d="m3 12-2-3v6l2-3Z"></path><path d="M16 12h.01"></path>',
    gauge: '<path d="M4 19a8 8 0 1 1 16 0"></path><path d="M12 14l4-4"></path><path d="M12 19h.01"></path>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8.5" cy="10.5" r="1.5"></circle><path d="m21 15-5-5L5 19"></path>',
    leaf: '<path d="M5 21c8-1 15-8 16-16-8 1-15 8-16 16Z"></path><path d="M5 21c0-5 4-9 9-9"></path>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"></path><path d="m3 12 9 5 9-5"></path><path d="m3 17 9 5 9-5"></path>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-17A2.5 2.5 0 0 1 6.5 2Z"></path>',
    milk: '<path d="M8 2h8l1 4v16H7V6l1-4Z"></path><path d="M7 6h10"></path><path d="M9 10h6"></path><path d="M10 14h4"></path>',
    package: '<path d="M16.5 9.4 7.5 4.2"></path><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"></path><path d="M3.3 7 12 12l8.7-5"></path><path d="M12 22V12"></path>',
    packageAdd: '<path d="M16.5 9.4 7.5 4.2"></path><path d="M21 12V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l1.5-.86"></path><path d="M3.3 7 12 12l8.7-5"></path><path d="M12 22V12"></path><path d="M18 14v6"></path><path d="M15 17h6"></path>',
    pencil: '<path d="m16 3 5 5L8 21H3v-5L16 3Z"></path><path d="m14 5 5 5"></path>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"></path><path d="M17 21v-8H7v8"></path><path d="M7 3v5h8"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
    snowflake: '<path d="M12 2v20"></path><path d="m4.9 4.9 14.2 14.2"></path><path d="m19.1 4.9-14.2 14.2"></path><path d="M2 12h20"></path>',
    spray: '<path d="M9 2h6v4H9Z"></path><path d="M12 6v3"></path><path d="M8 9h8l1 12H7L8 9Z"></path><path d="M18 11h3"></path><path d="M19 15h2"></path>',
    tag: '<path d="M20.6 13.2 13.2 20.6a2 2 0 0 1-2.8 0L3 13.2V3h10.2l7.4 7.4a2 2 0 0 1 0 2.8Z"></path><path d="M7.5 7.5h.01"></path>',
    trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    utensils: '<path d="M4 2v8"></path><path d="M7 2v8"></path><path d="M4 6h3"></path><path d="M5.5 10v12"></path><path d="M19 2v20"></path><path d="M15 2v8a4 4 0 0 0 4 4"></path>',
    wheat: '<path d="M12 2v20"></path><path d="M12 6c-3 0-5-2-5-4 3 0 5 2 5 4Z"></path><path d="M12 10c-3 0-5-2-5-4 3 0 5 2 5 4Z"></path><path d="M12 14c-3 0-5-2-5-4 3 0 5 2 5 4Z"></path><path d="M12 18c3 0 5-2 5-4-3 0-5 2-5 4Z"></path>'
  };
  const body = icons[name] || icons.box;
  const classAttr = extraClass ? ` ${extraClass}` : '';
  return `<svg class="ui-icon${classAttr}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

function renderIconLabel(iconName, label, extraClass = '') {
  return `${renderIcon(iconName, extraClass)}<span>${escapeHtml(label)}</span>`;
}

function getModuleVisual(section) {
  return MODULE_VISUALS[section] || MODULE_VISUALS.dashboard;
}

function getInventoryCategoryVisual(recordOrCategory) {
  const category = typeof recordOrCategory === 'string'
    ? recordOrCategory
    : recordOrCategory?.category;
  const normalized = String(category || '').toLowerCase();
  const match = INVENTORY_CATEGORY_VISUALS.find(visual => (
    visual.keywords.some(keyword => normalized.includes(keyword))
  ));
  return match || { icon: 'box', className: 'category-other' };
}

function setElementModuleVisual(element, section) {
  if (!element) return;
  const visual = getModuleVisual(section);
  element.dataset.moduleVisual = section;
  element.style.setProperty('--module-accent', visual.accent);
  element.style.setProperty('--module-accent-soft', visual.soft);
}

function getModuleActionIcon(section) {
  if (section === 'inventory') return 'packageAdd';
  if (section === 'reports') return 'barChart';
  if (section === 'production') return 'checklist';
  return 'add';
}

function decorateStaticModuleControls() {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(button => {
    const section = button.dataset.section;
    const moduleConfig = MODULE_SECTIONS[section];
    if (!moduleConfig) return;

    setElementModuleVisual(button, section);
    if (button.dataset.visualReady === 'true') return;
    button.innerHTML = renderIconLabel(getModuleVisual(section).icon, moduleConfig.title);
    button.dataset.visualReady = 'true';
  });

  document.querySelectorAll('.module-card[data-section]').forEach(card => {
    const section = card.dataset.section;
    const moduleConfig = MODULE_SECTIONS[section];
    const visual = getModuleVisual(section);
    if (!moduleConfig) return;

    setElementModuleVisual(card, section);
    const count = card.querySelector('[data-count-section]')?.textContent || '0';
    const copy = visual.copy || moduleConfig.subtitle;
    card.innerHTML = `
      <span class="module-card-icon">${renderIcon(visual.icon)}</span>
      <span class="module-card-label">${escapeHtml(moduleConfig.title)}</span>
      <strong data-count-section="${escapeHtml(section)}">${escapeHtml(count)}</strong>
      <p>${escapeHtml(copy)}</p>
    `;
  });
}

function renderRecordStateBadges(section, record) {
  const badges = [];

  if (section === 'inventory') {
    if (isLowStock(record)) badges.push({ label: 'Low Stock', icon: 'alert', className: 'status-badge-warning' });
    if (!Number(getInventoryPackagePrice(record))) badges.push({ label: 'No Price', icon: 'alert', className: 'status-badge-danger' });
    if (!Number(getInventoryPackageQuantity(record))) badges.push({ label: 'No Pack', icon: 'box', className: 'status-badge-muted' });
  }

  if (isCostingRecipeSection(section)) {
    const ingredients = normalizeRecipeIngredients(record.ingredients);
    const missingCount = ingredients.filter(ingredient => !getIngredientInventoryStatus(ingredient).connected).length;
    if (missingCount > 0) {
      badges.push({ label: `${missingCount} missing`, icon: 'alert', className: 'status-badge-warning' });
    } else if (ingredients.length > 0) {
      badges.push({ label: 'Costed', icon: 'check', className: 'status-badge-success' });
    }
  }

  if (section === 'menu') {
    const margin = Number(record.margin_percentage);
    if (Number.isFinite(margin)) {
      const className = margin >= 60 ? 'status-badge-success' : margin >= 35 ? 'status-badge-warning' : 'status-badge-danger';
      badges.push({ label: `${Math.round(margin)}% margin`, icon: margin >= 60 ? 'check' : 'alert', className });
    }
  }

  return badges
    .map(badge => `<span class="status-badge ${badge.className}">${renderIconLabel(badge.icon, badge.label)}</span>`)
    .join('');
}

function createCalendarDate(year, monthIndex, day) {
  const date = new Date(year, monthIndex, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTodayDateKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return createCalendarDate(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const textValue = String(value);
  const match = textValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return createCalendarDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const parsedDate = new Date(textValue);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return createCalendarDate(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
}

function formatCalendarMonth(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

function formatCalendarDayHeading(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return 'Selected day';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTimeLabel(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatMoney(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '';

  return numberValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

function formatRecordValue(fieldName, value) {
  if (value === null || value === undefined || value === '') return '';

  if (
    fieldName === 'price'
    || fieldName === 'sale_price'
    || fieldName === 'manual_sale_price'
    || fieldName === 'package_price'
    || fieldName === 'cost_per_unit'
    || fieldName === 'total_ingredient_cost'
    || fieldName === 'total_cost'
    || fieldName === 'waste_cost'
    || fieldName === 'unit_cost_total'
    || fieldName === 'food_factor_total'
    || fieldName === 'suggested_sale_price'
    || fieldName === 'recipe_cost'
    || fieldName === 'cost_per_yield_unit'
    || fieldName === 'cost_per_portion'
    || fieldName === 'profit'
  ) {
    return formatMoney(value);
  }

  if (
    fieldName === 'cost_percentage'
    || fieldName === 'margin_percentage'
    || fieldName === 'waste_percentage'
  ) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '';
    return `${(numberValue * 100).toFixed(1)}%`;
  }

  if (fieldName === 'food_factor') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toFixed(2) : '';
  }

  if (fieldName === 'price_cost_ratio') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? `${numberValue.toFixed(2)}x` : '';
  }

  if (fieldName === 'guest_count') {
    return `${value} guests`;
  }

  if (fieldName === 'minimum_stock') {
    return `Minimum ${value}`;
  }

  if (fieldName === 'current_stock') {
    return `Stock ${value}`;
  }

  if (fieldName === 'package_quantity') {
    return `Package qty ${value}`;
  }

  if (fieldName === 'pax') {
    return `${value} pax`;
  }

  if (fieldName === 'yield_quantity') {
    return `Yield ${value}`;
  }

  if (fieldName === 'prep_time' || fieldName === 'cook_time') {
    return String(value);
  }

  if (fieldName.endsWith('_date') || fieldName === 'event_date') {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  if (fieldName === 'status') {
    return formatLabel(value);
  }

  return String(value);
}

function getRecordTitle(section, record) {
  const moduleConfig = MODULE_SECTIONS[section];
  if (!moduleConfig) return 'Record';
  return record?.[moduleConfig.titleField] || moduleConfig.title;
}

function getActiveClientId() {
  return requireActiveClient()?.id || null;
}

function requireSupabaseClient() {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');
  return supabase;
}

function requireSignedInUserId() {
  if (!state.user?.id) throw new Error('Sign in before managing Beoflow records.');
  return state.user.id;
}

function getModuleConfig(section) {
  const moduleConfig = MODULE_SECTIONS[section];
  if (!moduleConfig) throw new Error('Unknown Beoflow module.');
  return moduleConfig;
}

function isCostingRecipeSection(section) {
  return section === 'recipes' || section === 'subrecipes';
}

function withActiveRecordFilter(query) {
  return query.neq('status', 'archived');
}

function normalizePayloadValue(field, value) {
  if (value === '') return null;
  if (field.type === 'number') {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
  return value;
}

function getInventoryCurrentStock(record) {
  return record?.current_stock ?? record?.currentStock ?? record?.quantity ?? null;
}

function getInventoryMinimumStock(record) {
  return record?.minimum_stock ?? record?.minimumStock ?? record?.par_level ?? null;
}

function getInventorySupplier(record) {
  return record?.supplier ?? record?.vendor ?? '';
}

function getInventoryBaseUnit(record) {
  return record?.base_unit ?? record?.unit ?? '';
}

function getInventoryPackageQuantity(record) {
  return record?.package_quantity ?? record?.quantity_per_package ?? null;
}

function getInventoryPackagePrice(record) {
  if (record && Object.prototype.hasOwnProperty.call(record, 'package_price')) {
    return record.package_price;
  }
  return record?.price_per_package ?? record?.cost_per_unit ?? null;
}

function getInventoryPackageUnit(record) {
  return record?.package_unit ?? record?.presentation_unit ?? '';
}

function calculateInventoryUnitCost(recordOrPayload) {
  const packageQuantity = Number(getInventoryPackageQuantity(recordOrPayload));
  const packagePrice = Number(getInventoryPackagePrice(recordOrPayload));
  if (!Number.isFinite(packageQuantity) || packageQuantity <= 0) return null;
  if (!Number.isFinite(packagePrice)) return null;
  return Number((packagePrice / packageQuantity).toFixed(6));
}

function getWorkspaceWastePercentage() {
  const value = Number(state.activeClient?.beoflow_waste_percentage);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_WASTE_PERCENTAGE;
}

function getWorkspaceFoodFactor() {
  const value = Number(state.activeClient?.beoflow_food_factor);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_FOOD_FACTOR;
}

function normalizeIngredientNameForMatch(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => {
      if (word.endsWith('oes') && word.length > 4) return word.slice(0, -2);
      if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
      if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
      if (word.endsWith('s') && word.length > 3) return word.slice(0, -1);
      return word;
    })
    .join(' ');
}

function normalizeInventoryCode(value) {
  return String(value || '').trim().toUpperCase();
}

function findMatchingInventoryIngredient(name, excludeId = null) {
  const normalizedName = normalizeIngredientNameForMatch(name);
  if (!normalizedName) return null;

  return getInventoryOptions().find(item => (
    String(item.id) !== String(excludeId || '')
    && normalizeIngredientNameForMatch(item.name) === normalizedName
  )) || null;
}

function findInventoryIngredientByCode(code, excludeId = null) {
  const normalizedCode = normalizeInventoryCode(code);
  if (!normalizedCode) return null;

  return getInventoryOptions().find(item => (
    String(item.id) !== String(excludeId || '')
    && normalizeInventoryCode(item.item_code) === normalizedCode
  )) || null;
}

function getSubrecipeNumberIndex(value) {
  const match = String(value || '').match(/(\d+)/);
  if (!match) return 0;
  const index = Number(match[1]);
  return Number.isFinite(index) ? index : 0;
}

function formatSubrecipeNumber(index) {
  const safeIndex = Number.isFinite(Number(index)) && Number(index) > 0 ? Number(index) : 1;
  return `Subrecipe ${String(safeIndex).padStart(3, '0')}`;
}

function getNextSubrecipeNumberFromRecords(records = state.moduleRecords.subrecipes || []) {
  const maxIndex = (records || []).reduce((max, record) => {
    const index = getSubrecipeNumberIndex(record?.recipe_number);
    return index > max ? index : max;
  }, 0);
  return formatSubrecipeNumber(maxIndex + 1);
}

async function getNextSubrecipeNumber() {
  const clientId = getActiveClientId();
  if (!clientId || !state.supabase) return getNextSubrecipeNumberFromRecords();

  const { data, error } = await requireSupabaseClient()
    .from(MODULE_SECTIONS.subrecipes.table)
    .select('recipe_number')
    .eq('client_id', clientId);

  if (error) return getNextSubrecipeNumberFromRecords();
  return getNextSubrecipeNumberFromRecords(data || []);
}

function getSubrecipeFormRecord(record = null) {
  if (record?.id) {
    return {
      ...record,
      recipe_number: record.recipe_number || getNextSubrecipeNumberFromRecords()
    };
  }

  return {
    ...(record || {}),
    recipe_number: getNextSubrecipeNumberFromRecords()
  };
}

function getInventoryIconName(recordOrCategory) {
  return getInventoryCategoryVisual(recordOrCategory).icon;
}

function getInventorySummaryLabel(record) {
  return [record?.category, getInventorySupplier(record)].filter(Boolean).join(' / ') || 'Inventory item';
}

function getInventoryHelperLabel(record) {
  return record?.category || getInventoryBaseUnit(record) || getInventorySupplier(record) || 'Inventory item';
}

function getIngredientInventoryStatus(ingredient) {
  const normalized = normalizeRecipeIngredient(ingredient);
  if (!normalized) return { connected: false, label: 'Not in inventory', icon: 'alert', className: 'is-missing' };
  if (normalized.itemType === 'subrecipe') {
    return { connected: Boolean(normalized.subrecipeId), label: 'Subrecipe', icon: 'box', className: 'is-subrecipe' };
  }

  const byId = normalized.inventoryItemId
    ? getInventoryOptions().find(item => String(item.id) === String(normalized.inventoryItemId))
    : null;
  const byName = byId || findMatchingInventoryIngredient(normalized.ingredientName);
  const byCode = byName || findInventoryIngredientByCode(normalized.itemCode);
  const matchedItem = byId || byName || byCode;
  if (matchedItem) {
    return { connected: true, label: 'In inventory', icon: 'check', className: 'is-connected', item: matchedItem };
  }

  return { connected: false, label: 'Not in inventory', icon: 'alert', className: 'is-missing' };
}

function requireNonNegativeNumber(value, label, { allowNull = true } = {}) {
  if (value === null || value === undefined || value === '') {
    if (allowNull) return null;
    throw new Error(`${label} is required.`);
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) throw new Error(`${label} must be a valid number.`);
  if (numberValue < 0) throw new Error(`${label} cannot be negative.`);
  return numberValue;
}

function isLowStock(record) {
  const quantity = Number(getInventoryCurrentStock(record));
  const parLevel = Number(getInventoryMinimumStock(record));
  return Number.isFinite(quantity) && Number.isFinite(parLevel) && quantity <= parLevel;
}

function normalizeRecipeIngredients(rawIngredients) {
  if (!rawIngredients) return [];

  if (Array.isArray(rawIngredients)) {
    return rawIngredients.map(normalizeRecipeIngredient).filter(Boolean);
  }

  if (typeof rawIngredients === 'string') {
    try {
      const parsed = JSON.parse(rawIngredients);
      return normalizeRecipeIngredients(parsed);
    } catch {
      return rawIngredients
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((ingredientName, index) => normalizeRecipeIngredient({
          inventoryItemId: `legacy-${index}`,
          ingredientName,
          quantity: 0,
          unit: '',
          costPerUnit: 0
        }));
    }
  }

  return [];
}

function normalizeRecipeIngredient(ingredient) {
  if (!ingredient || typeof ingredient !== 'object') return null;
  const itemType = ingredient.itemType || ingredient.item_type || 'inventory';
  const inventoryItemId = ingredient.inventoryItemId || ingredient.inventory_item_id || '';
  const subrecipeId = ingredient.subrecipeId || ingredient.subrecipe_id || '';
  const itemCode = normalizeInventoryCode(ingredient.itemCode || ingredient.item_code || ingredient.code || '');
  const ingredientName = ingredient.ingredientName || ingredient.ingredient_name || ingredient.name || '';
  const quantity = Number(ingredient.quantity || 0);
  const packagePrice = Number(ingredient.packagePrice ?? ingredient.package_price ?? ingredient.pricePresentation ?? ingredient.price_presentation ?? ingredient.costPerUnit ?? ingredient.cost_per_unit ?? 0);
  const packageQuantity = Number(ingredient.packageQuantity ?? ingredient.package_quantity ?? ingredient.quantityPresentation ?? ingredient.quantity_presentation ?? 1);
  const costPerUnit = Number.isFinite(packageQuantity) && packageQuantity > 0 && Number.isFinite(packagePrice)
    ? packagePrice / packageQuantity
    : Number(ingredient.costPerUnit ?? ingredient.cost_per_unit ?? 0);
  const formulaLineCost = Number.isFinite(quantity)
    && quantity >= 0
    && Number.isFinite(packagePrice)
    && Number.isFinite(packageQuantity)
    && packageQuantity > 0
    ? (quantity * packagePrice) / packageQuantity
    : null;
  const fallbackLineCost = Number(ingredient.lineCost ?? ingredient.line_cost ?? ingredient.totalCost ?? ingredient.total_cost);
  const lineCost = Number.isFinite(formulaLineCost)
    ? formulaLineCost
    : Number.isFinite(fallbackLineCost)
      ? fallbackLineCost
      : quantity * costPerUnit;

  return {
    itemType,
    inventoryItemId,
    subrecipeId,
    itemCode,
    ingredientName,
    quantity: Number.isFinite(quantity) ? quantity : 0,
    unit: ingredient.unit || '',
    ounces: Number.isFinite(Number(ingredient.ounces)) ? Number(ingredient.ounces) : null,
    packagePrice: Number.isFinite(packagePrice) ? packagePrice : null,
    packageQuantity: Number.isFinite(packageQuantity) ? packageQuantity : null,
    packageUnit: ingredient.packageUnit || ingredient.package_unit || '',
    costPerUnit: Number.isFinite(costPerUnit) ? Number(costPerUnit.toFixed(6)) : 0,
    lineCost: Number.isFinite(lineCost) ? Number(lineCost.toFixed(4)) : 0,
    totalCost: Number.isFinite(lineCost) ? Number(lineCost.toFixed(4)) : 0,
    validationStatus: ingredient.validationStatus || ingredient.validation_status || 'valid'
  };
}

function createRecipeIngredientFromInventory(item, quantity = 1) {
  const normalizedQuantity = Number(quantity);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 0) {
    throw new Error('Ingredient quantity cannot be negative.');
  }

  const safeQuantity = normalizedQuantity > 0 ? normalizedQuantity : 1;
  const costPerUnit = calculateInventoryUnitCost(item) ?? 0;
  const packagePrice = Number(getInventoryPackagePrice(item));
  const packageQuantity = Number(getInventoryPackageQuantity(item));

  return normalizeRecipeIngredient({
    itemType: 'inventory',
    inventoryItemId: item?.id,
    ingredientName: item?.name,
    quantity: safeQuantity,
    unit: getInventoryBaseUnit(item),
    packagePrice: Number.isFinite(packagePrice) ? packagePrice : null,
    packageQuantity: Number.isFinite(packageQuantity) ? packageQuantity : null,
    packageUnit: getInventoryPackageUnit(item),
    costPerUnit: Number.isFinite(costPerUnit) ? costPerUnit : 0,
    validationStatus: validateInventoryIngredientForRecipe(item, safeQuantity).status
  });
}

function createRecipeIngredientFromSubrecipe(subrecipe, quantity = 1) {
  const normalizedQuantity = Number(quantity);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 0) {
    throw new Error('Subrecipe quantity cannot be negative.');
  }

  const safeQuantity = normalizedQuantity > 0 ? normalizedQuantity : 1;
  const packagePrice = Number(subrecipe?.unit_cost_total ?? subrecipe?.total_cost ?? subrecipe?.total_ingredient_cost ?? 0);
  const packageQuantity = Number(subrecipe?.yield_quantity || 1);
  const packageUnit = subrecipe?.yield_unit || 'batch';

  return normalizeRecipeIngredient({
    itemType: 'subrecipe',
    subrecipeId: subrecipe?.id,
    itemCode: subrecipe?.recipe_number || '',
    ingredientName: subrecipe?.name,
    quantity: safeQuantity,
    unit: packageUnit,
    packagePrice: Number.isFinite(packagePrice) ? packagePrice : 0,
    packageQuantity: Number.isFinite(packageQuantity) && packageQuantity > 0 ? packageQuantity : 1,
    packageUnit,
    validationStatus: packagePrice > 0 ? 'valid' : 'subrecipe_cost_zero'
  });
}

function validateInventoryIngredientForRecipe(item, quantity = 0) {
  if (!item) return { status: 'not_found', message: 'Ingredient not found.' };
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 0) {
    return { status: 'invalid_quantity', message: 'Quantity cannot be negative.' };
  }

  const packageQuantity = Number(getInventoryPackageQuantity(item));
  const packagePrice = Number(getInventoryPackagePrice(item));

  if (!Number.isFinite(packageQuantity) || packageQuantity <= 0) {
    return { status: 'critical_missing_presentation', message: 'Missing or invalid package quantity.' };
  }

  if (!Number.isFinite(packagePrice)) {
    return { status: 'missing_price', message: 'Missing package price.' };
  }

  return { status: 'valid', message: 'Ready to calculate.' };
}

function calculateLineCostFromIngredient(ingredient) {
  const quantity = Number(ingredient.quantity || 0);
  const packagePrice = Number(ingredient.packagePrice ?? ingredient.package_price);
  const packageQuantity = Number(ingredient.packageQuantity ?? ingredient.package_quantity);

  if (!Number.isFinite(quantity) || quantity < 0) return 0;
  if (!Number.isFinite(packagePrice)) return 0;
  if (!Number.isFinite(packageQuantity) || packageQuantity <= 0) return 0;

  return Number(((quantity * packagePrice) / packageQuantity).toFixed(4));
}

function calculateRecipeCosts(ingredients, yieldQuantity, yieldUnit, portionCount, manualSalePrice = null) {
  const normalizedIngredients = normalizeRecipeIngredients(ingredients);
  const totalIngredientCost = normalizedIngredients.reduce((total, ingredient) => (
    total + calculateLineCostFromIngredient(ingredient)
  ), 0);
  const normalizedYieldQuantity = Number(yieldQuantity);
  const normalizedPortionCount = Number(portionCount);
  const yieldLooksLikePortions = /portion|serving|plate/i.test(String(yieldUnit || ''));
  const wastePercentage = getWorkspaceWastePercentage();
  const foodFactor = getWorkspaceFoodFactor();
  const wasteCost = totalIngredientCost * wastePercentage;
  const unitCostTotal = totalIngredientCost + wasteCost;
  const suggestedSalePrice = unitCostTotal * foodFactor;
  const normalizedManualSalePrice = Number(manualSalePrice);
  const finalSalePrice = Number.isFinite(normalizedManualSalePrice) && normalizedManualSalePrice > 0
    ? normalizedManualSalePrice
    : suggestedSalePrice;
  const portionDivisor = Number.isFinite(normalizedPortionCount) && normalizedPortionCount > 0
    ? normalizedPortionCount
    : yieldLooksLikePortions && Number.isFinite(normalizedYieldQuantity) && normalizedYieldQuantity > 0
      ? normalizedYieldQuantity
      : 0;
  const costPercentage = finalSalePrice > 0 ? totalIngredientCost / finalSalePrice : null;
  const marginPercentage = finalSalePrice > 0 ? (finalSalePrice - totalIngredientCost) / finalSalePrice : null;
  const profit = finalSalePrice > 0 ? finalSalePrice - totalIngredientCost : null;
  const priceCostRatio = finalSalePrice > 0 && totalIngredientCost > 0 ? finalSalePrice / totalIngredientCost : null;

  return {
    total_cost: Number(totalIngredientCost.toFixed(4)),
    total_ingredient_cost: Number(totalIngredientCost.toFixed(4)),
    waste_percentage: wastePercentage,
    waste_cost: Number(wasteCost.toFixed(4)),
    unit_cost_total: Number(unitCostTotal.toFixed(4)),
    food_factor: foodFactor,
    food_factor_total: Number(suggestedSalePrice.toFixed(4)),
    suggested_sale_price: Number(suggestedSalePrice.toFixed(4)),
    final_sale_price: Number(finalSalePrice.toFixed(4)),
    cost_percentage: costPercentage === null ? null : Number(costPercentage.toFixed(4)),
    margin_percentage: marginPercentage === null ? null : Number(marginPercentage.toFixed(4)),
    profit: profit === null ? null : Number(profit.toFixed(4)),
    price_cost_ratio: priceCostRatio === null ? null : Number(priceCostRatio.toFixed(4)),
    cost_per_yield_unit: Number.isFinite(normalizedYieldQuantity) && normalizedYieldQuantity > 0
      ? Number((unitCostTotal / normalizedYieldQuantity).toFixed(4))
      : null,
    cost_per_portion: portionDivisor > 0
      ? Number((unitCostTotal / portionDivisor).toFixed(4))
      : null
  };
}

function refreshIngredientFromSource(ingredient) {
  const normalized = normalizeRecipeIngredient(ingredient);
  if (!normalized) return null;

  if (normalized.itemType === 'subrecipe') {
    const subrecipe = (state.moduleRecords.subrecipes || []).find(row => (
      String(row.id) === String(normalized.subrecipeId)
    ));
    if (!subrecipe) {
      return normalizeRecipeIngredient({
        ...normalized,
        validationStatus: 'subrecipe_not_found'
      });
    }

    return normalizeRecipeIngredient({
      ...createRecipeIngredientFromSubrecipe(subrecipe, normalized.quantity),
      unit: normalized.unit || subrecipe.yield_unit || 'batch'
    });
  }

  const inventoryItem = (state.moduleRecords.inventory || []).find(row => (
    String(row.id) === String(normalized.inventoryItemId)
    || normalizeInventoryCode(row.item_code) === normalizeInventoryCode(normalized.itemCode)
  )) || findMatchingInventoryIngredient(normalized.ingredientName);
  if (!inventoryItem) {
    return normalizeRecipeIngredient({
      ...normalized,
      validationStatus: 'not_found'
    });
  }

  return normalizeRecipeIngredient({
    ...createRecipeIngredientFromInventory(inventoryItem, normalized.quantity),
    unit: normalized.unit || getInventoryBaseUnit(inventoryItem)
  });
}

function normalizeRecipeIngredientsForStorage(ingredients) {
  return normalizeRecipeIngredients(ingredients)
    .map(refreshIngredientFromSource)
    .filter(Boolean)
    .map(ingredient => normalizeRecipeIngredient({
      ...ingredient,
      lineCost: calculateLineCostFromIngredient(ingredient),
      totalCost: calculateLineCostFromIngredient(ingredient)
    }));
}

function calculateRecipeCostFields(source, ingredients) {
  const normalizedIngredients = normalizeRecipeIngredientsForStorage(ingredients);
  const costs = calculateRecipeCosts(
    normalizedIngredients,
    source?.yield_quantity,
    source?.yield_unit,
    source?.pax ?? source?.portion_count,
    source?.manual_sale_price
  );

  return {
    ingredients: normalizedIngredients,
    total_cost: costs.total_cost,
    total_ingredient_cost: costs.total_ingredient_cost,
    waste_percentage: costs.waste_percentage,
    waste_cost: costs.waste_cost,
    unit_cost_total: costs.unit_cost_total,
    food_factor: costs.food_factor,
    food_factor_total: costs.food_factor_total,
    suggested_sale_price: costs.suggested_sale_price,
    final_sale_price: costs.final_sale_price,
    cost_percentage: costs.cost_percentage,
    margin_percentage: costs.margin_percentage,
    profit: costs.profit,
    price_cost_ratio: costs.price_cost_ratio,
    cost_per_yield_unit: costs.cost_per_yield_unit,
    cost_per_portion: costs.cost_per_portion
  };
}

function getRecipeCostForMenu(recipe) {
  const recipeCost = Number(recipe?.total_cost ?? recipe?.total_ingredient_cost ?? 0);
  return Number.isFinite(recipeCost) ? recipeCost : 0;
}

function buildMenuCostFields(recipe, salePrice) {
  const recipeCost = recipe ? getRecipeCostForMenu(recipe) : null;
  const normalizedSalePrice = Number(salePrice);
  const hasSalePrice = Number.isFinite(normalizedSalePrice) && normalizedSalePrice > 0;
  const hasRecipeCost = Number.isFinite(recipeCost) && recipeCost > 0;

  return {
    recipe_name: recipe?.name || null,
    recipe_cost: recipeCost,
    suggested_sale_price: recipe?.suggested_sale_price ?? recipe?.final_sale_price ?? null,
    cost_percentage: hasSalePrice && hasRecipeCost ? Number((recipeCost / normalizedSalePrice).toFixed(4)) : null,
    margin_percentage: hasSalePrice && hasRecipeCost ? Number(((normalizedSalePrice - recipeCost) / normalizedSalePrice).toFixed(4)) : null,
    profit: hasSalePrice && Number.isFinite(recipeCost) ? Number((normalizedSalePrice - recipeCost).toFixed(4)) : null,
    price_cost_ratio: hasSalePrice && hasRecipeCost ? Number((normalizedSalePrice / recipeCost).toFixed(4)) : null
  };
}

function getRecipesUsingInventoryItem(inventoryItemId) {
  const inventoryItem = getRecordById('inventory', inventoryItemId);
  const itemCode = normalizeInventoryCode(inventoryItem?.item_code);
  return (state.moduleRecords.recipes || []).filter(recipe => (
    normalizeRecipeIngredients(recipe.ingredients)
      .some(ingredient => (
        String(ingredient.inventoryItemId) === String(inventoryItemId)
        || (itemCode && normalizeInventoryCode(ingredient.itemCode) === itemCode)
      ))
  ));
}

function getSubrecipesUsingInventoryItem(inventoryItemId) {
  const inventoryItem = getRecordById('inventory', inventoryItemId);
  const itemCode = normalizeInventoryCode(inventoryItem?.item_code);
  return (state.moduleRecords.subrecipes || []).filter(subrecipe => (
    normalizeRecipeIngredients(subrecipe.ingredients)
      .some(ingredient => (
        String(ingredient.inventoryItemId) === String(inventoryItemId)
        || (itemCode && normalizeInventoryCode(ingredient.itemCode) === itemCode)
      ))
  ));
}

async function countTableRecords(table) {
  const clientId = getActiveClientId();
  if (!clientId) return 0;

  const { count, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
  );

  if (error) throw error;
  return count || 0;
}

async function loadDashboardCounts() {
  const counts = {};

  await Promise.all(DATA_SECTIONS.map(async section => {
    counts[section] = await countTableRecords(MODULE_SECTIONS[section].table);
  }));

  const reportSourceTotal = DATA_SECTIONS.reduce((total, section) => total + (counts[section] || 0), 0);
  counts.reports = reportSourceTotal;
  state.moduleCounts = counts;
  return counts;
}

async function loadDashboardEvents() {
  const clientId = getActiveClientId();
  if (!clientId) {
    state.dashboardEvents = [];
    return [];
  }

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(MODULE_SECTIONS.events.table)
      .select('*')
      .eq('client_id', clientId)
  )
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw error;

  state.dashboardEvents = data || [];
  state.moduleRecords.events = state.dashboardEvents;
  state.moduleCounts.events = state.dashboardEvents.length;
  return state.dashboardEvents;
}

async function loadInventoryForRecipeUsage() {
  const clientId = getActiveClientId();
  if (!clientId) return [];

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(MODULE_SECTIONS.inventory.table)
      .select('*')
      .eq('client_id', clientId)
  ).order('created_at', { ascending: false });

  if (error) throw error;

  state.moduleRecords.inventory = data || [];
  state.moduleCounts.inventory = state.moduleRecords.inventory.length;
  return state.moduleRecords.inventory;
}

async function loadModuleData(section) {
  const moduleConfig = getModuleConfig(section);
  if (section === 'reports') return loadReportsData();

  const clientId = getActiveClientId();
  if (!clientId) return [];

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(moduleConfig.table)
      .select('*')
      .eq('client_id', clientId)
  ).order('created_at', { ascending: false });

  if (error) throw error;

  state.moduleRecords[section] = data || [];
  state.moduleCounts[section] = state.moduleRecords[section].length;

  if (section === 'inventory') {
    await loadRecipesForInventoryUsage();
  }

  if (section === 'menu') {
    await loadRecipesForInventoryUsage();
  }

  if (section === 'recipes') {
    await loadInventoryForRecipeUsage();
    await loadSubrecipesForRecipeUsage();
  }

  return state.moduleRecords[section];
}

async function loadRecipesForInventoryUsage() {
  const clientId = getActiveClientId();
  if (!clientId) return [];

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(MODULE_SECTIONS.recipes.table)
      .select('*')
      .eq('client_id', clientId)
  ).order('created_at', { ascending: false });

  if (error) throw error;

  state.moduleRecords.recipes = data || [];
  state.moduleCounts.recipes = state.moduleRecords.recipes.length;
  return state.moduleRecords.recipes;
}

async function loadSubrecipesForRecipeUsage() {
  const clientId = getActiveClientId();
  if (!clientId) return [];

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(MODULE_SECTIONS.subrecipes.table)
      .select('*')
      .eq('client_id', clientId)
  ).order('created_at', { ascending: false });

  if (error) throw error;

  state.moduleRecords.subrecipes = data || [];
  state.moduleCounts.subrecipes = state.moduleRecords.subrecipes.length;
  return state.moduleRecords.subrecipes;
}

function getActiveClientStorageKey() {
  return config.activeClientStorageKey || 'beoflow.activeClientId';
}

function normalizeWorkspaceSelector(value) {
  return String(value || '').trim().toLowerCase();
}

function findMatchingWorkspace(savedWorkspace, availableWorkspaces = state.userClients) {
  const workspaces = (availableWorkspaces || []).filter(workspace => workspace?.id);
  if (workspaces.length === 0 || !savedWorkspace) return null;

  const savedId = typeof savedWorkspace === 'string'
    ? savedWorkspace
    : savedWorkspace.id || savedWorkspace.client_id || savedWorkspace.workspace_id;
  const savedName = typeof savedWorkspace === 'string'
    ? savedWorkspace
    : savedWorkspace.name || savedWorkspace.workspace_name || savedWorkspace.restaurant_name;
  const normalizedSavedId = normalizeWorkspaceSelector(savedId);
  const normalizedSavedName = normalizeWorkspaceSelector(savedName);

  return workspaces.find(workspace => (
    normalizeWorkspaceSelector(workspace.id) === normalizedSavedId
    || normalizeWorkspaceSelector(workspace.name) === normalizedSavedName
    || normalizeWorkspaceSelector(workspace.slug) === normalizedSavedName
  )) || null;
}

function getValidSelectedWorkspace(savedWorkspace, availableWorkspaces = state.userClients) {
  const workspaces = (availableWorkspaces || []).filter(workspace => workspace?.id);
  if (workspaces.length === 0) return null;

  return findMatchingWorkspace(savedWorkspace, workspaces) || workspaces[0];
}

function clearInvalidStoredWorkspace(savedWorkspace, selectedWorkspace) {
  if (!savedWorkspace) return;
  const matchedWorkspace = findMatchingWorkspace(savedWorkspace);
  if (matchedWorkspace && selectedWorkspace?.id === matchedWorkspace.id) return;
  localStorage.removeItem(getActiveClientStorageKey());
}

async function loadReportsData() {
  const clientId = getActiveClientId();
  if (!clientId) return null;

  const counts = await loadDashboardCounts();
  const supabase = requireSupabaseClient();
  const [
    { data: inventoryRows, error: inventoryError },
    { data: recipeRows, error: recipeError },
    { data: menuRows, error: menuError }
  ] = await Promise.all([
    withActiveRecordFilter(supabase.from(MODULE_SECTIONS.inventory.table).select('*').eq('client_id', clientId)),
    withActiveRecordFilter(supabase.from(MODULE_SECTIONS.recipes.table).select('*').eq('client_id', clientId)),
    withActiveRecordFilter(supabase.from(MODULE_SECTIONS.menu.table).select('*').eq('client_id', clientId))
  ]);

  if (inventoryError) throw inventoryError;
  if (recipeError) throw recipeError;
  if (menuError) throw menuError;

  const inventory = inventoryRows || [];
  const recipes = recipeRows || [];
  const menuItems = menuRows || [];
  const lowStockItems = inventory.filter(isLowStock).length;
  const ingredientsById = new Map(inventory.map(item => [String(item.id), item]));
  const usageCounts = new Map();
  const incompleteRecipes = recipes.filter(recipe => {
    const ingredients = normalizeRecipeIngredients(recipe.ingredients);
    if (ingredients.length === 0) return true;
    return ingredients.some(ingredient => {
      if (ingredient.validationStatus && ingredient.validationStatus !== 'valid') return true;
      if (ingredient.itemType === 'inventory' && !ingredientsById.has(String(ingredient.inventoryItemId))) return true;
      return false;
    });
  }).length;

  recipes.forEach(recipe => {
    normalizeRecipeIngredients(recipe.ingredients).forEach(ingredient => {
      if (ingredient.itemType !== 'inventory' || !ingredient.inventoryItemId) return;
      const key = String(ingredient.inventoryItemId);
      usageCounts.set(key, (usageCounts.get(key) || 0) + 1);
    });
  });

  const mostUsedInventoryId = [...usageCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostUsedInventory = mostUsedInventoryId ? ingredientsById.get(mostUsedInventoryId) : null;
  const menuWithMargin = menuItems.filter(item => Number.isFinite(Number(item.margin_percentage)));
  const bestMenuItem = [...menuWithMargin].sort((a, b) => Number(b.margin_percentage) - Number(a.margin_percentage))[0];
  const worstMenuItem = [...menuWithMargin].sort((a, b) => Number(a.margin_percentage) - Number(b.margin_percentage))[0];

  state.reportsData = {
    total_staff: counts.staff || 0,
    total_menu_items: counts.menu || 0,
    total_recipes: counts.recipes || 0,
    total_subrecipes: counts.subrecipes || 0,
    total_inventory_items: counts.inventory || 0,
    total_events: counts.events || 0,
    total_production_logs: counts.production || 0,
    low_stock_items: lowStockItems,
    total_recipe_cost: recipes.reduce((total, recipe) => total + getRecipeCostForMenu(recipe), 0),
    low_margin_recipes: recipes.filter(recipe => {
      const margin = Number(recipe.margin_percentage);
      return Number.isFinite(margin) && margin < 0.2;
    }).length,
    incomplete_recipes: incompleteRecipes,
    inventory_missing_price: inventory.filter(item => !Number.isFinite(Number(getInventoryPackagePrice(item)))).length,
    inventory_missing_presentation: inventory.filter(item => {
      const packageQuantity = Number(getInventoryPackageQuantity(item));
      return !Number.isFinite(packageQuantity) || packageQuantity <= 0;
    }).length,
    most_used_inventory: mostUsedInventory ? `${mostUsedInventory.name} (${usageCounts.get(mostUsedInventoryId)} recipes)` : 'Not available',
    best_menu_margin: bestMenuItem ? `${bestMenuItem.name} (${formatRecordValue('margin_percentage', bestMenuItem.margin_percentage)})` : 'Not available',
    worst_menu_margin: worstMenuItem ? `${worstMenuItem.name} (${formatRecordValue('margin_percentage', worstMenuItem.margin_percentage)})` : 'Not available',
    estimated_menu_profit: menuItems.reduce((total, item) => {
      const profit = Number(item.profit);
      return total + (Number.isFinite(profit) ? profit : 0);
    }, 0)
  };
  return state.reportsData;
}

async function createRecord(table, payload) {
  const clientId = getActiveClientId();
  if (!clientId) throw new Error('Open a restaurant workspace before creating records.');

  const userId = requireSignedInUserId();
  const { data, error } = await requireSupabaseClient()
    .from(table)
    .insert({
      ...payload,
      client_id: clientId,
      created_by: userId
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function updateRecord(table, id, payload) {
  const clientId = getActiveClientId();
  if (!clientId) throw new Error('Open a restaurant workspace before updating records.');

  const { data, error } = await requireSupabaseClient()
    .from(table)
    .update(payload)
    .eq('id', id)
    .eq('client_id', clientId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function deleteOrArchiveRecord(table, id) {
  return updateRecord(table, id, { status: 'archived' });
}

function updateDashboardCards(counts = state.moduleCounts) {
  document.querySelectorAll('[data-count-section]').forEach(element => {
    const section = element.dataset.countSection;
    element.textContent = String(counts[section] || 0);
  });
}

function getDashboardEventDateKey(record) {
  return formatDateKey(parseDateKey(record?.event_date));
}

function getDashboardEventsForDate(dateKey) {
  return (state.dashboardEvents || [])
    .filter(record => getDashboardEventDateKey(record) === dateKey)
    .sort((first, second) => String(first.start_time || '').localeCompare(String(second.start_time || '')));
}

function renderCalendarEventBadge(record) {
  const timeLabel = formatTimeLabel(record.start_time);
  return `
    <button
      type="button"
      class="calendar-event-chip"
      data-calendar-action="open-event"
      data-event-id="${escapeHtml(record.id)}"
      title="${escapeHtml(`${record.name || 'Event'}${timeLabel ? ` at ${timeLabel}` : ''}`)}"
    >
      <span>${escapeHtml(record.name || 'Untitled event')}</span>
    </button>
  `;
}

function renderCalendarDayCell(date, monthIndex) {
  const dateKey = formatDateKey(date);
  const isCurrentMonth = date.getMonth() === monthIndex;
  const isToday = dateKey === getTodayDateKey();
  const isSelected = dateKey === state.dashboardSelectedDate;
  const dayEvents = getDashboardEventsForDate(dateKey);
  const visibleEvents = dayEvents.slice(0, 2);
  const overflowCount = dayEvents.length - visibleEvents.length;
  const classNames = [
    'calendar-day',
    isCurrentMonth ? '' : 'is-outside-month',
    isToday ? 'is-today' : '',
    isSelected ? 'is-selected' : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="${classNames}">
      <button
        type="button"
        class="calendar-day-number"
        data-calendar-action="select-date"
        data-date="${escapeHtml(dateKey)}"
        aria-label="Select ${escapeHtml(formatCalendarDayHeading(dateKey))}"
      >
        ${date.getDate()}
      </button>
      <div class="calendar-day-events">
        ${visibleEvents.map(renderCalendarEventBadge).join('')}
        ${overflowCount > 0 ? `<span class="calendar-event-overflow">+${overflowCount} more</span>` : ''}
      </div>
    </div>
  `;
}

function renderSelectedCalendarEvents(dateKey) {
  const selectedEvents = getDashboardEventsForDate(dateKey);
  if (selectedEvents.length === 0) {
    return '<p class="calendar-empty-copy">No events scheduled.</p>';
  }

  return `
    <div class="calendar-selected-list">
      ${selectedEvents.map(record => {
        const timeLabel = formatTimeLabel(record.start_time);
        const details = [
          timeLabel,
          record.location,
          record.guest_count ? `${record.guest_count} guests` : ''
        ].filter(Boolean).join(' - ');

        return `
          <button
            type="button"
            class="calendar-selected-event"
            data-calendar-action="open-event"
            data-event-id="${escapeHtml(record.id)}"
          >
            <span class="calendar-selected-event-icon">${renderIcon('clock')}</span>
            <span>
              <strong>${escapeHtml(record.name || 'Untitled event')}</strong>
              ${details ? `<small>${escapeHtml(details)}</small>` : ''}
            </span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderOperationsCalendar() {
  const calendar = els['operations-calendar'];
  if (!calendar) return;

  const today = createCalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  if (!state.dashboardSelectedDate) state.dashboardSelectedDate = formatDateKey(today);
  if (!(state.dashboardCalendarDate instanceof Date) || Number.isNaN(state.dashboardCalendarDate.getTime())) {
    state.dashboardCalendarDate = today;
  }

  const monthDate = createCalendarDate(
    state.dashboardCalendarDate.getFullYear(),
    state.dashboardCalendarDate.getMonth(),
    1
  );
  const monthIndex = monthDate.getMonth();
  const leadingDays = monthDate.getDay();
  const calendarCells = Array.from({ length: 42 }, (_, index) => (
    createCalendarDate(monthDate.getFullYear(), monthIndex, 1 - leadingDays + index)
  ));
  const selectedDateKey = state.dashboardSelectedDate || formatDateKey(today);

  calendar.innerHTML = `
    <div class="calendar-card-header">
      <div class="calendar-title-row">
        <span class="calendar-title-icon">${renderIcon('calendar')}</span>
        <div>
          <p class="eyebrow">Dashboard</p>
          <h3>Operations Calendar</h3>
        </div>
      </div>
      <div class="calendar-controls" aria-label="Calendar controls">
        <button type="button" class="secondary-action calendar-today-button" data-calendar-action="today">Today</button>
        <button type="button" class="calendar-icon-button" data-calendar-action="previous-month" aria-label="Previous month">${renderIcon('chevronLeft')}</button>
        <span class="calendar-month-label">${escapeHtml(formatCalendarMonth(monthDate))}</span>
        <button type="button" class="calendar-icon-button" data-calendar-action="next-month" aria-label="Next month">${renderIcon('chevronRight')}</button>
      </div>
    </div>

    <div class="calendar-grid" role="grid" aria-label="${escapeHtml(formatCalendarMonth(monthDate))}">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<span class="calendar-weekday">${day}</span>`).join('')}
      ${calendarCells.map(date => renderCalendarDayCell(date, monthIndex)).join('')}
    </div>

    <div class="calendar-selected-panel">
      <div>
        <p class="eyebrow">Selected Day</p>
        <h4>${escapeHtml(formatCalendarDayHeading(selectedDateKey))}</h4>
      </div>
      ${renderSelectedCalendarEvents(selectedDateKey)}
      <button type="button" class="primary-action calendar-add-event" data-calendar-action="add-event">
        ${renderIconLabel('add', 'Add Event')}
      </button>
    </div>
  `;
}

function handleOperationsCalendarClick(event) {
  const actionControl = event.target.closest('[data-calendar-action]');
  if (!actionControl || !els['operations-calendar']?.contains(actionControl)) return;

  const action = actionControl.dataset.calendarAction;
  if (action === 'previous-month' || action === 'next-month') {
    const delta = action === 'previous-month' ? -1 : 1;
    state.dashboardCalendarDate = createCalendarDate(
      state.dashboardCalendarDate.getFullYear(),
      state.dashboardCalendarDate.getMonth() + delta,
      1
    );
    renderOperationsCalendar();
    return;
  }

  if (action === 'today') {
    const today = createCalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    state.dashboardCalendarDate = today;
    state.dashboardSelectedDate = formatDateKey(today);
    renderOperationsCalendar();
    return;
  }

  if (action === 'select-date') {
    const selectedDate = parseDateKey(actionControl.dataset.date);
    if (!selectedDate) return;
    state.dashboardSelectedDate = formatDateKey(selectedDate);
    state.dashboardCalendarDate = createCalendarDate(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    renderOperationsCalendar();
    return;
  }

  if (action === 'open-event') {
    const record = (state.dashboardEvents || []).find(item => String(item.id) === String(actionControl.dataset.eventId));
    if (record) openModuleModal('events', record);
    return;
  }

  if (action === 'add-event') {
    openModuleModal('events');
  }
}

function hideWorkspaceSections() {
  els['dashboard-view'].hidden = true;
  els['module-view'].hidden = true;
}

function hideStandaloneWorkspaceViews() {
  els['onboarding-view'].hidden = true;
  els['workspace-created-view'].hidden = true;
  els['client-selector-view'].hidden = true;
}

function closeWorkspaceModals() {
  els['workspace-switcher-modal'].hidden = true;
  els['workspace-settings-modal'].hidden = true;
  showAlert(els['workspace-settings-message'], '');
}

function isMobileWorkspaceLayout() {
  return window.matchMedia?.('(max-width: 860px)').matches || false;
}

function syncMobileDrawerState() {
  const drawer = els['workspace-sidebar'];
  const overlay = els['mobile-drawer-overlay'];
  const menuButton = els['mobile-menu-button'];
  if (!drawer || !overlay || !menuButton) return;

  const isMobile = isMobileWorkspaceLayout();
  const isOpen = isMobile && state.mobileDrawerOpen;
  drawer.classList.toggle('is-open', isOpen);
  drawer.setAttribute('aria-hidden', isMobile ? String(!isOpen) : 'false');
  overlay.hidden = !isOpen;
  overlay.classList.toggle('open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('mobile-menu-open', isOpen);

  if (!isMobile && state.mobileDrawerOpen) {
    state.mobileDrawerOpen = false;
  }
}

function openMobileDrawer() {
  state.mobileDrawerOpen = true;
  syncMobileDrawerState();
}

function closeMobileDrawer() {
  state.mobileDrawerOpen = false;
  syncMobileDrawerState();
}

function renderStandaloneWorkspaceView(viewId) {
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = true;
  els['workspace-view'].hidden = true;
  closeMobileDrawer();
  closeWorkspaceModals();
  hideStandaloneWorkspaceViews();
  els[viewId].hidden = false;
}

function setActiveSidebarSection(section) {
  state.activeSection = section;

  document.querySelectorAll('.sidebar-link[data-section], .module-card[data-section]').forEach(control => {
    const isActive = control.dataset.section === section;
    control.classList.toggle('is-active', isActive);

    if (control.classList.contains('sidebar-link')) {
      if (isActive) {
        control.setAttribute('aria-current', 'page');
      } else {
        control.removeAttribute('aria-current');
      }
    }
  });
}

function showModuleToast(message = 'This module is ready for the next build.') {
  const toast = els['module-toast'];
  if (!toast) return;

  toast.textContent = message;
  applyLanguageToDocument(toast);
  toast.hidden = false;
  window.clearTimeout(showModuleToast.timeoutId);
  showModuleToast.timeoutId = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function showToast(message) {
  showModuleToast(message);
}

function renderLoadingSession() {
  els['session-loading-view'].hidden = false;
  els['auth-view'].hidden = true;
  els['workspace-view'].hidden = true;
  hideStandaloneWorkspaceViews();
  closeMobileDrawer();
  closeWorkspaceModals();
}

function setAuthCopy(title, subtitle) {
  if (els['auth-title']) els['auth-title'].textContent = title;
  if (els['auth-subtitle']) els['auth-subtitle'].textContent = subtitle;
}

function setPasswordToggleState(button, input, isVisible) {
  input.type = isVisible ? 'text' : 'password';
  button.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  button.setAttribute('aria-pressed', String(isVisible));
  const eyeIcon = button.querySelector('.password-icon-eye');
  const eyeOffIcon = button.querySelector('.password-icon-eye-off');
  if (eyeIcon) eyeIcon.hidden = isVisible;
  if (eyeOffIcon) eyeOffIcon.hidden = !isVisible;
}

function resetPasswordVisibility() {
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    const input = document.getElementById(button.dataset.target);
    if (input) setPasswordToggleState(button, input, false);
  });
}

function configureAuthPasswordFields() {
  const isSignup = state.authMode === 'signup';
  els['confirm-password-field'].hidden = !isSignup;
  els['auth-confirm-password'].disabled = !isSignup;
  els['auth-confirm-password'].required = isSignup;
  if (isSignup) {
    els['auth-password'].removeAttribute('minlength');
    els['auth-confirm-password'].removeAttribute('minlength');
  } else {
    els['auth-password'].setAttribute('minlength', '6');
    els['auth-confirm-password'].setAttribute('minlength', '8');
  }
  els['auth-password'].placeholder = isSignup ? 'Minimum 8 characters' : 'Minimum 6 characters';
  els['auth-password'].autocomplete = isSignup ? 'new-password' : 'current-password';
}

function renderAuthView() {
  state.isRecoveryMode = false;
  resetPasswordVisibility();
  setAuthCopy(
    'Kitchen operations workspace',
    'Sign in or create an account to manage your restaurant, events, recipes, inventory, staff, and reports.'
  );
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = false;
  els['workspace-view'].hidden = true;
  hideStandaloneWorkspaceViews();
  closeMobileDrawer();
  closeWorkspaceModals();
  els['auth-tabs'].hidden = false;
  els['auth-form'].hidden = false;
  els['forgot-password-button'].hidden = false;
  els['password-reset-request-form'].hidden = true;
  els['password-recovery-form'].hidden = true;
  els['full-name-field'].hidden = state.authMode !== 'signup';
  configureAuthPasswordFields();
  els['auth-submit'].textContent = state.authMode === 'signup' ? 'Create account' : 'Sign in';
  els['show-sign-in'].classList.toggle('is-active', state.authMode === 'signin');
  els['show-sign-up'].classList.toggle('is-active', state.authMode === 'signup');
}

function renderResetRequestView() {
  state.isRecoveryMode = false;
  setAuthCopy(
    'Reset your password',
    'Send a secure reset email to your Beoflow account address.'
  );
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = false;
  els['workspace-view'].hidden = true;
  hideStandaloneWorkspaceViews();
  closeMobileDrawer();
  closeWorkspaceModals();
  els['auth-tabs'].hidden = true;
  els['auth-form'].hidden = true;
  els['forgot-password-button'].hidden = true;
  els['password-recovery-form'].hidden = true;
  els['password-reset-request-form'].hidden = false;
  els['reset-email'].value = els['auth-email'].value.trim();
}

function renderPasswordRecoveryView() {
  state.isRecoveryMode = true;
  resetPasswordVisibility();
  setAuthCopy(
    'Reset your password',
    'Choose a new password for your Beoflow account.'
  );
  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = false;
  els['workspace-view'].hidden = true;
  hideStandaloneWorkspaceViews();
  closeMobileDrawer();
  closeWorkspaceModals();
  els['auth-tabs'].hidden = true;
  els['auth-form'].hidden = true;
  els['forgot-password-button'].hidden = true;
  els['password-reset-request-form'].hidden = true;
  els['password-recovery-form'].hidden = false;
  showAlert(els['auth-message'], 'Reset password. Enter and confirm your new password.', 'success');
}

function renderConfigState() {
  if (!isMissingClientProdKey()) {
    showAlert(els['config-alert'], '');
    return;
  }

  showAlert(
    els['config-alert'],
    'Client-prod anon public key is missing. Add it to beoflow-client-config.js to enable sign up and login.'
  );
}

function renderWorkspaceFrame({ showWorkspaceHeader = true } = {}) {
  if (!state.activeClient?.id) {
    renderClientSelector();
    return;
  }

  els['session-loading-view'].hidden = true;
  els['auth-view'].hidden = true;
  hideStandaloneWorkspaceViews();
  els['workspace-view'].hidden = false;
  els['workspace-header'].hidden = !showWorkspaceHeader;
  const activeName = state.activeClient?.name || 'Beoflow';
  els['workspace-title'].textContent = activeName;
  els['workspace-subtitle'].textContent = state.activeClient
    ? `Beoflow Workspace for ${formatClientType(state.activeClient.client_type)} operations.`
    : 'Create or select a restaurant to start using Beoflow.';
  els['switch-client-button'].hidden = state.userClients.length < 2;
  els['mobile-switch-client-button'].hidden = false;
  renderWorkspaceBadge();
  syncMobileDrawerState();
}

function renderWorkspaceBadge() {
  if (!state.activeClient) return;
  if (els['workspace-control-name']) {
    els['workspace-control-name'].textContent = state.activeClient.name || 'Restaurant workspace';
  }
  if (els['mobile-workspace-name']) {
    els['mobile-workspace-name'].textContent = state.activeClient.name || 'Beoflow';
  }
}

function resetClientForm() {
  els['client-form'].reset();
  els['client-type'].value = 'restaurant';
}

function renderOnboarding(mode = 'first') {
  state.onboardingMode = mode;
  clearAlerts();
  renderStandaloneWorkspaceView('onboarding-view');
  resetClientForm();

  if (mode === 'add') {
    els['onboarding-step'].textContent = 'Add workspace';
    els['onboarding-title'].textContent = 'Add another restaurant';
    els['onboarding-description'].textContent = 'Create another Beoflow workspace for a restaurant, kitchen, or operation.';
    els['create-client-button'].textContent = 'Create Workspace';
    return;
  }

  els['onboarding-step'].textContent = 'Step 1 of 1';
  els['onboarding-title'].textContent = 'Set up your first restaurant';
  els['onboarding-description'].textContent = 'Create a workspace for your restaurant, kitchen, or operation.';
  els['create-client-button'].textContent = 'Create Workspace';
}

function showWorkspaceOnboarding() {
  renderOnboarding('first');
}

function renderWorkspaceCreated() {
  renderStandaloneWorkspaceView('workspace-created-view');
  const activeName = state.activeClient?.name || 'Your workspace';
  els['workspace-created-description'].textContent = `${activeName} is ready in Beoflow.`;
}

function renderClientSelector() {
  if (state.userClients.length === 0) {
    showWorkspaceOnboarding();
    return;
  }

  renderStandaloneWorkspaceView('client-selector-view');
  els['client-list'].innerHTML = '';

  state.userClients.forEach(client => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'client-option';
    button.innerHTML = `
      <span>
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(formatClientType(client.client_type))} • ${escapeHtml(client.status || 'active')}</span>
      </span>
      <span>Open workspace</span>
    `;
    button.addEventListener('click', () => {
      switchWorkspace(client.id);
    });
    els['client-list'].appendChild(button);
  });
}

function renderDashboard() {
  const activeClient = requireActiveClient();
  if (!activeClient) return;

  setElementModuleVisual(els['dashboard-view'], 'dashboard');
  renderWorkspaceFrame({ showWorkspaceHeader: true });
  hideWorkspaceSections();
  setActiveSidebarSection('dashboard');
  els['dashboard-view'].hidden = false;
  els['dashboard-title'].innerHTML = renderIconLabel(getModuleVisual('dashboard').icon, state.activeClient.name);
  els['dashboard-description'].textContent = `Welcome to ${state.activeClient.name}. Your Beoflow modules are ready for real operating data when your team starts building.`;
  updateDashboardCards();
  renderOperationsCalendar();

  loadDashboardCounts()
    .then(counts => {
      if (state.activeSection === 'dashboard') updateDashboardCards(counts);
    })
    .catch(error => {
      showAlert(els['workspace-message'], error.message || 'Unable to load dashboard counts.');
    });

  loadDashboardEvents()
    .then(() => {
      if (state.activeSection === 'dashboard') renderOperationsCalendar();
    })
    .catch(error => {
      showAlert(els['workspace-message'], error.message || 'Unable to load dashboard calendar.');
    });
}

function renderModuleSection(section) {
  const activeClient = requireActiveClient();
  if (!activeClient) return;

  const moduleConfig = MODULE_SECTIONS[section];
  if (!moduleConfig) {
    renderDashboard();
    return;
  }

  if (section !== 'recipes') {
    state.recipeInlineNewOpen = false;
    state.recipeInlineNewIngredient = null;
  }

  renderWorkspaceFrame({ showWorkspaceHeader: false });
  hideWorkspaceSections();
  setActiveSidebarSection(section);
  els['module-view'].hidden = false;
  setElementModuleVisual(els['module-view'], section);
  els['module-title'].innerHTML = renderIconLabel(getModuleVisual(section).icon, moduleConfig.title);
  els['module-subtitle'].textContent = moduleConfig.subtitle;
  els['module-count-badge'].textContent = section === 'reports' ? 'Loading metrics' : 'Loading';
  els['module-header-action-button'].innerHTML = renderIconLabel(getModuleActionIcon(section), moduleConfig.action);
  els['module-header-action-button'].classList.add('icon-action');
  els['module-header-action-button'].hidden = section === 'reports';
  els['module-empty-icon'].innerHTML = renderIcon(getModuleVisual(section).icon);
  els['module-empty-title'].textContent = moduleConfig.emptyTitle;
  els['module-empty-copy'].textContent = moduleConfig.emptyCopy;
  els['module-action-button'].innerHTML = renderIconLabel(getModuleActionIcon(section), moduleConfig.action);
  els['module-action-button'].classList.add('icon-action');
  els['module-action-button'].hidden = section === 'reports';
  els['module-empty-state'].hidden = true;
  els['module-record-list'].hidden = false;
  els['module-record-list'].innerHTML = '<div class="module-loading">Loading workspace records.</div>';

  loadModuleData(section)
    .then(result => {
      if (state.activeSection !== section) return;
      if (section === 'reports') {
        renderReportsSection(result);
        return;
      }

      renderModuleList(section, result);
      updateDashboardCards(state.moduleCounts);
    })
    .catch(error => {
      els['module-count-badge'].textContent = 'Unable to load';
      els['module-record-list'].innerHTML = '';
      els['module-empty-state'].hidden = false;
      showAlert(els['workspace-message'], error.message || `Unable to load ${moduleConfig.title}.`);
    });
}

function renderModuleList(section, records = state.moduleRecords[section] || []) {
  const moduleConfig = getModuleConfig(section);
  if (section === 'recipes') {
    renderRecipesInlineList(records);
    return;
  }

  if (section === 'subrecipes') {
    renderSubrecipesSummaryList(records);
    return;
  }

  if (section === 'inventory') {
    renderInventoryList(records);
    return;
  }

  const count = records.length;
  els['module-count-badge'].textContent = `${count} ${count === 1 ? moduleConfig.singular : moduleConfig.plural}`;
  els['module-empty-state'].hidden = count > 0;
  els['module-record-list'].hidden = count === 0;

  if (count === 0) {
    els['module-record-list'].innerHTML = '';
    return;
  }

  els['module-record-list'].innerHTML = records.map(record => renderRecordCard(section, record)).join('');
}

function getInventoryCategoryLabel(record) {
  const category = String(record?.category || '').trim();
  return category || 'Other';
}

function getInventoryCategorySortIndex(category) {
  const normalizedCategory = normalizeIngredientNameForMatch(category);
  const index = INVENTORY_CATEGORY_OPTIONS.findIndex(option => (
    normalizeIngredientNameForMatch(option) === normalizedCategory
  ));
  return index >= 0 ? index : INVENTORY_CATEGORY_OPTIONS.length;
}

function sortInventoryCategories(first, second) {
  const firstIndex = getInventoryCategorySortIndex(first);
  const secondIndex = getInventoryCategorySortIndex(second);
  if (firstIndex !== secondIndex) return firstIndex - secondIndex;
  return String(first).localeCompare(String(second));
}

function renderInventoryList(records = state.moduleRecords.inventory || []) {
  const moduleConfig = getModuleConfig('inventory');
  const count = records.length;
  els['module-count-badge'].textContent = `${count} ${count === 1 ? moduleConfig.singular : moduleConfig.plural}`;
  els['module-empty-state'].hidden = count > 0;
  els['module-record-list'].hidden = count === 0;

  if (count === 0) {
    els['module-record-list'].innerHTML = '';
    return;
  }

  const recordsByCategory = records.reduce((groups, record) => {
    const category = getInventoryCategoryLabel(record);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(record);
    return groups;
  }, new Map());

  const categories = [...recordsByCategory.keys()].sort(sortInventoryCategories);
  els['module-record-list'].innerHTML = `
    <div class="inventory-category-list">
      ${categories.map(category => renderInventoryCategoryGroup(category, recordsByCategory.get(category))).join('')}
    </div>
  `;
}

function renderInventoryCategoryGroup(category, records = []) {
  const categoryVisual = getInventoryCategoryVisual(category);
  const sortedRecords = [...records].sort((first, second) => (
    String(first.name || '').localeCompare(String(second.name || ''))
  ));

  return `
    <section class="inventory-category-group ${escapeHtml(categoryVisual.className)}">
      <header class="inventory-category-header">
        <span class="inventory-category-icon ${escapeHtml(categoryVisual.className)}">${renderIcon(categoryVisual.icon)}</span>
        <div>
          <h4>${escapeHtml(category)}</h4>
          <p>${sortedRecords.length} ${sortedRecords.length === 1 ? 'ingredient' : 'ingredients'}</p>
        </div>
      </header>
      <div class="inventory-ingredient-list">
        ${sortedRecords.map(renderInventoryIngredientRow).join('')}
      </div>
    </section>
  `;
}

function renderInventoryIngredientRow(record) {
  const categoryVisual = getInventoryCategoryVisual(record);
  const title = getRecordTitle('inventory', record);
  const status = record?.status || 'active';
  const summaryLabel = getInventorySummaryLabel(record);
  const baseUnit = getInventoryBaseUnit(record);
  const currentStock = formatRecordValue('current_stock', getInventoryCurrentStock(record));
  const packageQuantity = formatRecordValue('package_quantity', getInventoryPackageQuantity(record));
  const packageUnit = getInventoryPackageUnit(record);
  const unitCost = formatMoney(calculateInventoryUnitCost(record) || 0);
  const packageLabel = [packageQuantity, packageUnit].filter(Boolean).join(' ');
  const stockLabel = [currentStock, baseUnit].filter(Boolean).join(' ');
  const stateBadgesHtml = renderRecordStateBadges('inventory', record);

  return `
    <article class="inventory-ingredient-row">
      <div class="inventory-ingredient-main">
        <span class="record-title-icon ${escapeHtml(categoryVisual.className)}">${renderIcon(categoryVisual.icon)}</span>
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(summaryLabel)}</span>
        </div>
      </div>
      <div class="inventory-ingredient-metrics" aria-label="Ingredient details">
        <span title="Current stock">${renderIconLabel('box', stockLabel || 'Stock 0')}</span>
        <span title="Package">${renderIconLabel('package', packageLabel || 'No pack')}</span>
        <span title="Unit cost">${renderIconLabel('tag', unitCost)}</span>
      </div>
      <div class="inventory-ingredient-status">
        ${stateBadgesHtml}
        <span class="status-badge">${renderIconLabel(status === 'active' ? 'check' : 'circle', formatRecordValue('status', status))}</span>
      </div>
      <div class="inventory-ingredient-actions" aria-label="Inventory actions">
        <button type="button" class="secondary-action icon-only-button" data-module-action="use-in-recipe" data-section="inventory" data-record-id="${escapeHtml(record.id)}" title="Use in recipe" aria-label="Use ${escapeHtml(title)} in recipe">${renderIcon('add')}<span class="visually-hidden">Use in recipe</span></button>
        <button type="button" class="secondary-action icon-only-button" data-module-action="add-to-recipe" data-section="inventory" data-record-id="${escapeHtml(record.id)}" title="Add to recipe" aria-label="Add ${escapeHtml(title)} to recipe">${renderIcon('box')}<span class="visually-hidden">Add to recipe</span></button>
        <button type="button" class="secondary-action icon-only-button" data-module-action="edit" data-section="inventory" data-record-id="${escapeHtml(record.id)}" title="Edit" aria-label="Edit ${escapeHtml(title)}">${renderIcon('pencil')}<span class="visually-hidden">Edit</span></button>
        <button type="button" class="secondary-action danger-action icon-only-button" data-module-action="archive" data-section="inventory" data-record-id="${escapeHtml(record.id)}" title="Archive" aria-label="Archive ${escapeHtml(title)}">${renderIcon('archive')}<span class="visually-hidden">Archive</span></button>
      </div>
    </article>
  `;
}

function renderRecipesInlineList(records = state.moduleRecords.recipes || []) {
  renderCostingSummaryList('recipes', records);
}

function renderSubrecipesSummaryList(records = state.moduleRecords.subrecipes || []) {
  renderCostingSummaryList('subrecipes', records);
}

function renderCostingSummaryList(section, records = state.moduleRecords[section] || []) {
  const activeModuleConfig = getModuleConfig(section);
  const count = records.length;
  els['module-count-badge'].textContent = `${count} ${count === 1 ? activeModuleConfig.singular : activeModuleConfig.plural}`;
  els['module-empty-state'].hidden = count > 0;
  els['module-record-list'].hidden = count === 0;

  if (count === 0) {
    els['module-record-list'].innerHTML = '';
    return;
  }

  els['module-record-list'].innerHTML = `
    ${section === 'recipes' ? renderInlineRecipeInventoryDatalist() : ''}
    <div class="recipe-summary-list">
      ${records.map(record => renderCostingSummaryCard(section, record)).join('')}
    </div>
  `;
}

function getSafeImageUrl(value) {
  const rawUrl = String(value || '').trim();
  if (!rawUrl) return '';
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(rawUrl)) return rawUrl;

  try {
    const parsedUrl = new URL(rawUrl, window.location.href);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? rawUrl : '';
  } catch {
    return '';
  }
}

function getRecipePhotoUrl(record) {
  return getSafeImageUrl(record?.photo_url);
}

function formatRecipeYield(record) {
  const quantity = record?.yield_quantity;
  const unit = record?.yield_unit;
  if (quantity === null || quantity === undefined || quantity === '') return '';
  return [formatRecordValue('yield_quantity', quantity), unit].filter(Boolean).join(' ');
}

function getRecipeInventoryConnectionSummary(ingredients) {
  const normalizedIngredients = normalizeRecipeIngredients(ingredients);
  const missingCount = normalizedIngredients.filter(ingredient => !getIngredientInventoryStatus(ingredient).connected).length;

  if (normalizedIngredients.length === 0) {
    return {
      icon: 'circle',
      label: 'No ingredients',
      className: 'status-badge-muted',
      connected: false,
      missingCount,
      ingredientCount: 0
    };
  }

  if (missingCount > 0) {
    return {
      icon: 'alert',
      label: `${missingCount} not in inventory`,
      className: 'status-badge-warning',
      connected: false,
      missingCount,
      ingredientCount: normalizedIngredients.length
    };
  }

  return {
    icon: 'check',
    label: 'Inventory connected',
    className: 'status-badge-success',
    connected: true,
    missingCount,
    ingredientCount: normalizedIngredients.length
  };
}

function renderRecipeThumbnail(record, title, section = 'recipes') {
  const photoUrl = getRecipePhotoUrl(record);
  if (photoUrl) {
    return `
      <div class="recipe-summary-photo">
        <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(title)} photo" loading="lazy">
      </div>
    `;
  }

  return `
    <div class="recipe-summary-photo recipe-summary-photo-empty" aria-hidden="true">
      ${renderIcon(section === 'subrecipes' ? 'layers' : 'image')}
    </div>
  `;
}

function renderRecipeSummaryCard(record) {
  return renderCostingSummaryCard('recipes', record);
}

function renderSubrecipeSummaryCard(record) {
  return renderCostingSummaryCard('subrecipes', record);
}

function renderCostingSummaryCard(section, record) {
  const visual = getModuleVisual(section);
  const title = getRecordTitle(section, record);
  const status = record?.status || 'active';
  const ingredients = normalizeRecipeIngredients(record?.ingredients);
  const inventorySummary = getRecipeInventoryConnectionSummary(ingredients);
  const categoryHtml = record?.category
    ? `<span class="record-meta-chip">${escapeHtml(record.category)}</span>`
    : '';
  const yieldLabel = formatRecipeYield(record);
  const isSubrecipe = section === 'subrecipes';
  const eyebrow = isSubrecipe ? 'Subrecipe' : 'Recipe';
  const viewLabel = isSubrecipe ? 'View Subrecipe' : 'View Recipe';

  return `
    <article class="record-card module-record-card recipe-summary-card" style="--module-accent: ${escapeHtml(visual.accent)}; --module-accent-soft: ${escapeHtml(visual.soft)};">
      ${renderRecipeThumbnail(record, title, section)}
      <div class="recipe-summary-main">
        <div class="record-title-row">
          <div>
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h4>${escapeHtml(title)}</h4>
          </div>
          <div class="record-badges">
            <span class="status-badge">${renderIconLabel(status === 'active' ? 'check' : 'circle', formatRecordValue('status', status))}</span>
            <span class="status-badge ${escapeHtml(inventorySummary.className)}">${renderIconLabel(inventorySummary.icon, inventorySummary.label)}</span>
          </div>
        </div>
        <div class="recipe-summary-meta">
          ${categoryHtml}
          <span class="record-meta-chip">${renderIconLabel('box', `${ingredients.length} ${ingredients.length === 1 ? 'ingredient' : 'ingredients'}`)}</span>
          ${yieldLabel ? `<span class="record-meta-chip">${escapeHtml(`Yield ${yieldLabel}`)}</span>` : ''}
          ${!isSubrecipe && record?.prep_time ? `<span class="record-meta-chip">${renderIconLabel('clock', `Prep ${record.prep_time}`)}</span>` : ''}
          ${isSubrecipe && record?.cost_per_yield_unit ? `<span class="record-meta-chip">${escapeHtml(`Unit cost ${formatMoney(record.cost_per_yield_unit)}`)}</span>` : ''}
        </div>
      </div>
      <div class="record-actions recipe-summary-actions">
        <button type="button" class="primary-action icon-action" data-module-action="view-costing-record" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">${renderIconLabel(isSubrecipe ? 'layers' : 'book', viewLabel)}</button>
        <button type="button" class="secondary-action icon-action" data-module-action="edit" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">${renderIconLabel('pencil', 'Edit')}</button>
        <button type="button" class="secondary-action danger-action icon-action" data-module-action="archive" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">${renderIconLabel('archive', 'Archive')}</button>
      </div>
    </article>
  `;
}

function renderRecipeDetailMetaItem(label, value, icon = 'circle') {
  const cleanValue = value === null || value === undefined || value === '' ? 'Not set' : String(value);
  return `
    <div class="recipe-detail-meta-item">
      <span>${renderIcon(icon)}${escapeHtml(label)}</span>
      <strong>${escapeHtml(cleanValue)}</strong>
    </div>
  `;
}

function renderRecipeDetailIngredientRows(ingredients) {
  const normalizedIngredients = normalizeRecipeIngredients(ingredients);
  if (normalizedIngredients.length === 0) {
    return '<p class="recipe-ingredient-empty">No ingredients added yet.</p>';
  }

  return `
    <div class="recipe-detail-ingredient-table">
      <div class="recipe-detail-ingredient-head">
        <span>Ingredient</span>
        <span>Quantity</span>
        <span>Inventory</span>
        <span>Cost</span>
      </div>
      ${normalizedIngredients.map(ingredient => {
        const status = getIngredientInventoryStatus(ingredient);
        const quantity = formatIngredientQuantity(ingredient);
        const lineCost = formatMoney(calculateLineCostFromIngredient(ingredient));
        const title = ingredient.ingredientName || 'Ingredient';
        const detailLabel = ingredient.itemType === 'subrecipe'
          ? 'Subrecipe'
          : status.connected && status.item ? getInventoryHelperLabel(status.item) : 'Not in inventory';
        return `
          <div class="recipe-detail-ingredient-row">
            <div>
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(detailLabel)}</span>
            </div>
            <span>${escapeHtml(quantity)}</span>
            <span class="inventory-status-pill ${escapeHtml(status.className)}">
              ${renderIcon(status.icon)}
              <span>${escapeHtml(status.label)}</span>
            </span>
            <strong>${escapeHtml(lineCost)}</strong>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRecipeDetailTextSection(title, value) {
  return `
    <section class="recipe-detail-section">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(value || 'Not set')}</p>
    </section>
  `;
}

function renderRecipeDetailView(record) {
  return renderCostingDetailView('recipes', record);
}

function renderSubrecipeDetailView(record) {
  return renderCostingDetailView('subrecipes', record);
}

function renderCostingDetailView(section, record) {
  const title = getRecordTitle(section, record);
  const ingredients = normalizeRecipeIngredients(record?.ingredients);
  const inventorySummary = getRecipeInventoryConnectionSummary(ingredients);
  const photoUrl = getRecipePhotoUrl(record);
  const yieldLabel = formatRecipeYield(record) || 'Not set';
  const isSubrecipe = section === 'subrecipes';
  const photoHtml = photoUrl
    ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(title)} photo" loading="lazy">`
    : `<div class="recipe-detail-photo-empty">${renderIcon(isSubrecipe ? 'layers' : 'image')}<span>${isSubrecipe ? 'Reusable prep' : 'No photo yet'}</span></div>`;

  return `
    <div class="recipe-detail-view form-field-wide">
      <div class="recipe-detail-hero">
        <div class="recipe-detail-photo">${photoHtml}</div>
        <div class="recipe-detail-overview">
          <div class="record-badges">
            <span class="status-badge">${renderIconLabel((record?.status || 'active') === 'active' ? 'check' : 'circle', formatRecordValue('status', record?.status || 'active'))}</span>
            <span class="status-badge ${escapeHtml(inventorySummary.className)}">${renderIconLabel(inventorySummary.icon, inventorySummary.label)}</span>
          </div>
          <div class="recipe-detail-meta-grid">
            ${renderRecipeDetailMetaItem('Category', record?.category, 'tag')}
            ${renderRecipeDetailMetaItem('Yield quantity', yieldLabel, 'box')}
            ${isSubrecipe ? renderRecipeDetailMetaItem('Cost per yield', record?.cost_per_yield_unit ? formatMoney(record.cost_per_yield_unit) : null, 'tag') : renderRecipeDetailMetaItem('Prep time', record?.prep_time, 'clock')}
            ${isSubrecipe ? renderRecipeDetailMetaItem('Total cost', record?.total_cost ? formatMoney(record.total_cost) : null, 'tag') : renderRecipeDetailMetaItem('Cook time', record?.cook_time, 'clock')}
            ${renderRecipeDetailMetaItem('Ingredients', `${ingredients.length} ${ingredients.length === 1 ? 'ingredient' : 'ingredients'}`, 'checklist')}
            ${renderRecipeDetailMetaItem('Inventory', inventorySummary.label, inventorySummary.icon)}
          </div>
        </div>
      </div>

      <section class="recipe-detail-section">
        <h4>Ingredients</h4>
        ${renderRecipeDetailIngredientRows(ingredients)}
      </section>

      ${renderRecipeDetailTextSection('Procedure', record?.procedure || record?.instructions)}
      ${renderRecipeDetailTextSection('Notes', record?.notes)}

      <div class="recipe-detail-actions">
        <button type="button" class="primary-action icon-action" data-costing-detail-edit="${escapeHtml(record?.id || '')}" data-section="${escapeHtml(section)}">${renderIconLabel('pencil', isSubrecipe ? 'Edit Subrecipe' : 'Edit Recipe')}</button>
      </div>
    </div>
  `;
}

function renderInlineRecipeInventoryDatalist() {
  const options = getInventoryOptions().map(item => {
    const label = [item.category, getInventoryBaseUnit(item)].filter(Boolean).join(' / ');
    return `<option value="${escapeHtml(item.name)}"${label ? ` label="${escapeHtml(label)}"` : ''}></option>`;
  }).join('');

  return `<datalist id="recipe-inventory-options">${options}</datalist>`;
}

function renderRecipeInlineCard(record = null, { isNew = false } = {}) {
  const visual = getModuleVisual('recipes');
  const title = isNew ? 'New Recipe' : getRecordTitle('recipes', record);
  const status = record?.status || 'active';
  const seedIngredient = state.recipeInlineNewIngredient
    ? [createRecipeIngredientFromInventory(state.recipeInlineNewIngredient)]
    : [];
  const ingredients = isNew
    ? seedIngredient
    : normalizeRecipeIngredients(record?.ingredients);
  const recordIdAttr = record?.id ? ` data-record-id="${escapeHtml(record.id)}"` : '';
  const cardMode = isNew ? 'new' : 'existing';
  const missingCount = ingredients.filter(ingredient => !getIngredientInventoryStatus(ingredient).connected).length;
  const ingredientCountLabel = `${ingredients.length} ${ingredients.length === 1 ? 'ingredient' : 'ingredients'}`;
  const inventoryStateLabel = missingCount > 0 ? `${missingCount} missing inventory` : ingredients.length > 0 ? 'Inventory connected' : 'No ingredients yet';
  const inventoryStateIcon = missingCount > 0 ? 'alert' : ingredients.length > 0 ? 'check' : 'circle';
  const inventoryStateClass = missingCount > 0 ? 'status-badge-warning' : ingredients.length > 0 ? 'status-badge-success' : 'status-badge-muted';

  return `
    <article class="record-card module-record-card recipe-inline-card" style="--module-accent: ${escapeHtml(visual.accent)}; --module-accent-soft: ${escapeHtml(visual.soft)};" data-inline-recipe-card data-recipe-mode="${cardMode}"${recordIdAttr}>
      <div class="recipe-inline-card-header">
        <div class="recipe-inline-title-block">
          <span class="record-title-icon">${renderIcon(visual.icon)}</span>
          <div>
            <p class="eyebrow">Recipe workspace</p>
            <h4>${escapeHtml(title)}</h4>
          </div>
        </div>
        <div class="record-badges">
          <span class="status-badge">${renderIconLabel(status === 'active' ? 'check' : 'circle', formatRecordValue('status', status))}</span>
          <span class="status-badge">${renderIconLabel('box', ingredientCountLabel)}</span>
          <span class="status-badge ${inventoryStateClass}">${renderIconLabel(inventoryStateIcon, inventoryStateLabel)}</span>
        </div>
      </div>

      <label class="form-field form-field-wide recipe-inline-name-field">
        <span>Recipe name</span>
        <input type="text" value="${escapeHtml(isNew ? '' : title)}" placeholder="Recipe name" data-inline-recipe-name>
      </label>

      <section class="recipe-inline-ingredients">
        <div class="recipe-builder-heading">
          <span>Ingredients</span>
        </div>
        <div class="recipe-ingredient-list">
          <div class="recipe-ingredient-table-head">
            <span>Ingredient</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Inventory</span>
            <span></span>
          </div>
          <div class="recipe-inline-ingredient-rows" data-inline-recipe-ingredient-rows>
            ${renderInlineRecipeIngredientRows(ingredients)}
          </div>
        </div>
        <button type="button" class="secondary-action icon-action recipe-inline-add-ingredient" data-inline-recipe-add-ingredient>
          ${renderIconLabel('add', 'Add Ingredient')}
        </button>
      </section>

      <div class="recipe-inline-actions">
        <button type="button" class="primary-action icon-action" data-inline-recipe-save>
          ${renderIconLabel('save', isNew ? 'Save Recipe' : 'Save Changes')}
        </button>
        ${isNew ? `<button type="button" class="secondary-action icon-action" data-inline-recipe-cancel>${renderIconLabel('close', 'Cancel')}</button>` : ''}
        ${isNew ? '' : `<button type="button" class="secondary-action danger-action icon-action" data-inline-recipe-archive>${renderIconLabel('trash', 'Archive')}</button>`}
      </div>
    </article>
  `;
}

function renderInlineRecipeIngredientRows(ingredients) {
  const normalizedIngredients = normalizeRecipeIngredients(ingredients);
  if (normalizedIngredients.length === 0) return renderInlineRecipeIngredientEmpty();

  return normalizedIngredients
    .map((ingredient, index) => renderInlineRecipeIngredientRow(ingredient, index))
    .join('');
}

function renderInlineRecipeIngredientEmpty() {
  return '<p class="recipe-ingredient-empty" data-inline-recipe-empty>No ingredients added yet.</p>';
}

function renderInlineRecipeIngredientRow(ingredient, index) {
  const normalized = normalizeRecipeIngredient(ingredient) || normalizeRecipeIngredient({
    itemType: 'inventory',
    ingredientName: '',
    quantity: 1,
    unit: '',
    validationStatus: 'not_found'
  });
  const status = getIngredientInventoryStatus(normalized);
  const inventoryItem = status.item;
  const inventoryItemId = inventoryItem?.id || normalized.inventoryItemId || '';
  const unit = normalized.unit || (inventoryItem ? getInventoryBaseUnit(inventoryItem) : '');
  const helperLabel = status.connected && inventoryItem
    ? getInventoryHelperLabel(inventoryItem)
    : normalized.itemType === 'subrecipe' ? 'Subrecipe' : 'Ingredient';

  return `
    <div class="recipe-ingredient-row recipe-inline-ingredient-row"
      data-inline-recipe-ingredient-row
      data-ingredient-index="${index}"
      data-item-type="${escapeHtml(normalized.itemType || 'inventory')}"
      data-inventory-item-id="${escapeHtml(inventoryItemId)}"
      data-subrecipe-id="${escapeHtml(normalized.subrecipeId || '')}"
      data-item-code="${escapeHtml(normalized.itemCode || '')}">
      <label class="recipe-ingredient-name-field">
        <span>Ingredient</span>
        <input type="text" list="recipe-inventory-options" value="${escapeHtml(normalized.ingredientName)}" placeholder="Ingredient name" data-inline-recipe-ingredient-name>
        <small>${escapeHtml(helperLabel)}</small>
      </label>
      <label>
        <span>Qty</span>
        <input type="number" min="0" step="0.01" value="${escapeHtml(normalized.quantity)}" data-inline-recipe-ingredient-quantity>
      </label>
      <label>
        <span>Unit</span>
        <input type="text" value="${escapeHtml(unit)}" data-inline-recipe-ingredient-unit>
      </label>
      ${renderInlineRecipeInventoryStatusCell(normalized, index)}
      <button type="button" class="modal-icon-button icon-only-button" data-inline-recipe-ingredient-remove title="Remove ingredient" aria-label="Remove ingredient">${renderIcon('trash')}</button>
    </div>
  `;
}

function renderInlineRecipeInventoryStatusCell(ingredient) {
  const status = getIngredientInventoryStatus(ingredient);
  const actionHtml = status.connected || ingredient.itemType === 'subrecipe'
    ? ''
    : `<button type="button" class="secondary-action compact-icon-action recipe-add-inventory-action" data-inline-recipe-ingredient-add-inventory title="Add to Inventory" aria-label="Add ${escapeHtml(ingredient.ingredientName || 'ingredient')} to Inventory">${renderIconLabel('packageAdd', 'Add to Inventory')}</button>`;

  return `
    <div class="inventory-status-cell" data-inline-recipe-inventory-status>
      <span class="inventory-status-pill ${escapeHtml(status.className)}" title="${escapeHtml(status.label)}">
        ${renderIcon(status.icon)}
        <span>${escapeHtml(status.label)}</span>
      </span>
      ${actionHtml}
    </div>
  `;
}

function renderRecordCard(section, record) {
  const moduleConfig = getModuleConfig(section);
  const visual = getModuleVisual(section);
  const title = getRecordTitle(section, record);
  const status = record?.[moduleConfig.badgeField] || 'active';
  const categoryVisual = getInventoryCategoryVisual(record);
  const titleIcon = section === 'inventory' ? getInventoryIconName(record) : visual.icon;
  const titleIconTitle = section === 'inventory' ? record.category || 'Inventory item' : moduleConfig.title;
  const titleIconHtml = `<span class="record-title-icon ${section === 'inventory' ? categoryVisual.className : ''}" title="${escapeHtml(titleIconTitle)}">${renderIcon(titleIcon)}</span>`;
  const metaHtml = (moduleConfig.metaFields || [])
    .map(fieldName => formatRecordValue(fieldName, getRecordDisplayValue(section, fieldName, record)))
    .filter(Boolean)
    .map(value => `<span class="record-meta-chip">${escapeHtml(value)}</span>`)
    .join('');
  const detailHtml = (moduleConfig.detailFields || [])
    .map(fieldName => {
      const value = formatRecordValue(fieldName, getRecordDisplayValue(section, fieldName, record));
      if (!value) return '';
      return `
        <div class="record-detail">
          <span>${escapeHtml(formatLabel(fieldName))}</span>
          <p>${escapeHtml(value)}</p>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');
  const categoryHtml = section === 'inventory' && record.category
    ? `<span class="status-badge category-badge ${categoryVisual.className}">${renderIconLabel(categoryVisual.icon, record.category)}</span>`
    : '';
  const stateBadgesHtml = renderRecordStateBadges(section, record);

  return `
    <article class="record-card module-record-card" style="--module-accent: ${escapeHtml(visual.accent)}; --module-accent-soft: ${escapeHtml(visual.soft)};">
      <div class="record-card-main">
        <div class="record-title-row">
          <h4>${titleIconHtml}${escapeHtml(title)}</h4>
          <div class="record-badges">
            ${categoryHtml}
            ${stateBadgesHtml}
            <span class="status-badge">${renderIconLabel(status === 'active' ? 'check' : 'circle', formatRecordValue('status', status))}</span>
          </div>
        </div>
        ${metaHtml ? `<div class="record-meta">${metaHtml}</div>` : ''}
        ${detailHtml ? `<div class="record-details">${detailHtml}</div>` : ''}
        ${renderSpecialRecordDetails(section, record)}
      </div>
      <div class="record-actions">
        ${renderSpecialRecordActions(section, record)}
        <button type="button" class="secondary-action icon-action" data-module-action="edit" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">${renderIconLabel('pencil', 'Edit')}</button>
        <button type="button" class="secondary-action danger-action icon-action" data-module-action="archive" data-section="${escapeHtml(section)}" data-record-id="${escapeHtml(record.id)}">${renderIconLabel('archive', 'Archive')}</button>
      </div>
    </article>
  `;
}

function renderReportsSection(reportsData = state.reportsData) {
  const metrics = [
    ['total_recipes', 'Total recipes'],
    ['total_subrecipes', 'Total subrecipes'],
    ['total_inventory_items', 'Total inventory items'],
    ['total_menu_items', 'Total menu items'],
    ['total_recipe_cost', 'Total recipe cost'],
    ['low_margin_recipes', 'Low margin recipes'],
    ['incomplete_recipes', 'Incomplete recipes'],
    ['inventory_missing_price', 'Inputs without price'],
    ['inventory_missing_presentation', 'Inputs without presentation'],
    ['low_stock_items', 'Low stock items'],
    ['most_used_inventory', 'Most used input'],
    ['best_menu_margin', 'Best menu margin'],
    ['worst_menu_margin', 'Worst menu margin'],
    ['estimated_menu_profit', 'Estimated menu profit']
  ];
  const totalSourceRecords = (
    (reportsData?.total_recipes || 0)
    + (reportsData?.total_subrecipes || 0)
    + (reportsData?.total_inventory_items || 0)
    + (reportsData?.total_menu_items || 0)
  );

  els['module-count-badge'].textContent = `${metrics.length} metrics`;
  els['module-empty-state'].hidden = totalSourceRecords > 0;
  els['module-record-list'].hidden = totalSourceRecords === 0;
  if (totalSourceRecords === 0) {
    els['module-record-list'].innerHTML = '';
    updateDashboardCards(state.moduleCounts);
    return;
  }

  els['module-record-list'].innerHTML = `
    <div class="reports-grid">
      ${metrics.map(([key, label]) => `
        <article class="report-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(formatReportMetricValue(key, reportsData?.[key]))}</strong>
        </article>
      `).join('')}
    </div>
  `;
  updateDashboardCards(state.moduleCounts);
}

function formatReportMetricValue(key, value) {
  if (value === null || value === undefined || value === '') return key.includes('most_') || key.includes('menu_') ? 'Not available' : '0';
  if (key.includes('cost') || key.includes('profit')) return formatMoney(value);
  return String(value);
}

function getRecordDisplayValue(section, fieldName, record) {
  if (section === 'inventory') {
    if (fieldName === 'current_stock') return getInventoryCurrentStock(record);
    if (fieldName === 'minimum_stock') return getInventoryMinimumStock(record);
    if (fieldName === 'supplier') return getInventorySupplier(record);
    if (fieldName === 'base_unit') return getInventoryBaseUnit(record);
    if (fieldName === 'package_quantity') return getInventoryPackageQuantity(record);
    if (fieldName === 'package_price') return getInventoryPackagePrice(record);
    if (fieldName === 'package_unit') return getInventoryPackageUnit(record);
    if (fieldName === 'cost_per_unit') return calculateInventoryUnitCost(record);
  }

  return record?.[fieldName];
}

function formatIngredientQuantity(ingredient) {
  const quantity = Number(ingredient.quantity || 0);
  const quantityText = Number.isFinite(quantity) ? quantity.toLocaleString('en-US') : '0';
  return `${quantityText}${ingredient.unit ? ` ${ingredient.unit}` : ''}`;
}

function renderUnitOptions(selectedUnit = '') {
  const normalizedSelectedUnit = String(selectedUnit || '').trim();
  const hasCustomUnit = normalizedSelectedUnit
    && !COMMON_UNIT_OPTIONS.some(unit => unit.toLowerCase() === normalizedSelectedUnit.toLowerCase());
  const customOption = hasCustomUnit
    ? `<option value="${escapeHtml(normalizedSelectedUnit)}" selected>${escapeHtml(normalizedSelectedUnit)} (current)</option>`
    : '';

  return `
    <option value="">Select unit</option>
    ${customOption}
    ${COMMON_UNIT_OPTIONS.map(unit => {
      const selected = unit.toLowerCase() === normalizedSelectedUnit.toLowerCase() ? ' selected' : '';
      return `<option value="${escapeHtml(unit)}"${selected}>${escapeHtml(unit)}</option>`;
    }).join('')}
  `;
}

function renderRecipeIngredientSummary(record) {
  const ingredients = normalizeRecipeIngredients(record.ingredients);
  if (ingredients.length === 0) return '';

  return `
    <div class="recipe-ingredient-summary">
      <span>Ingredients</span>
      <ul>
        ${ingredients.map(ingredient => `
          <li>
            <span>${escapeHtml(ingredient.ingredientName || 'Ingredient')}</span>
            <span>${escapeHtml(formatIngredientQuantity(ingredient))} &middot; ${escapeHtml(formatMoney(calculateLineCostFromIngredient(ingredient)))} &middot; ${escapeHtml(formatLabel(ingredient.validationStatus))}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderInventoryUsageDetails(record) {
  const recipesUsingItem = getRecipesUsingInventoryItem(record.id);
  const subrecipesUsingItem = getSubrecipesUsingInventoryItem(record.id);
  const usageLabels = [
    ...recipesUsingItem.map(recipe => recipe.name),
    ...subrecipesUsingItem.map(subrecipe => `${subrecipe.name} (subrecipe)`)
  ];

  if (usageLabels.length === 0) {
    return `
      <div class="record-detail">
        <span>Recipe Usage</span>
        <p>Not used in recipes or subrecipes yet.</p>
      </div>
    `;
  }

  return `
    <div class="record-detail">
      <span>Recipe / Subrecipe Usage</span>
      <p>${escapeHtml(usageLabels.join(', '))}</p>
    </div>
  `;
}

function renderSpecialRecordDetails(section, record) {
  if (isCostingRecipeSection(section)) return renderRecipeIngredientSummary(record);
  if (section === 'inventory') return renderInventoryUsageDetails(record);
  return '';
}

function renderSpecialRecordActions(section, record) {
  if (section !== 'inventory') return '';

  return `
    <button type="button" class="secondary-action icon-action" data-module-action="use-in-recipe" data-section="inventory" data-record-id="${escapeHtml(record.id)}">${renderIconLabel('add', 'Use in recipe')}</button>
    <button type="button" class="secondary-action icon-action" data-module-action="add-to-recipe" data-section="inventory" data-record-id="${escapeHtml(record.id)}">${renderIconLabel('box', 'Add to recipe')}</button>
  `;
}

function getRecordById(section, recordId) {
  return (state.moduleRecords[section] || []).find(record => String(record.id) === String(recordId));
}

function renderImageFileField(field, value, requiredAttr = '', wideClass = '') {
  const imageUrl = getSafeImageUrl(value);
  return `
    <label class="form-field image-file-field${wideClass}" data-image-file-field>
      <span>${escapeHtml(field.label)}</span>
      <input type="hidden" name="${escapeHtml(field.name)}" value="${escapeHtml(value || '')}" data-image-file-value>
      <div class="image-file-control">
        <div class="image-file-preview${imageUrl ? '' : ' image-file-preview-empty'}" data-image-file-preview>
          ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(field.label)} preview">` : `${renderIcon('image')}<span>No image selected</span>`}
        </div>
        <div class="image-file-actions">
          <input type="file" accept="image/jpeg,image/png,image/webp"${requiredAttr} data-image-file-input data-image-file-target="${escapeHtml(field.name)}">
          <small>Choose a JPG, PNG, or WebP image. No URL needed.</small>
          <button type="button" class="secondary-action icon-action" data-image-file-remove="${escapeHtml(field.name)}"${imageUrl ? '' : ' hidden'}>${renderIconLabel('close', 'Remove image')}</button>
        </div>
      </div>
    </label>
  `;
}

function updateImageFileFieldPreview(fieldElement, imageValue = '') {
  if (!fieldElement) return;
  const preview = fieldElement.querySelector('[data-image-file-preview]');
  const hiddenInput = fieldElement.querySelector('[data-image-file-value]');
  const removeButton = fieldElement.querySelector('[data-image-file-remove]');
  const imageUrl = getSafeImageUrl(imageValue);

  if (hiddenInput) hiddenInput.value = imageUrl;
  if (removeButton) removeButton.hidden = !imageUrl;
  if (!preview) return;

  preview.classList.toggle('image-file-preview-empty', !imageUrl);
  preview.innerHTML = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Recipe photo preview">`
    : `${renderIcon('image')}<span>No image selected</span>`;
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

async function handleImageFileInputChange(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!RECIPE_IMAGE_MIME_TYPES.has(file.type)) {
    input.value = '';
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size > MAX_INLINE_RECIPE_IMAGE_BYTES) {
    input.value = '';
    throw new Error('Image is too large. Choose an image under 1.5 MB.');
  }

  const imageValue = await readImageFileAsDataUrl(file);
  updateImageFileFieldPreview(input.closest('[data-image-file-field]'), imageValue);
}

function clearImageFileField(button) {
  const fieldElement = button?.closest('[data-image-file-field]');
  const fileInput = fieldElement?.querySelector('[data-image-file-input]');
  if (fileInput) fileInput.value = '';
  updateImageFileFieldPreview(fieldElement, '');
}

function renderFormField(field, record = null) {
  if (field.type === 'section-heading') {
    return `
      <div class="form-section-heading${field.wide ? ' form-field-wide' : ''}">
        <span>${escapeHtml(field.label)}</span>
      </div>
    `;
  }

  const rawValue = record?.[field.name] ?? field.defaultValue ?? '';
  const value = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  const requiredAttr = field.required ? ' required' : '';
  const minAttr = field.min !== undefined ? ` min="${escapeHtml(field.min)}"` : '';
  const stepAttr = field.step !== undefined ? ` step="${escapeHtml(field.step)}"` : '';
  const placeholderAttr = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : '';
  const readonlyAttr = field.readonly ? ' readonly aria-readonly="true"' : '';
  const wideClass = field.wide || field.type === 'textarea' ? ' form-field-wide' : '';
  const readonlyClass = field.readonly ? ' form-field-readonly' : '';

  if (field.type === 'textarea') {
    return `
      <label class="form-field${wideClass}${readonlyClass}">
        <span>${escapeHtml(field.label)}</span>
        <textarea name="${escapeHtml(field.name)}"${requiredAttr}${placeholderAttr}${readonlyAttr}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  if (field.type === 'image-file') {
    return renderImageFileField(field, value, requiredAttr, wideClass);
  }

  if (field.type === 'recipe-select') {
    const recipes = (state.moduleRecords.recipes || []).filter(recipe => String(recipe.status || 'active') !== 'archived');
    const recipeOptions = recipes.length
      ? recipes.map(recipe => {
        const recipeCost = formatMoney(getRecipeCostForMenu(recipe));
        const selected = String(recipe.id) === String(value) ? ' selected' : '';
        return `<option value="${escapeHtml(recipe.id)}"${selected}>${escapeHtml(recipe.name)}${recipeCost ? ` - ${escapeHtml(recipeCost)}` : ''}</option>`;
      }).join('')
      : '<option value="">No recipes available</option>';

    return `
      <label class="form-field${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <select name="${escapeHtml(field.name)}"${requiredAttr}${recipes.length ? '' : ' disabled'}>
          <option value="">No linked recipe</option>
          ${recipeOptions}
        </select>
      </label>
    `;
  }

  if (field.type === 'inventory-category-select') {
    const hasExistingCustomValue = value && !INVENTORY_CATEGORY_OPTIONS.includes(value);
    const categoryOptions = INVENTORY_CATEGORY_OPTIONS
      .map(option => `<option value="${escapeHtml(option)}"${option === value ? ' selected' : ''}>${escapeHtml(option)}</option>`)
      .join('');

    return `
      <label class="form-field${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <select name="${escapeHtml(field.name)}"${requiredAttr}>
          <option value="">Select category</option>
          ${hasExistingCustomValue ? `<option value="${escapeHtml(value)}" selected>${escapeHtml(value)} (current)</option>` : ''}
          ${categoryOptions}
        </select>
      </label>
    `;
  }

  if (field.type === 'select' && Array.isArray(field.options)) {
    const optionsHtml = field.options.map(option => {
      const optionValue = typeof option === 'string' ? option : option.value;
      const optionLabel = typeof option === 'string' ? option : option.label;
      const selected = String(optionValue) === String(value || field.defaultValue || '') ? ' selected' : '';
      return `<option value="${escapeHtml(optionValue)}"${selected}>${escapeHtml(optionLabel)}</option>`;
    }).join('');

    return `
      <label class="form-field${wideClass}">
        <span>${escapeHtml(field.label)}</span>
        <select name="${escapeHtml(field.name)}"${requiredAttr}>
          ${optionsHtml}
        </select>
      </label>
    `;
  }

  return `
    <label class="form-field${wideClass}${readonlyClass}">
      <span>${escapeHtml(field.label)}</span>
      <input type="${escapeHtml(field.type || 'text')}" name="${escapeHtml(field.name)}" value="${escapeHtml(value)}"${requiredAttr}${minAttr}${stepAttr}${placeholderAttr}${readonlyAttr}>
    </label>
  `;
}

function getInventoryOptions() {
  return (state.moduleRecords.inventory || []).filter(item => String(item.status || 'active') !== 'archived');
}

function getInventoryOptionsForRecipeBuilder() {
  const options = getInventoryOptions();
  if (state.modalSection !== 'subrecipes' || !state.editingRecord?.id) return options;

  const editingName = normalizeIngredientNameForMatch(state.editingRecord.name);
  const editingCategory = String(state.editingRecord.category || 'Subrecipes').toLowerCase();
  return options.filter(item => !(
    normalizeIngredientNameForMatch(item.name) === editingName
    && String(item.category || '').toLowerCase() === editingCategory
  ));
}

function renderInventoryDuplicateSuggestion(name, excludeId = null, { compact = false } = {}) {
  const match = findMatchingInventoryIngredient(name, excludeId);
  if (!match) return '';

  const stock = formatRecordValue('current_stock', getInventoryCurrentStock(match));
  const details = [match.category, stock, getInventoryBaseUnit(match)].filter(Boolean).join(' / ');

  return `
    <div class="inventory-duplicate-suggestion${compact ? ' inventory-duplicate-suggestion-compact' : ''}">
      <strong>${escapeHtml(match.name)} already exists in Inventory.</strong>
      ${details ? `<span>${escapeHtml(details)}</span>` : ''}
      <button type="button" class="text-action" data-use-existing-ingredient="${escapeHtml(match.id)}">Use existing ingredient</button>
    </div>
  `;
}

function refreshInventoryDuplicateSuggestion() {
  const suggestion = els['module-form-fields'].querySelector('[data-inventory-duplicate-suggestion]');
  if (!suggestion) return;
  const nameInput = els['module-form-fields'].querySelector('input[name="name"]');
  suggestion.innerHTML = renderInventoryDuplicateSuggestion(nameInput?.value || '', state.editingRecord?.id);
}

function renderRecipeIngredientOptions() {
  const searchTerm = state.recipeIngredientSearch.trim().toLowerCase();
  const inventoryItems = getInventoryOptionsForRecipeBuilder();
  const filteredItems = searchTerm
    ? inventoryItems.filter(item => (
      String(item.name || '').toLowerCase().includes(searchTerm)
      || String(item.category || '').toLowerCase().includes(searchTerm)
      || String(item.supplier || item.vendor || '').toLowerCase().includes(searchTerm)
    ))
    : inventoryItems;

  if (filteredItems.length === 0) {
    return '<option value="">No inventory ingredient found</option>';
  }

  return [
    '<option value="">Select inventory ingredient</option>',
    ...filteredItems.map(item => {
      const cost = formatMoney(calculateInventoryUnitCost(item) || 0);
      const unit = getInventoryBaseUnit(item) ? ` / ${getInventoryBaseUnit(item)}` : '';
      return `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}${cost ? ` &middot; ${escapeHtml(cost)}${escapeHtml(unit)}` : ''}</option>`;
    })
  ].join('');
}

function renderInventoryCategoryOptions(selectedValue = 'Other') {
  const normalizedValue = String(selectedValue || 'Other');
  const hasExistingCustomValue = normalizedValue && !INVENTORY_CATEGORY_OPTIONS.includes(normalizedValue);
  return `
    ${hasExistingCustomValue ? `<option value="${escapeHtml(normalizedValue)}" selected>${escapeHtml(normalizedValue)} (current)</option>` : ''}
    ${INVENTORY_CATEGORY_OPTIONS.map(option => `<option value="${escapeHtml(option)}"${option === normalizedValue ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}
  `;
}

function getSubrecipeOptions() {
  return (state.moduleRecords.subrecipes || []).filter(item => (
    String(item.status || 'active') !== 'archived'
    && String(item.id) !== String(state.editingRecord?.id || '')
  ));
}

function renderSubrecipeOptions() {
  const searchTerm = state.subrecipeSearch.trim().toLowerCase();
  const subrecipes = getSubrecipeOptions();
  const filteredItems = searchTerm
    ? subrecipes.filter(item => (
      String(item.name || '').toLowerCase().includes(searchTerm)
      || String(item.recipe_number || '').toLowerCase().includes(searchTerm)
      || String(item.category || '').toLowerCase().includes(searchTerm)
    ))
    : subrecipes;

  if (filteredItems.length === 0) {
    return '<option value="">No subrecipes available</option>';
  }

  return [
    '<option value="">Select subrecipe</option>',
    ...filteredItems.map(item => {
      const cost = formatMoney(item.unit_cost_total ?? item.total_cost ?? item.total_ingredient_cost ?? 0);
      const code = item.recipe_number ? `${item.recipe_number} - ` : '';
      return `<option value="${escapeHtml(item.id)}">${escapeHtml(code)}${escapeHtml(item.name)}${cost ? ` &middot; ${escapeHtml(cost)}` : ''}</option>`;
    })
  ].join('');
}

function renderSubrecipePicker() {
  if (state.modalSection !== 'recipes') return '';

  return `
    <div class="recipe-ingredient-picker subrecipe-picker">
      <label class="form-field">
        <span>Subrecipe search</span>
        <input type="search" id="subrecipe-search" value="${escapeHtml(state.subrecipeSearch)}" placeholder="Sauce, base, dough">
      </label>
      <label class="form-field">
        <span>Subrecipe</span>
        <select id="recipe-subrecipe-select">
          ${renderSubrecipeOptions()}
        </select>
      </label>
      <label class="form-field">
        <span>Quantity</span>
        <input type="number" id="recipe-subrecipe-add-quantity" min="0" step="0.01" value="1">
      </label>
      <button type="button" class="secondary-action" id="recipe-add-selected-subrecipe">Add Subrecipe</button>
    </div>
  `;
}

function renderRecipeIngredientRows() {
  if (state.recipeIngredientsDraft.length === 0) {
    return `
      <div class="recipe-ingredient-list recipe-builder-ingredient-list">
        <div class="recipe-ingredient-table-head recipe-builder-ingredient-table-head">
          <span>Ingredient</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Inventory</span>
          <span>Cost</span>
          <span>Actions</span>
        </div>
        <p class="recipe-ingredient-empty">No ingredients added yet.</p>
      </div>
    `;
  }

  return `
    <div class="recipe-ingredient-list recipe-builder-ingredient-list">
      <div class="recipe-ingredient-table-head recipe-builder-ingredient-table-head">
        <span>Ingredient</span>
        <span>Qty</span>
        <span>Unit</span>
        <span>Inventory</span>
        <span>Cost</span>
        <span>Actions</span>
      </div>
      ${state.recipeIngredientsDraft.map((ingredient, index) => {
        const lineCost = formatMoney(calculateLineCostFromIngredient(ingredient));
        return `
          <div class="recipe-ingredient-row recipe-builder-ingredient-row" data-ingredient-index="${index}">
            ${renderRecipeIngredientNameCell(ingredient, index)}
            <label>
              <span>Qty</span>
              <input type="number" min="0" step="0.01" value="${escapeHtml(ingredient.quantity)}" data-recipe-ingredient-quantity="${index}">
            </label>
            <label>
              <span>Unit</span>
              <select data-recipe-ingredient-unit="${index}">
                ${renderUnitOptions(ingredient.unit)}
              </select>
            </label>
            ${renderRecipeInventoryStatusCell(ingredient, index)}
            <div class="recipe-ingredient-line-cost">
              <span>Cost</span>
              <strong>${escapeHtml(lineCost)}</strong>
            </div>
            <button type="button" class="modal-icon-button icon-only-button" data-recipe-ingredient-remove="${index}" title="Delete ingredient" aria-label="Delete ingredient">${renderIcon('trash')}</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRecipeIngredientNameCell(ingredient, index) {
  const status = getIngredientInventoryStatus(ingredient);
  const subtitle = ingredient.itemType === 'subrecipe'
    ? 'Subrecipe'
    : status.item ? getInventoryHelperLabel(status.item) : 'Ingredient';
  const helperHtml = state.modalSection === 'subrecipes'
    ? ''
    : `<small>${escapeHtml(subtitle)}</small>`;

  return `
    <label class="recipe-ingredient-name-field">
      <span>Ingredient</span>
      <input type="text" value="${escapeHtml(ingredient.ingredientName)}" placeholder="Ingredient name" data-recipe-ingredient-name="${index}">
      ${helperHtml}
    </label>
  `;
}

function renderRecipeInventoryStatusCell(ingredient, index) {
  const status = getIngredientInventoryStatus(ingredient);
  const isSubrecipeModal = state.modalSection === 'subrecipes';
  const addInventoryLabel = 'Add to Inventory';
  const actionHtml = status.connected || ingredient.itemType === 'subrecipe'
    ? ''
    : `<button type="button" class="secondary-action ${isSubrecipeModal ? 'icon-only-button subrecipe-modal-icon-action' : 'compact-icon-action'} recipe-add-inventory-action" data-recipe-ingredient-add-inventory="${index}" title="${escapeHtml(addInventoryLabel)}" aria-label="Add ${escapeHtml(ingredient.ingredientName || 'ingredient')} to Inventory">${isSubrecipeModal ? `${renderIcon('packageAdd')}<span class="visually-hidden">${escapeHtml(addInventoryLabel)}</span>` : renderIconLabel('packageAdd', addInventoryLabel)}</button>`;

  return `
    <div class="inventory-status-cell">
      <span class="inventory-status-pill ${escapeHtml(status.className)}" title="${escapeHtml(status.label)}">
        ${renderIcon(status.icon)}
        <span>${escapeHtml(status.label)}</span>
      </span>
      ${actionHtml}
    </div>
  `;
}

function getCurrentRecipeCostInputs() {
  const formData = new FormData(els['module-form']);
  return {
    yieldQuantity: formData.get('yield_quantity'),
    yieldUnit: formData.get('yield_unit'),
    portionCount: formData.get('pax') || formData.get('portion_count'),
    manualSalePrice: formData.get('manual_sale_price')
  };
}

function renderRecipeCostSummary() {
  const { yieldQuantity, yieldUnit, portionCount, manualSalePrice } = getCurrentRecipeCostInputs();
  const costs = calculateRecipeCosts(state.recipeIngredientsDraft, yieldQuantity, yieldUnit, portionCount, manualSalePrice);

  return `
    <div class="recipe-cost-summary">
      <div>
        <span>Total ingredient cost</span>
        <strong>${escapeHtml(formatMoney(costs.total_ingredient_cost))}</strong>
      </div>
      <div>
        <span>Waste</span>
        <strong>${escapeHtml(formatMoney(costs.waste_cost))}</strong>
      </div>
      <div>
        <span>Suggested sale price</span>
        <strong>${escapeHtml(formatMoney(costs.suggested_sale_price))}</strong>
      </div>
      <div>
        <span>Cost per yield/unit</span>
        <strong>${costs.cost_per_yield_unit === null ? 'Not set' : escapeHtml(formatMoney(costs.cost_per_yield_unit))}</strong>
      </div>
      <div>
        <span>Cost per portion</span>
        <strong>${costs.cost_per_portion === null ? 'Not set' : escapeHtml(formatMoney(costs.cost_per_portion))}</strong>
      </div>
      <div>
        <span>Margin</span>
        <strong>${costs.margin_percentage === null ? 'Not set' : escapeHtml(formatRecordValue('margin_percentage', costs.margin_percentage))}</strong>
      </div>
    </div>
  `;
}

function renderRecipeIngredientBuilder() {
  const searchValue = state.recipeIngredientSearch;
  const isSubrecipeModal = state.modalSection === 'subrecipes';
  const isRecipeModal = state.modalSection === 'recipes';
  const builderClass = isSubrecipeModal ? ' recipe-ingredient-builder-subrecipe' : '';
  const inventoryIntro = isSubrecipeModal
    ? 'Search Inventory, choose quantity and unit, then add the ingredient to this subrecipe.'
    : 'Search Inventory, choose quantity and unit, then add the ingredient to this recipe.';
  const headingCopy = isSubrecipeModal
    ? ''
    : '<p>Add ingredients to calculate this recipe cost.</p>';
  const inventoryIntroHtml = isSubrecipeModal
    ? ''
    : `<span>${escapeHtml(inventoryIntro)}</span>`;

  return `
    <section class="recipe-ingredient-builder${builderClass} form-field-wide" data-recipe-ingredient-builder>
      <div class="recipe-builder-heading">
        <span>Ingredients</span>
        ${headingCopy}
      </div>

      <div class="recipe-builder-panel recipe-builder-panel-inventory">
        <div class="recipe-builder-panel-heading">
          <strong>${renderIconLabel('search', 'Inventory ingredient')}</strong>
          ${inventoryIntroHtml}
        </div>
        <div class="recipe-ingredient-picker">
          <label class="form-field">
            <span>Search inventory</span>
            <input type="search" id="recipe-ingredient-search" value="${escapeHtml(searchValue)}" placeholder="Search by ingredient, category, or supplier">
          </label>
          <label class="form-field">
            <span>Inventory ingredient</span>
            <select id="recipe-ingredient-select">
              ${renderRecipeIngredientOptions()}
            </select>
          </label>
          <label class="form-field">
            <span>Quantity</span>
            <input type="number" id="recipe-ingredient-add-quantity" min="0" step="0.01" value="1">
          </label>
          <label class="form-field">
            <span>Unit</span>
            <select id="recipe-ingredient-add-unit">
              ${renderUnitOptions()}
            </select>
          </label>
          <button type="button" class="secondary-action icon-action" id="recipe-add-selected-ingredient">${renderIconLabel('add', 'Add selected')}</button>
        </div>
      </div>

      ${renderSubrecipePicker()}

      ${isSubrecipeModal ? `
        <div class="recipe-builder-panel recipe-builder-panel-create-inventory">
          <div class="recipe-builder-panel-heading">
            <strong>${renderIconLabel('packageAdd', 'Create inventory item')}</strong>
          </div>
          <div class="recipe-create-inventory-picker">
            <label class="form-field">
              <span>Ingredient name</span>
              <input type="text" id="recipe-new-inventory-name" value="${escapeHtml(searchValue)}" placeholder="Ingredient name" title="${escapeHtml(searchValue || 'Ingredient name')}">
            </label>
            <label class="form-field">
              <span>Category</span>
              <select id="recipe-new-inventory-category">
                ${renderInventoryCategoryOptions('Other')}
              </select>
            </label>
            <label class="form-field">
              <span>Base Unit</span>
              <select id="recipe-new-inventory-base-unit">
                ${renderUnitOptions()}
              </select>
            </label>
            <label class="form-field">
              <span>Cost / Price</span>
              <input type="number" id="recipe-new-inventory-package-price" min="0" step="0.01" value="0">
            </label>
            <label class="form-field">
              <span>Qty to add</span>
              <input type="number" id="recipe-new-inventory-add-quantity" min="0" step="0.01" value="1">
            </label>
            <button type="button" class="primary-action icon-action subrecipe-modal-icon-action" id="recipe-create-inventory-ingredient" title="Create and add" aria-label="Create inventory ingredient and add it to this subrecipe">${renderIconLabel('packageAdd', 'Create')}</button>
          </div>
        </div>
      ` : `
        <div class="recipe-builder-actions">
          <button type="button" class="primary-action icon-action" id="recipe-add-blank-ingredient">${renderIconLabel('add', 'Add Ingredient')}</button>
        </div>
      `}

      <div class="recipe-builder-heading recipe-builder-list-heading">
        <span>Ingredient list</span>
        ${isSubrecipeModal ? '' : `<p>Edit quantities or units here before saving the ${escapeHtml(isSubrecipeModal ? 'subrecipe' : 'recipe')}.</p>`}
      </div>
      ${renderRecipeIngredientRows()}
      ${isRecipeModal ? '' : `
        <div class="recipe-builder-heading recipe-builder-cost-heading">
          <span>Cost summary</span>
          ${isSubrecipeModal ? '' : '<p>Costs update from the ingredient table and Inventory package costs.</p>'}
        </div>
        ${renderRecipeCostSummary()}
      `}
    </section>
  `;
}

function refreshRecipeIngredientBuilder() {
  const builder = els['module-form-fields'].querySelector('[data-recipe-ingredient-builder]');
  if (!builder) return;
  builder.outerHTML = renderRecipeIngredientBuilder();
}

function refreshRecipeIngredientOptions() {
  const select = document.getElementById('recipe-ingredient-select');
  if (select) select.innerHTML = renderRecipeIngredientOptions();
}

function refreshSubrecipeOptions() {
  const select = document.getElementById('recipe-subrecipe-select');
  if (select) select.innerHTML = renderSubrecipeOptions();
}

function refreshRecipeCostSummary() {
  const summary = els['module-form-fields'].querySelector('.recipe-cost-summary');
  if (summary) summary.outerHTML = renderRecipeCostSummary();
}

function addRecipeIngredientToDraft(ingredient) {
  if (!ingredient?.inventoryItemId && !ingredient?.subrecipeId && !ingredient?.ingredientName) {
    throw new Error('Choose or name an ingredient first.');
  }

  const existingIndex = ingredient.inventoryItemId || ingredient.subrecipeId
    ? state.recipeIngredientsDraft.findIndex(item => (
      ingredient.itemType === 'subrecipe'
      ? String(item.subrecipeId) === String(ingredient.subrecipeId)
      : String(item.inventoryItemId) === String(ingredient.inventoryItemId)
    ))
    : -1;

  if (existingIndex >= 0) {
    const existing = state.recipeIngredientsDraft[existingIndex];
    const quantity = Number(existing.quantity || 0) + Number(ingredient.quantity || 0);
    state.recipeIngredientsDraft[existingIndex] = normalizeRecipeIngredient({
      ...existing,
      quantity
    });
    return;
  }

  state.recipeIngredientsDraft.push(ingredient);
}

function addBlankRecipeIngredient() {
  state.recipeIngredientsDraft.push(normalizeRecipeIngredient({
    itemType: 'inventory',
    ingredientName: '',
    quantity: 1,
    unit: '',
    packagePrice: null,
    packageQuantity: 1,
    validationStatus: 'not_found'
  }));
  refreshRecipeIngredientBuilder();
}

async function createInventoryIngredientFromSubrecipeModal() {
  const name = document.getElementById('recipe-new-inventory-name')?.value.trim();
  const category = document.getElementById('recipe-new-inventory-category')?.value.trim() || 'Other';
  const baseUnit = document.getElementById('recipe-new-inventory-base-unit')?.value.trim() || 'each';
  const packagePrice = Number(document.getElementById('recipe-new-inventory-package-price')?.value || 0);
  const quantityToAdd = Number(document.getElementById('recipe-new-inventory-add-quantity')?.value || 1);

  if (!name) throw new Error('Ingredient name is required.');
  if (!Number.isFinite(packagePrice) || packagePrice < 0) throw new Error('Package Price cannot be negative.');
  if (!Number.isFinite(quantityToAdd) || quantityToAdd < 0) throw new Error('Ingredient quantity cannot be negative.');

  const duplicate = findMatchingInventoryIngredient(name);
  if (duplicate) {
    const connectedIngredient = createRecipeIngredientFromInventory(duplicate, quantityToAdd || 1);
    addRecipeIngredientToDraft(normalizeRecipeIngredient({
      ...connectedIngredient,
      unit: baseUnit || connectedIngredient.unit
    }));
    state.recipeIngredientSearch = '';
    refreshRecipeIngredientBuilder();
    showToast(`${duplicate.name} connected from inventory.`);
    return duplicate;
  }

  const payload = {
    name,
    category,
    base_unit: baseUnit,
    unit: baseUnit,
    package_quantity: 1,
    package_unit: baseUnit,
    package_price: packagePrice,
    current_stock: 0,
    minimum_stock: 0,
    supplier: null,
    status: 'active'
  };
  payload.cost_per_unit = calculateInventoryUnitCost(payload) || 0;

  const createdIngredient = await createRecord(MODULE_SECTIONS.inventory.table, payload);
  await loadModuleData('inventory');
  addRecipeIngredientToDraft(createRecipeIngredientFromInventory(createdIngredient, quantityToAdd || 1));
  state.recipeIngredientSearch = '';
  refreshRecipeIngredientBuilder();
  showToast(`${createdIngredient.name} added to inventory and connected.`);
  return createdIngredient;
}

function connectRecipeIngredientDraftToInventory(index, inventoryItem, draftIngredient) {
  const ingredient = normalizeRecipeIngredient(draftIngredient || state.recipeIngredientsDraft[Number(index)]);
  const quantity = Number(ingredient?.quantity);
  const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
  const connectedIngredient = createRecipeIngredientFromInventory(
    inventoryItem,
    safeQuantity > 0 ? safeQuantity : 1
  );

  state.recipeIngredientsDraft[Number(index)] = normalizeRecipeIngredient({
    ...connectedIngredient,
    quantity: safeQuantity,
    unit: ingredient?.unit || getInventoryBaseUnit(inventoryItem)
  });
}

async function addRecipeIngredientRowToInventory(index) {
  const draftIngredient = state.recipeIngredientsDraft[Number(index)];
  if (!draftIngredient) throw new Error('Choose a valid recipe ingredient.');
  const ingredient = normalizeRecipeIngredient(draftIngredient);
  const name = String(ingredient.ingredientName || '').trim();
  if (!name) throw new Error('Ingredient name is required before adding it to inventory.');

  const duplicate = findMatchingInventoryIngredient(name);
  if (duplicate) {
    connectRecipeIngredientDraftToInventory(index, duplicate, ingredient);
    refreshRecipeIngredientBuilder();
    showToast(`${duplicate.name} connected from inventory.`);
    return duplicate;
  }

  const payload = {
    name,
    category: 'Other',
    base_unit: ingredient.unit || 'each',
    unit: ingredient.unit || 'each',
    package_quantity: 1,
    package_unit: ingredient.unit || 'each',
    package_price: 0,
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    supplier: null,
    status: 'active'
  };

  const createdIngredient = await createRecord(MODULE_SECTIONS.inventory.table, payload);
  await loadModuleData('inventory');
  connectRecipeIngredientDraftToInventory(index, createdIngredient, ingredient);
  refreshRecipeIngredientBuilder();
  showToast(`${createdIngredient.name} added to inventory and connected.`);
  return createdIngredient;
}

function getInlineRecipeCardRecord(card) {
  const recordId = card?.dataset.recordId;
  return recordId ? getRecordById('recipes', recordId) : null;
}

function syncInlineRecipeIngredientIndexes(card) {
  const rows = Array.from(card.querySelectorAll('[data-inline-recipe-ingredient-row]'));
  rows.forEach((row, index) => {
    row.dataset.ingredientIndex = String(index);
  });

  const rowContainer = card.querySelector('[data-inline-recipe-ingredient-rows]');
  if (!rowContainer) return;
  const emptyState = rowContainer.querySelector('[data-inline-recipe-empty]');
  if (rows.length === 0 && !emptyState) {
    rowContainer.innerHTML = renderInlineRecipeIngredientEmpty();
  }
  if (rows.length > 0 && emptyState) {
    emptyState.remove();
  }
}

function getInlineRecipeIngredientFromRow(row, { requireName = false } = {}) {
  const name = row.querySelector('[data-inline-recipe-ingredient-name]')?.value.trim() || '';
  const quantity = Number(row.querySelector('[data-inline-recipe-ingredient-quantity]')?.value || 0);
  const unit = row.querySelector('[data-inline-recipe-ingredient-unit]')?.value.trim() || '';
  const itemType = row.dataset.itemType || 'inventory';
  const linkedInventoryItem = row.dataset.inventoryItemId
    ? getInventoryOptions().find(item => String(item.id) === String(row.dataset.inventoryItemId))
    : null;
  const shouldKeepLinkedInventory = itemType === 'subrecipe'
    || !linkedInventoryItem
    || normalizeIngredientNameForMatch(name) === normalizeIngredientNameForMatch(linkedInventoryItem.name);
  if (requireName && !name) throw new Error('Ingredient name is required before adding it to inventory.');
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(`${name || 'Ingredient'} quantity cannot be negative.`);
  }

  const baseIngredient = normalizeRecipeIngredient({
    itemType,
    inventoryItemId: shouldKeepLinkedInventory ? (row.dataset.inventoryItemId || '') : '',
    subrecipeId: row.dataset.subrecipeId || '',
    itemCode: shouldKeepLinkedInventory ? (row.dataset.itemCode || '') : '',
    ingredientName: name,
    quantity,
    unit,
    validationStatus: shouldKeepLinkedInventory && row.dataset.inventoryItemId ? 'valid' : 'not_found'
  });

  if (!baseIngredient || baseIngredient.itemType === 'subrecipe') return baseIngredient;

  const status = getIngredientInventoryStatus(baseIngredient);
  if (!status.item) return baseIngredient;

  return normalizeRecipeIngredient({
    ...createRecipeIngredientFromInventory(status.item, quantity),
    unit: unit || getInventoryBaseUnit(status.item)
  });
}

function collectInlineRecipeIngredients(card) {
  const rows = Array.from(card.querySelectorAll('[data-inline-recipe-ingredient-row]'));
  const ingredients = rows
    .map(row => getInlineRecipeIngredientFromRow(row))
    .filter(ingredient => (
      ingredient
      && (
        ingredient.ingredientName
        || ingredient.inventoryItemId
        || ingredient.subrecipeId
      )
    ));

  if (ingredients.length === 0) {
    throw new Error('Add at least one ingredient before saving this recipe.');
  }

  ingredients.forEach(ingredient => {
    if (!String(ingredient.ingredientName || '').trim()) {
      throw new Error('Every ingredient needs a name before saving.');
    }
  });

  return ingredients;
}

function syncInlineRecipeRowWithInventory(row, inventoryItem, draftIngredient = null) {
  if (!row || !inventoryItem) return;
  const nameInput = row.querySelector('[data-inline-recipe-ingredient-name]');
  const unitInput = row.querySelector('[data-inline-recipe-ingredient-unit]');
  const quantityInput = row.querySelector('[data-inline-recipe-ingredient-quantity]');
  const quantity = Number(quantityInput?.value || draftIngredient?.quantity || 0);
  const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
  const ingredient = normalizeRecipeIngredient({
    ...createRecipeIngredientFromInventory(inventoryItem, safeQuantity > 0 ? safeQuantity : 1),
    quantity: safeQuantity,
    unit: unitInput?.value.trim() || draftIngredient?.unit || getInventoryBaseUnit(inventoryItem)
  });

  row.dataset.itemType = 'inventory';
  row.dataset.inventoryItemId = inventoryItem.id || '';
  row.dataset.subrecipeId = '';
  row.dataset.itemCode = draftIngredient?.itemCode || '';
  if (nameInput) nameInput.value = inventoryItem.name || nameInput.value;
  if (unitInput && !unitInput.value.trim()) unitInput.value = getInventoryBaseUnit(inventoryItem) || '';
  const statusCell = row.querySelector('[data-inline-recipe-inventory-status]');
  if (statusCell) statusCell.outerHTML = renderInlineRecipeInventoryStatusCell(ingredient);
  const helper = row.querySelector('.recipe-ingredient-name-field small');
  if (helper) helper.textContent = getInventoryHelperLabel(inventoryItem);
}

function syncInlineRecipeRowInventoryStatus(row) {
  if (!row || row.dataset.itemType === 'subrecipe') return;
  const ingredient = getInlineRecipeIngredientFromRow(row);
  const status = getIngredientInventoryStatus(ingredient);
  if (status.item) {
    syncInlineRecipeRowWithInventory(row, status.item, ingredient);
    return;
  }

  row.dataset.inventoryItemId = '';
  row.dataset.itemCode = '';
  const statusCell = row.querySelector('[data-inline-recipe-inventory-status]');
  if (statusCell) statusCell.outerHTML = renderInlineRecipeInventoryStatusCell({
    ...ingredient,
    inventoryItemId: '',
    itemCode: '',
    validationStatus: 'not_found'
  });
  const helper = row.querySelector('.recipe-ingredient-name-field small');
  if (helper) helper.textContent = 'Ingredient';
}

async function addInlineRecipeIngredientToInventory(card, row) {
  const ingredient = getInlineRecipeIngredientFromRow(row, { requireName: true });
  if (ingredient.itemType === 'subrecipe') throw new Error('Subrecipes are already connected as reusable preparations.');
  const duplicate = findMatchingInventoryIngredient(ingredient.ingredientName);
  if (duplicate) {
    syncInlineRecipeRowWithInventory(row, duplicate, ingredient);
    showToast(`${duplicate.name} connected from inventory.`);
    return duplicate;
  }

  const unit = ingredient.unit || 'each';
  const payload = {
    name: ingredient.ingredientName,
    category: 'Other',
    base_unit: unit,
    unit,
    package_quantity: 1,
    package_unit: unit,
    package_price: 0,
    current_stock: 0,
    minimum_stock: 0,
    cost_per_unit: 0,
    supplier: null,
    status: 'active'
  };

  const createdIngredient = await createRecord(MODULE_SECTIONS.inventory.table, payload);
  await loadInventoryForRecipeUsage();
  syncInlineRecipeRowWithInventory(row, createdIngredient, ingredient);
  showToast(`${createdIngredient.name} added to inventory and connected.`);

  if (card.dataset.recipeMode !== 'new') {
    await saveInlineRecipeCard(card, { silent: true });
  }

  return createdIngredient;
}

function appendInlineRecipeIngredientRow(card, ingredient = null) {
  const rowContainer = card.querySelector('[data-inline-recipe-ingredient-rows]');
  if (!rowContainer) return;
  const emptyState = rowContainer.querySelector('[data-inline-recipe-empty]');
  if (emptyState) emptyState.remove();
  const index = rowContainer.querySelectorAll('[data-inline-recipe-ingredient-row]').length;
  rowContainer.insertAdjacentHTML('beforeend', renderInlineRecipeIngredientRow(ingredient || {
    itemType: 'inventory',
    ingredientName: '',
    quantity: 1,
    unit: '',
    validationStatus: 'not_found'
  }, index));
  syncInlineRecipeIngredientIndexes(card);
}

async function saveInlineRecipeCard(card, { silent = false } = {}) {
  const isNew = card.dataset.recipeMode === 'new';
  const record = getInlineRecipeCardRecord(card);
  const name = card.querySelector('[data-inline-recipe-name]')?.value.trim() || '';
  if (!name) throw new Error('Recipe name is required.');
  if (!isNew && !record?.id) throw new Error('Recipe record was not found. Reload Recipes and try again.');

  await loadInventoryForRecipeUsage();
  const ingredients = collectInlineRecipeIngredients(card);
  const source = { ...record, name };
  const payload = {
    name,
    status: record?.status || 'active',
    ...calculateRecipeCostFields(source, ingredients)
  };
  const savedRecord = isNew
    ? await createRecord(MODULE_SECTIONS.recipes.table, payload)
    : await updateRecord(MODULE_SECTIONS.recipes.table, record.id, payload);

  await recalculateMenuItemsForRecipes([savedRecord.id]);
  if (isNew) {
    state.recipeInlineNewOpen = false;
    state.recipeInlineNewIngredient = null;
  }
  await loadModuleData('recipes');
  await loadDashboardCounts();
  updateDashboardCards();
  renderModuleList('recipes', state.moduleRecords.recipes || []);
  if (!silent) showToast(isNew ? 'Recipe created.' : 'Recipe updated.');
  return savedRecord;
}

async function loadInventoryOptionsForRecipe() {
  try {
    await loadModuleData('inventory');
    if (state.modalSection === 'recipes') await loadSubrecipesForRecipeUsage();
    refreshRecipeIngredientBuilder();
  } catch (error) {
    showAlert(els['module-form-message'], error.message || 'Unable to load inventory ingredients.');
  }
}

async function saveQuickInventoryIngredient() {
  const name = document.getElementById('quick-ingredient-name')?.value.trim();
  if (!name) throw new Error('Ingredient name is required.');

  const duplicate = findMatchingInventoryIngredient(name);
  if (duplicate) {
    addRecipeIngredientToDraft(createRecipeIngredientFromInventory(duplicate));
    state.recipeIngredientSearch = '';
    state.recipeQuickIngredientOpen = false;
    refreshRecipeIngredientBuilder();
    showToast(`${duplicate.name} connected from inventory.`);
    return duplicate;
  }

  const payload = {
    name,
    category: document.getElementById('quick-ingredient-category')?.value.trim() || null,
    base_unit: document.getElementById('quick-ingredient-unit')?.value.trim() || null,
    package_quantity: normalizePayloadValue({ type: 'number' }, document.getElementById('quick-ingredient-package-quantity')?.value || '1'),
    package_unit: document.getElementById('quick-ingredient-package-unit')?.value.trim() || null,
    package_price: normalizePayloadValue({ type: 'number' }, document.getElementById('quick-ingredient-package-price')?.value || '0'),
    current_stock: normalizePayloadValue({ type: 'number' }, document.getElementById('quick-ingredient-current-stock')?.value || '0'),
    minimum_stock: normalizePayloadValue({ type: 'number' }, document.getElementById('quick-ingredient-minimum-stock')?.value || '0'),
    supplier: document.getElementById('quick-ingredient-supplier')?.value.trim() || null,
    status: 'active'
  };

  requireNonNegativeNumber(payload.package_price, 'Package Price', { allowNull: false });
  const packageQuantity = requireNonNegativeNumber(payload.package_quantity, 'Package Quantity', { allowNull: false });
  if (packageQuantity === 0) throw new Error('Package Quantity cannot be 0.');
  requireNonNegativeNumber(payload.current_stock, 'Current Stock', { allowNull: false });
  requireNonNegativeNumber(payload.minimum_stock, 'Minimum Stock', { allowNull: false });
  payload.unit = payload.base_unit;
  payload.cost_per_unit = calculateInventoryUnitCost(payload) || 0;

  const createdIngredient = await createRecord(MODULE_SECTIONS.inventory.table, payload);
  await loadModuleData('inventory');
  addRecipeIngredientToDraft(createRecipeIngredientFromInventory(createdIngredient));
  state.recipeIngredientSearch = '';
  state.recipeQuickIngredientOpen = false;
  refreshRecipeIngredientBuilder();
  showToast(`${createdIngredient.name} added to inventory and recipe.`);
}

function openModuleModal(section, record = null, options = {}) {
  const moduleConfig = getModuleConfig(section);
  if (!moduleConfig.table) return;

  state.modalSection = section;
  state.editingRecord = record;
  state.recipeIngredientSearch = '';
  state.subrecipeSearch = '';
  state.recipeQuickIngredientOpen = false;
  state.recipeIngredientsDraft = isCostingRecipeSection(section)
    ? normalizeRecipeIngredients(record?.ingredients)
    : [];
  if (section === 'recipes' && !record?.id && options.preselectedIngredient) {
    state.recipeIngredientsDraft = [createRecipeIngredientFromInventory(options.preselectedIngredient)];
  }

  showAlert(els['module-form-message'], '');
  els['module-form'].classList.remove('module-form-detail-mode');
  els['module-save-button'].hidden = false;
  els['module-cancel-button'].textContent = 'Cancel';
  els['module-modal-title'].textContent = record
    ? `Edit ${moduleConfig.singular}`
    : moduleConfig.action;
  els['module-modal-subtitle'].textContent = record
    ? `Update this ${moduleConfig.singular} for ${state.activeClient?.name || 'this workspace'}.`
    : `Create a new ${moduleConfig.singular} for ${state.activeClient?.name || 'this workspace'}.`;
  els['module-save-button'].textContent = record ? 'Save Changes' : moduleConfig.action;
  els['module-save-button'].classList.remove('icon-action');
  els['module-modal-close'].textContent = 'Close';
  els['module-modal-close'].classList.remove('icon-action');
  els['module-modal'].dataset.modalSection = section;
  const formRecord = section === 'subrecipes' ? getSubrecipeFormRecord(record) : record;
  const baseFieldsHtml = moduleConfig.fields
    .map(field => renderFormField(field, formRecord))
    .join('');
  els['module-form-fields'].innerHTML = isCostingRecipeSection(section)
    ? `${baseFieldsHtml}${renderRecipeIngredientBuilder()}`
    : section === 'inventory'
      ? `${baseFieldsHtml}<div class="form-field-wide" data-inventory-duplicate-suggestion></div>`
    : baseFieldsHtml;
  els['module-modal'].hidden = false;
  const firstInput = els['module-form-fields'].querySelector('input, textarea, select');
  if (firstInput) firstInput.focus();

  if (isCostingRecipeSection(section)) {
    loadInventoryOptionsForRecipe();
  }

  if (section === 'inventory') {
    refreshInventoryDuplicateSuggestion();
  }
}

function openRecipeDetailModal(record) {
  openCostingDetailModal('recipes', record);
}

function openCostingDetailModal(section, record) {
  if (!record?.id || !isCostingRecipeSection(section)) return;
  const moduleConfig = getModuleConfig(section);
  state.modalSection = `${section}-details`;
  state.editingRecord = record;
  state.recipeIngredientsDraft = [];
  state.recipeIngredientSearch = '';
  state.subrecipeSearch = '';
  state.recipeQuickIngredientOpen = false;
  showAlert(els['module-form-message'], '');
  els['module-form'].classList.add('module-form-detail-mode');
  els['module-modal-title'].textContent = getRecordTitle(section, record);
  els['module-modal-subtitle'].textContent = `Complete ${moduleConfig.singular} details for ${state.activeClient?.name || 'this workspace'}.`;
  els['module-save-button'].hidden = true;
  els['module-cancel-button'].textContent = 'Close';
  els['module-modal-close'].textContent = 'Close';
  els['module-modal-close'].classList.remove('icon-action');
  els['module-modal'].dataset.modalSection = `${section}-details`;
  els['module-form-fields'].innerHTML = renderCostingDetailView(section, record);
  els['module-modal'].hidden = false;
}

function closeModuleModal() {
  state.modalSection = null;
  state.editingRecord = null;
  state.recipeIngredientsDraft = [];
  state.recipeIngredientSearch = '';
  state.subrecipeSearch = '';
  state.recipeQuickIngredientOpen = false;
  state.recipeLinkIngredient = null;
  els['module-modal'].hidden = true;
  delete els['module-modal'].dataset.modalSection;
  els['module-form'].classList.remove('module-form-detail-mode');
  els['module-save-button'].hidden = false;
  els['module-cancel-button'].textContent = 'Cancel';
  els['module-form'].reset();
  els['module-form-fields'].innerHTML = '';
  showAlert(els['module-form-message'], '');
}

function buildModulePayload(section) {
  const moduleConfig = getModuleConfig(section);
  const formData = new FormData(els['module-form']);
  const payload = {};

  moduleConfig.fields.forEach(field => {
    if (field.type === 'section-heading') return;

    const rawValue = String(formData.get(field.name) || '').trim();
    if (field.required && !rawValue) {
      throw new Error(`${field.label} is required.`);
    }

    if (field.name === 'status' && !rawValue) {
      payload[field.name] = field.defaultValue || 'active';
      return;
    }

    payload[field.name] = normalizePayloadValue(field, rawValue);
    if (field.type === 'number' && payload[field.name] !== null && Number(payload[field.name]) < 0) {
      throw new Error(`${field.label} cannot be negative.`);
    }
  });

  if (section === 'inventory') {
    const duplicate = findMatchingInventoryIngredient(payload.name, state.editingRecord?.id);
    if (duplicate) {
      throw new Error(`${duplicate.name} already exists in Inventory. Use the existing ingredient instead of creating a duplicate.`);
    }

    const packageQuantity = requireNonNegativeNumber(payload.package_quantity, 'Package Quantity', { allowNull: false });
    if (packageQuantity === 0) throw new Error('Package Quantity cannot be 0.');
    if (payload.package_price !== null) {
      requireNonNegativeNumber(payload.package_price, 'Package Price', { allowNull: false });
    }

    ['current_stock', 'minimum_stock'].forEach(fieldName => {
      payload[fieldName] = payload[fieldName] === null ? 0 : payload[fieldName];
      requireNonNegativeNumber(payload[fieldName], formatLabel(fieldName), { allowNull: false });
    });

    payload.unit = payload.base_unit;
    payload.cost_per_unit = calculateInventoryUnitCost(payload) || 0;
  }

  if (isCostingRecipeSection(section)) {
    if (section === 'recipes' && payload.cook_time === null) {
      delete payload.cook_time;
    }

    const normalizedIngredients = state.recipeIngredientsDraft
      .map(normalizeRecipeIngredient)
      .filter(ingredient => (
        ingredient
        && (
          ingredient.ingredientName
          || ingredient.inventoryItemId
          || ingredient.subrecipeId
        )
      ));
    if (normalizedIngredients.length === 0) {
      throw new Error(`Add at least one inventory input before saving this ${MODULE_SECTIONS[section].singular}.`);
    }

    normalizedIngredients.forEach(ingredient => {
      if (!String(ingredient.ingredientName || '').trim()) {
        throw new Error('Every ingredient needs a name before saving.');
      }
      if (Number(ingredient.quantity) < 0) {
        throw new Error(`${ingredient.ingredientName || 'Ingredient'} quantity cannot be negative.`);
      }
    });

    Object.assign(payload, calculateRecipeCostFields({ ...state.editingRecord, ...payload }, normalizedIngredients));
  }

  if (section === 'menu') {
    const recipeId = payload.recipe_id;
    const recipe = recipeId
      ? (state.moduleRecords.recipes || []).find(row => String(row.id) === String(recipeId))
      : null;

    if (recipeId && !recipe) throw new Error('Choose a valid linked recipe.');
    if (recipe && getRecipeCostForMenu(recipe) === 0 && String(payload.status || 'active') === 'active') {
      throw new Error('This recipe cost is 0. Add ingredients and costs before activating this menu item.');
    }

    Object.assign(payload, buildMenuCostFields(recipe, payload.sale_price));
  }

  return payload;
}

async function recalculateMenuItemsForRecipes(recipeIds = []) {
  const ids = new Set(recipeIds.map(String).filter(Boolean));
  if (ids.size === 0) return 0;

  await loadRecipesForInventoryUsage();
  const clientId = getActiveClientId();
  if (!clientId) return 0;

  const { data, error } = await withActiveRecordFilter(
    requireSupabaseClient()
      .from(MODULE_SECTIONS.menu.table)
      .select('*')
      .eq('client_id', clientId)
  );

  if (error) throw error;

  const menuItems = data || [];
  state.moduleRecords.menu = menuItems;
  let updatedCount = 0;

  for (const item of menuItems) {
    if (!ids.has(String(item.recipe_id))) continue;
    const recipe = (state.moduleRecords.recipes || []).find(row => String(row.id) === String(item.recipe_id));
    const costFields = buildMenuCostFields(recipe, item.sale_price);
    await updateRecord(MODULE_SECTIONS.menu.table, item.id, costFields);
    updatedCount += 1;
  }

  return updatedCount;
}

async function recalculateRecipesUsingInventoryItem(inventoryItem) {
  if (!inventoryItem?.id) return [];
  const inventoryRecords = state.moduleRecords.inventory || [];
  const existingInventoryIndex = inventoryRecords.findIndex(item => String(item.id) === String(inventoryItem.id));
  state.moduleRecords.inventory = existingInventoryIndex >= 0
    ? inventoryRecords.map(item => (String(item.id) === String(inventoryItem.id) ? inventoryItem : item))
    : [...inventoryRecords, inventoryItem];
  await loadRecipesForInventoryUsage();
  const itemCode = normalizeInventoryCode(inventoryItem.item_code);
  const updatedRecipeIds = [];

  for (const recipe of state.moduleRecords.recipes || []) {
    const ingredients = normalizeRecipeIngredients(recipe.ingredients);
    const usesIngredient = ingredients.some(ingredient => (
      String(ingredient.inventoryItemId) === String(inventoryItem.id)
      || (itemCode && normalizeInventoryCode(ingredient.itemCode) === itemCode)
    ));
    if (!usesIngredient) continue;

    const costFields = calculateRecipeCostFields(recipe, ingredients);
    await updateRecord(MODULE_SECTIONS.recipes.table, recipe.id, costFields);
    updatedRecipeIds.push(recipe.id);
  }

  if (updatedRecipeIds.length > 0) {
    await loadRecipesForInventoryUsage();
    await recalculateMenuItemsForRecipes(updatedRecipeIds);
  }

  return updatedRecipeIds;
}

async function recalculateSubrecipesUsingInventoryItem(inventoryItem) {
  if (!inventoryItem?.id) return [];
  const inventoryRecords = state.moduleRecords.inventory || [];
  const existingInventoryIndex = inventoryRecords.findIndex(item => String(item.id) === String(inventoryItem.id));
  state.moduleRecords.inventory = existingInventoryIndex >= 0
    ? inventoryRecords.map(item => (String(item.id) === String(inventoryItem.id) ? inventoryItem : item))
    : [...inventoryRecords, inventoryItem];
  await loadSubrecipesForRecipeUsage();
  const itemCode = normalizeInventoryCode(inventoryItem.item_code);
  const updatedSubrecipes = [];

  for (const subrecipe of state.moduleRecords.subrecipes || []) {
    const ingredients = normalizeRecipeIngredients(subrecipe.ingredients);
    const usesIngredient = ingredients.some(ingredient => (
      String(ingredient.inventoryItemId) === String(inventoryItem.id)
      || (itemCode && normalizeInventoryCode(ingredient.itemCode) === itemCode)
    ));
    if (!usesIngredient) continue;

    const costFields = calculateRecipeCostFields(subrecipe, ingredients);
    const updatedSubrecipe = await updateRecord(MODULE_SECTIONS.subrecipes.table, subrecipe.id, costFields);
    updatedSubrecipes.push(updatedSubrecipe);
  }

  if (updatedSubrecipes.length > 0) {
    state.moduleRecords.subrecipes = state.moduleRecords.subrecipes.map(subrecipe => {
      const updatedSubrecipe = updatedSubrecipes.find(item => String(item.id) === String(subrecipe.id));
      return updatedSubrecipe || subrecipe;
    });

    for (const updatedSubrecipe of updatedSubrecipes) {
      await recalculateRecipesUsingSubrecipe(updatedSubrecipe);
      await upsertSubrecipeInventoryItem(updatedSubrecipe);
    }
  }

  return updatedSubrecipes;
}

async function recalculateRecipesUsingSubrecipe(subrecipe) {
  if (!subrecipe?.id) return [];
  const subrecipeRecords = state.moduleRecords.subrecipes || [];
  const existingSubrecipeIndex = subrecipeRecords.findIndex(item => String(item.id) === String(subrecipe.id));
  state.moduleRecords.subrecipes = existingSubrecipeIndex >= 0
    ? subrecipeRecords.map(item => (String(item.id) === String(subrecipe.id) ? subrecipe : item))
    : [...subrecipeRecords, subrecipe];
  await loadRecipesForInventoryUsage();
  const updatedRecipeIds = [];

  for (const recipe of state.moduleRecords.recipes || []) {
    const ingredients = normalizeRecipeIngredients(recipe.ingredients);
    const usesSubrecipe = ingredients.some(ingredient => (
      ingredient.itemType === 'subrecipe'
      && String(ingredient.subrecipeId) === String(subrecipe.id)
    ));
    if (!usesSubrecipe) continue;

    const costFields = calculateRecipeCostFields(recipe, ingredients);
    await updateRecord(MODULE_SECTIONS.recipes.table, recipe.id, costFields);
    updatedRecipeIds.push(recipe.id);
  }

  if (updatedRecipeIds.length > 0) {
    await loadRecipesForInventoryUsage();
    await recalculateMenuItemsForRecipes(updatedRecipeIds);
  }

  return updatedRecipeIds;
}

function findInventoryItemForSubrecipe(subrecipe) {
  if (!subrecipe?.id) return null;
  const inventoryItems = getInventoryOptions();

  return inventoryItems.find(item => (
      normalizeIngredientNameForMatch(item.name) === normalizeIngredientNameForMatch(subrecipe.name)
      && String(item.category || '').toLowerCase() === String(subrecipe.category || 'Subrecipes').toLowerCase()
    ))
    || inventoryItems.find(item => (
      normalizeIngredientNameForMatch(item.name) === normalizeIngredientNameForMatch(subrecipe.name)
    ))
    || null;
}

function buildSubrecipeInventoryPayload(subrecipe, existingInventoryItem = null) {
  const yieldQuantity = Number(subrecipe?.yield_quantity);
  const packageQuantity = Number.isFinite(yieldQuantity) && yieldQuantity > 0 ? yieldQuantity : 1;
  const yieldUnit = subrecipe?.yield_unit || existingInventoryItem?.base_unit || 'batch';
  const totalCost = Number(subrecipe?.unit_cost_total ?? subrecipe?.total_cost ?? subrecipe?.total_ingredient_cost ?? 0);
  const packagePrice = Number.isFinite(totalCost) ? totalCost : 0;

  return {
    name: subrecipe?.name || 'Subrecipe',
    category: subrecipe?.category || existingInventoryItem?.category || 'Subrecipes',
    brand: existingInventoryItem?.brand || 'Beoflow Prep',
    base_unit: yieldUnit,
    unit: yieldUnit,
    package_quantity: packageQuantity,
    package_unit: yieldUnit,
    package_price: packagePrice,
    current_stock: Number(existingInventoryItem?.current_stock ?? 0) || 0,
    minimum_stock: Number(existingInventoryItem?.minimum_stock ?? 0) || 0,
    cost_per_unit: calculateInventoryUnitCost({
      package_quantity: packageQuantity,
      package_price: packagePrice
    }) || 0,
    supplier: existingInventoryItem?.supplier || 'Internal prep',
    status: subrecipe?.status || 'active',
    notes: subrecipe?.notes || existingInventoryItem?.notes || null
  };
}

async function upsertSubrecipeInventoryItem(subrecipe) {
  if (!subrecipe?.id) return null;
  await loadModuleData('inventory');
  const existingInventoryItem = findInventoryItemForSubrecipe(subrecipe);
  const payload = buildSubrecipeInventoryPayload(subrecipe, existingInventoryItem);
  const savedInventoryItem = existingInventoryItem?.id
    ? await updateRecord(MODULE_SECTIONS.inventory.table, existingInventoryItem.id, payload)
    : await createRecord(MODULE_SECTIONS.inventory.table, payload);

  await loadModuleData('inventory');
  return savedInventoryItem;
}

async function saveModuleRecord(event) {
  event.preventDefault();
  const section = state.modalSection;
  if (!section) return;
  const shouldReturnToDashboard = state.activeSection === 'dashboard';

  if (section === 'recipe-link') {
    setLoading(true);
    showAlert(els['module-form-message'], '');
    try {
      await saveInventoryRecipeLink();
    } catch (error) {
      showAlert(els['module-form-message'], error.message || 'Unable to connect ingredient to recipe.');
    } finally {
      setLoading(false);
    }
    return;
  }

  const moduleConfig = getModuleConfig(section);
  setLoading(true);
  showAlert(els['module-form-message'], '');

  try {
    if (isCostingRecipeSection(section)) {
      await loadModuleData('inventory');
      if (section === 'recipes') await loadSubrecipesForRecipeUsage();
    }

    if (section === 'menu') {
      await loadRecipesForInventoryUsage();
    }

    const payload = buildModulePayload(section);
    if (section === 'subrecipes') {
      payload.recipe_number = state.editingRecord?.id
        ? (payload.recipe_number || state.editingRecord.recipe_number || getNextSubrecipeNumberFromRecords())
        : await getNextSubrecipeNumber();
    }

    let savedRecord = null;
    if (state.editingRecord?.id) {
      savedRecord = await updateRecord(moduleConfig.table, state.editingRecord.id, payload);
      showToast(`${moduleConfig.title} record updated.`);
    } else {
      savedRecord = await createRecord(moduleConfig.table, payload);
      showToast(`${moduleConfig.title} record created.`);
    }

    if (section === 'inventory') {
      const updatedSubrecipes = await recalculateSubrecipesUsingInventoryItem(savedRecord);
      if (updatedSubrecipes.length > 0) showToast(`${updatedSubrecipes.length} connected subrecipe costs recalculated.`);
      const updatedRecipes = await recalculateRecipesUsingInventoryItem(savedRecord);
      if (updatedRecipes.length > 0) showToast(`${updatedRecipes.length} connected recipe costs recalculated.`);
    }

    if (section === 'subrecipes') {
      const savedSubrecipeInventory = await upsertSubrecipeInventoryItem(savedRecord);
      if (savedSubrecipeInventory) await recalculateRecipesUsingInventoryItem(savedSubrecipeInventory);
      const updatedRecipes = await recalculateRecipesUsingSubrecipe(savedRecord);
      if (updatedRecipes.length > 0) showToast(`${updatedRecipes.length} recipes using this subrecipe recalculated.`);
    }

    if (section === 'recipes') {
      await recalculateMenuItemsForRecipes([savedRecord.id]);
    }

    closeModuleModal();
    await loadDashboardCounts();
    updateDashboardCards();
    if (shouldReturnToDashboard) {
      if (section === 'events') await loadDashboardEvents();
      renderDashboard();
    } else {
      renderModuleSection(section);
    }
  } catch (error) {
    showAlert(els['module-form-message'], error.message || `Unable to save ${moduleConfig.singular}.`);
  } finally {
    setLoading(false);
  }
}

async function archiveModuleRecord(section, recordId) {
  const moduleConfig = getModuleConfig(section);
  const record = getRecordById(section, recordId);
  const recordName = getRecordTitle(section, record);
  const shouldArchive = window.confirm(translateText(`Archive ${recordName}?`));
  if (!shouldArchive) return;

  setLoading(true);
  clearAlerts();

  try {
    await deleteOrArchiveRecord(moduleConfig.table, recordId);
    await loadDashboardCounts();
    updateDashboardCards();
    renderModuleSection(section);
    showToast(`${moduleConfig.title} record archived.`);
  } catch (error) {
    showAlert(els['workspace-message'], error.message || `Unable to archive ${moduleConfig.singular}.`);
  } finally {
    setLoading(false);
  }
}

function startRecipeWithInventoryItem(recordId) {
  const ingredient = getRecordById('inventory', recordId);
  if (!ingredient) return;
  startInlineNewRecipe(ingredient);
}

function startInlineNewRecipe(preselectedIngredient = null) {
  state.recipeInlineNewOpen = false;
  state.recipeInlineNewIngredient = null;
  if (state.activeSection !== 'recipes') {
    renderModuleSection('recipes');
  }
  openModuleModal('recipes', null, { preselectedIngredient });
}

function renderInventoryRecipeLinkForm(ingredient) {
  const recipes = (state.moduleRecords.recipes || []).filter(recipe => String(recipe.status || 'active') !== 'archived');
  const recipeOptions = recipes.length
    ? [
      '<option value="">Choose recipe</option>',
      ...recipes.map(recipe => `<option value="${escapeHtml(recipe.id)}">${escapeHtml(recipe.name)}</option>`)
    ].join('')
    : '<option value="">No recipes available</option>';

  return `
    <div class="inventory-recipe-link-panel form-field-wide">
      <div class="recipe-builder-heading">
        <span>${escapeHtml(ingredient.name)}</span>
        <p>Add this inventory ingredient to an existing recipe.</p>
      </div>
      <label class="form-field form-field-wide">
        <span>Recipe</span>
        <select id="recipe-link-recipe-id" ${recipes.length ? '' : 'disabled'}>
          ${recipeOptions}
        </select>
      </label>
      <label class="form-field">
        <span>Quantity used in recipe</span>
        <input type="number" id="recipe-link-quantity" min="0" step="0.01" value="1">
      </label>
      <label class="form-field">
        <span>Unit used in recipe</span>
        <input type="text" id="recipe-link-unit" value="${escapeHtml(getInventoryBaseUnit(ingredient) || '')}">
      </label>
      ${recipes.length ? '' : '<p class="recipe-ingredient-empty">Create a recipe first, or use "Use in recipe" to start a new one with this ingredient.</p>'}
    </div>
  `;
}

async function openInventoryRecipeLinkModal(recordId) {
  const ingredient = getRecordById('inventory', recordId);
  if (!ingredient) return;

  state.modalSection = 'recipe-link';
  state.editingRecord = null;
  state.recipeLinkIngredient = ingredient;
  showAlert(els['module-form-message'], '');
  els['module-modal-title'].textContent = 'Add to recipe';
  els['module-modal-subtitle'].textContent = `Connect ${ingredient.name} to an existing recipe.`;
  els['module-save-button'].textContent = 'Add to Recipe';
  els['module-form-fields'].innerHTML = '<div class="module-loading form-field-wide">Loading recipes.</div>';
  els['module-modal'].hidden = false;

  try {
    await loadRecipesForInventoryUsage();
    els['module-form-fields'].innerHTML = renderInventoryRecipeLinkForm(ingredient);
  } catch (error) {
    showAlert(els['module-form-message'], error.message || 'Unable to load recipes.');
    els['module-form-fields'].innerHTML = renderInventoryRecipeLinkForm(ingredient);
  }
}

async function saveInventoryRecipeLink() {
  const ingredient = state.recipeLinkIngredient;
  if (!ingredient?.id) throw new Error('Choose a valid inventory ingredient.');

  const recipeId = document.getElementById('recipe-link-recipe-id')?.value;
  const recipe = (state.moduleRecords.recipes || []).find(row => String(row.id) === String(recipeId));
  if (!recipe) throw new Error('Choose a recipe to connect this ingredient.');

  const quantity = requireNonNegativeNumber(
    document.getElementById('recipe-link-quantity')?.value,
    'Ingredient quantity',
    { allowNull: false }
  );
  if (quantity === 0) throw new Error('Ingredient quantity must be greater than zero.');

  const unit = document.getElementById('recipe-link-unit')?.value.trim() || getInventoryBaseUnit(ingredient) || '';
  const recipeIngredients = normalizeRecipeIngredients(recipe.ingredients);
  const newIngredient = createRecipeIngredientFromInventory(ingredient, quantity);
  newIngredient.unit = unit;

  const existingIndex = recipeIngredients.findIndex(row => (
    String(row.inventoryItemId) === String(ingredient.id)
  ));

  if (existingIndex >= 0) {
    const existingIngredient = recipeIngredients[existingIndex];
    const nextQuantity = Number(existingIngredient.quantity || 0) + quantity;
    recipeIngredients[existingIndex] = normalizeRecipeIngredient({
      ...existingIngredient,
      quantity: nextQuantity,
      unit
    });
  } else {
    recipeIngredients.push(newIngredient);
  }

  const costFields = calculateRecipeCostFields(recipe, recipeIngredients);

  await updateRecord(MODULE_SECTIONS.recipes.table, recipe.id, {
    ...costFields
  });

  await loadRecipesForInventoryUsage();
  await recalculateMenuItemsForRecipes([recipe.id]);
  closeModuleModal();
  renderModuleSection(state.activeSection === 'recipes' ? 'recipes' : 'inventory');
  showToast(`${ingredient.name} added to ${recipe.name}.`);
}

function addSelectedRecipeIngredient() {
  const select = document.getElementById('recipe-ingredient-select');
  const selectedId = select?.value;
  const quantity = Number(document.getElementById('recipe-ingredient-add-quantity')?.value || 1);
  const unit = document.getElementById('recipe-ingredient-add-unit')?.value.trim() || '';
  const selectedItem = selectedId
    ? getInventoryOptionsForRecipeBuilder().find(item => String(item.id) === String(selectedId))
    : null;
  if (!selectedItem) {
    throw new Error('Choose an inventory ingredient first.');
  }
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Ingredient quantity cannot be negative.');

  const ingredient = createRecipeIngredientFromInventory(selectedItem, quantity);
  addRecipeIngredientToDraft(normalizeRecipeIngredient({
    ...ingredient,
    unit: unit || ingredient.unit
  }));
  refreshRecipeIngredientBuilder();
}

function addSelectedRecipeSubrecipe() {
  const select = document.getElementById('recipe-subrecipe-select');
  const selectedId = select?.value;
  const quantity = Number(document.getElementById('recipe-subrecipe-add-quantity')?.value || 1);
  const selectedItem = getSubrecipeOptions().find(item => String(item.id) === String(selectedId));
  if (!selectedItem) throw new Error('Choose a subrecipe first.');
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Subrecipe quantity cannot be negative.');

  addRecipeIngredientToDraft(createRecipeIngredientFromSubrecipe(selectedItem, quantity));
  refreshRecipeIngredientBuilder();
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function initializeSupabase() {
  if (state.supabase) return state.supabase;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    showAlert(els['config-alert'], 'Supabase client library failed to load.');
    return null;
  }

  if (!config.url || isMissingClientProdKey()) {
    renderConfigState();
    return null;
  }

  state.supabase = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  });

  state.supabase.auth.onAuthStateChange((event, session) => {
    handleAuthStateChange(event, session);
  });

  return state.supabase;
}

async function handleAuthUrlCallback(supabase, authUrlState = getAuthUrlState()) {
  if (!authUrlState.hasAuthParams) return false;

  logAuthUrlState();

  if (authUrlState.hasError) {
    cleanAuthUrl();
    renderAuthView();
    showAlert(
      els['auth-message'],
      authUrlState.errorDescription || authUrlState.error || 'Authentication link could not be processed.'
    );
    return true;
  }

  if (authUrlState.isRecovery) {
    state.isRecoveryMode = true;
    renderPasswordRecoveryView();
  }

  if (authUrlState.code && typeof supabase.auth.exchangeCodeForSession === 'function') {
    const { data, error } = await supabase.auth.exchangeCodeForSession(authUrlState.code);
    if (error) {
      cleanAuthUrl();
      state.isRecoveryMode = false;
      renderAuthView();
      showAlert(els['auth-message'], error.message || 'Unable to process the reset password link.');
      return true;
    }

    state.user = data.session?.user || data.user || state.user;
  }

  if (
    authUrlState.accessToken
    && authUrlState.refreshToken
    && typeof supabase.auth.setSession === 'function'
  ) {
    const { data, error } = await supabase.auth.setSession({
      access_token: authUrlState.accessToken,
      refresh_token: authUrlState.refreshToken
    });

    if (error) {
      cleanAuthUrl();
      state.isRecoveryMode = false;
      renderAuthView();
      showAlert(els['auth-message'], error.message || 'Unable to process the reset password link.');
      return true;
    }

    state.user = data.session?.user || data.user || state.user;
  }

  cleanAuthUrl();

  if (authUrlState.isRecovery) {
    renderPasswordRecoveryView();
    return true;
  }

  return false;
}

async function handleAuthStateChange(event, session) {
  console.log('[Beoflow Auth] Auth event:', event);

  if (event === 'PASSWORD_RECOVERY') {
    state.user = session?.user || null;
    renderPasswordRecoveryView();
    return;
  }

  if (event === 'SIGNED_OUT') {
    resetSessionState();
    renderAuthView();
    return;
  }

  if (event === 'USER_UPDATED' && state.passwordUpdatePending) {
    state.passwordUpdatePending = false;
    state.isRecoveryMode = false;
  }

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    if (!session?.user || state.isRecoveryMode) return;
    await refreshAuthenticatedState(session.user);
  }
}

async function signUp(email, password, fullName) {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || ''
      },
      emailRedirectTo: getEmailActionRedirectUrl()
    }
  });

  if (error) throw error;

  if (data.session?.user) {
    await syncProfileFromUser(data.user, fullName);
  }

  if (data.session?.user) {
    await refreshAuthenticatedState(data.session.user);
  } else {
    showAlert(els['auth-message'], 'Check your email to confirm your account. After confirmation, return to Beoflow to continue.', 'success');
    state.authMode = 'signin';
    renderAuthView();
  }

  return data;
}

async function signIn(email, password) {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await refreshAuthenticatedState(data.user);
  return data;
}

async function signOut() {
  const supabase = initializeSupabase();
  if (!supabase) return;

  await supabase.auth.signOut();
  resetSessionState();
  renderAuthView();
}

async function sendPasswordResetEmail(email) {
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getEmailActionRedirectUrl()
  });

  if (error) throw error;
}

async function updatePassword(newPassword, confirmPassword) {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  if (newPassword !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  state.passwordUpdatePending = true;
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    state.passwordUpdatePending = false;
    throw error;
  }

  state.passwordUpdatePending = false;
  state.isRecoveryMode = false;
  cleanAuthUrl();
  if (data.user) {
    await refreshAuthenticatedState(data.user);
    showAlert(els['workspace-message'], 'Password updated successfully.', 'success');
  } else {
    state.authMode = 'signin';
    renderAuthView();
    showAlert(els['auth-message'], 'Password updated successfully. Sign in with your new password.', 'success');
  }

  return data;
}

async function getCurrentUser() {
  const supabase = initializeSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  state.user = data.user || null;
  return state.user;
}

async function loadCurrentUserProfile() {
  if (!state.user) return null;
  const supabase = initializeSupabase();
  if (!supabase) return null;

  const byId = await supabase
    .from('profiles')
    .select('*')
    .eq('id', state.user.id)
    .maybeSingle();

  if (!byId.error) {
    state.profile = byId.data || null;
    return state.profile;
  }

  const byUserId = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', state.user.id)
    .maybeSingle();

  state.profile = byUserId.error ? null : byUserId.data || null;
  return state.profile;
}

async function loadUserClients() {
  if (!state.user) return [];
  const supabase = initializeSupabase();
  if (!supabase) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from('client_users')
    .select('client_id, role, status')
    .eq('user_id', state.user.id)
    .eq('status', 'active');

  if (membershipError) throw membershipError;

  const clientIds = [...new Set((memberships || []).map(row => row.client_id).filter(Boolean))];
  if (clientIds.length === 0) {
    state.userClients = [];
    return state.userClients;
  }

  const { data: products, error: productsError } = await supabase
    .from('client_products')
    .select('client_id, product_key, status')
    .in('client_id', clientIds)
    .eq('product_key', config.productKey || 'beoflow')
    .eq('status', 'active');

  if (productsError) throw productsError;

  const beoflowClientIds = new Set((products || []).map(row => row.client_id));
  const allowedClientIds = clientIds.filter(id => beoflowClientIds.has(id));

  if (allowedClientIds.length === 0) {
    state.userClients = [];
    return state.userClients;
  }

  let clientsResult = await supabase
    .from('clients')
    .select('id, name, client_type, status, created_at, updated_at, beoflow_waste_percentage, beoflow_food_factor')
    .in('id', allowedClientIds)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (clientsResult.error && String(clientsResult.error.message || '').toLowerCase().includes('column')) {
    clientsResult = await supabase
      .from('clients')
      .select('id, name, client_type, status, created_at, updated_at')
      .in('id', allowedClientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });
  }

  if (clientsResult.error) throw clientsResult.error;

  const membershipByClientId = new Map((memberships || []).map(row => [row.client_id, row]));

  state.userClients = (clientsResult.data || []).map(client => ({
    ...client,
    member_role: membershipByClientId.get(client.id)?.role || 'member'
  }));

  return state.userClients;
}

async function createBeoflowClient(clientInput) {
  if (!state.user) throw new Error('Sign in before creating a restaurant.');
  const supabase = initializeSupabase();
  if (!supabase) throw new Error('Client-prod is not configured.');

  const clientPayload = {
    name: clientInput.name,
    client_type: clientInput.clientType,
    status: 'active',
    created_by: state.user.id
  };

  const optionalPayload = {
    ...clientPayload,
    city: clientInput.city || null,
    state: clientInput.state || null,
    timezone: clientInput.timezone || null,
    beoflow_waste_percentage: DEFAULT_WASTE_PERCENTAGE,
    beoflow_food_factor: DEFAULT_FOOD_FACTOR
  };

  let insertResult = await supabase
    .from('clients')
    .insert(optionalPayload)
    .select('id, name, client_type, status, created_at, updated_at, beoflow_waste_percentage, beoflow_food_factor')
    .single();

  if (insertResult.error && String(insertResult.error.message || '').toLowerCase().includes('column')) {
    insertResult = await supabase
      .from('clients')
      .insert(clientPayload)
      .select('id, name, client_type, status, created_at, updated_at')
      .single();
  }

  if (insertResult.error) throw insertResult.error;

  const client = insertResult.data;

  const { error: membershipError } = await supabase
    .from('client_users')
    .insert({
      client_id: client.id,
      user_id: state.user.id,
      role: 'owner',
      status: 'active'
    });

  if (membershipError) throw membershipError;

  const { error: productError } = await supabase
    .from('client_products')
    .insert({
      client_id: client.id,
      product_key: config.productKey || 'beoflow',
      status: 'active'
    });

  if (productError) throw productError;

  await loadUserClients();
  setActiveClient(state.userClients.find(row => row.id === client.id) || client);
  renderWorkspaceCreated();
  return client;
}

function setActiveClient(client) {
  const validClient = client
    ? findMatchingWorkspace(client) || (client.id ? client : null)
    : null;

  state.activeClient = validClient;
  state.moduleRecords = {};
  state.moduleCounts = {};
  state.reportsData = null;
  state.activeSection = 'dashboard';

  if (state.activeClient?.id) {
    localStorage.setItem(getActiveClientStorageKey(), state.activeClient.id);
  } else {
    localStorage.removeItem(getActiveClientStorageKey());
  }

  return state.activeClient;
}

function clearActiveClient() {
  return setActiveClient(null);
}

function requireActiveClient() {
  const activeClient = findMatchingWorkspace(state.activeClient);
  if (activeClient) {
    state.activeClient = activeClient;
    return state.activeClient;
  }

  if (state.activeClient?.id) {
    state.activeClient = null;
  }

  if (state.userClients.length === 0) {
    localStorage.removeItem(getActiveClientStorageKey());
    showWorkspaceOnboarding();
    return null;
  }

  const storedClient = localStorage.getItem(getActiveClientStorageKey());
  const selectedClient = getValidSelectedWorkspace(storedClient);
  clearInvalidStoredWorkspace(storedClient, selectedClient);
  setActiveClient(selectedClient);
  return state.activeClient;
}

function switchWorkspace(clientId) {
  const client = state.userClients.find(row => row.id === clientId);
  if (!client) {
    clearActiveClient();
    renderClientSelector();
    return null;
  }

  setActiveClient(client);
  closeWorkspaceModals();
  renderDashboard();
  return state.activeClient;
}

function addAnotherRestaurant() {
  closeWorkspaceModals();
  clearAlerts();
  renderOnboarding('add');
}

function showWorkspaceSwitcher() {
  if (state.userClients.length < 2) {
    renderClientSelector();
    return;
  }

  els['workspace-switcher-list'].innerHTML = '';
  state.userClients.forEach(client => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'client-option';
    button.innerHTML = `
      <span>
        <strong>${escapeHtml(client.name)}</strong>
        <span>${escapeHtml(formatClientType(client.client_type))} • ${escapeHtml(client.status || 'active')}</span>
      </span>
      <span>${client.id === state.activeClient?.id ? 'Current' : 'Open workspace'}</span>
    `;
    button.disabled = client.id === state.activeClient?.id;
    button.addEventListener('click', () => {
      switchWorkspace(client.id);
    });
    els['workspace-switcher-list'].appendChild(button);
  });

  els['workspace-switcher-modal'].hidden = false;
}

function showWorkspaceSettings() {
  const activeClient = requireActiveClient();
  if (!activeClient) return;

  showAlert(els['workspace-settings-message'], '');
  els['workspace-settings-name'].value = activeClient.name || '';
  els['workspace-settings-type'].value = activeClient.client_type || 'restaurant';
  els['workspace-settings-waste'].value = String(getWorkspaceWastePercentage() * 100);
  els['workspace-settings-factor'].value = String(getWorkspaceFoodFactor());
  els['workspace-settings-modal'].hidden = false;
}

async function updateWorkspaceSettings() {
  const activeClient = requireActiveClient();
  if (!activeClient) throw new Error('Open a workspace before editing settings.');

  const name = els['workspace-settings-name'].value.trim();
  if (!name) throw new Error('Business name is required.');
  const wastePercentageInput = requireNonNegativeNumber(els['workspace-settings-waste'].value, 'Default waste percentage', { allowNull: false });
  const foodFactor = requireNonNegativeNumber(els['workspace-settings-factor'].value, 'Food factor', { allowNull: false });

  const basePayload = {
    name,
    client_type: els['workspace-settings-type'].value
  };

  const payload = {
    ...basePayload,
    beoflow_waste_percentage: wastePercentageInput / 100,
    beoflow_food_factor: foodFactor
  };

  let updateResult = await requireSupabaseClient()
    .from('clients')
    .update(payload)
    .eq('id', activeClient.id)
    .select('id, name, client_type, status, created_at, updated_at, beoflow_waste_percentage, beoflow_food_factor')
    .single();

  if (updateResult.error && String(updateResult.error.message || '').toLowerCase().includes('column')) {
    updateResult = await requireSupabaseClient()
      .from('clients')
      .update(basePayload)
      .eq('id', activeClient.id)
      .select('id, name, client_type, status, created_at, updated_at')
      .single();
  }

  if (updateResult.error) throw updateResult.error;

  const updatedClient = {
    ...activeClient,
    ...updateResult.data
  };
  state.userClients = state.userClients.map(client => (
    client.id === updatedClient.id ? { ...client, ...updatedClient } : client
  ));
  setActiveClient(updatedClient);
  closeWorkspaceModals();
  renderDashboard();
  showToast('Workspace settings updated.');
  return updatedClient;
}

function handleMobileDrawerAction(action) {
  closeMobileDrawer();

  if (action === 'switch-workspace') {
    showWorkspaceSwitcher();
    return;
  }

  if (action === 'add-restaurant') {
    addAnotherRestaurant();
    return;
  }

  if (action === 'workspace-settings') {
    showWorkspaceSettings();
    return;
  }

  if (action === 'sign-out') {
    signOut();
  }
}

function resetSessionState() {
  state.user = null;
  state.profile = null;
  state.userClients = [];
  state.activeClient = null;
  state.activeSection = 'dashboard';
  state.moduleRecords = {};
  state.moduleCounts = {};
  state.reportsData = null;
  state.modalSection = null;
  state.editingRecord = null;
  state.mobileDrawerOpen = false;
  state.onboardingMode = 'first';
  localStorage.removeItem(getActiveClientStorageKey());
}

async function syncProfileFromUser(user, fullName = '') {
  const supabase = initializeSupabase();
  if (!supabase || !user) return null;

  const profilePayload = {
    id: user.id,
    email: user.email,
    full_name: fullName || user.user_metadata?.full_name || user.email
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  return error ? null : profilePayload;
}

async function refreshAuthenticatedState(user) {
  if (!user) {
    resetSessionState();
    renderAuthView();
    return;
  }

  setLoading(true);
  clearAlerts();

  try {
    state.user = user;
    await loadCurrentUserProfile();
    await loadUserClients();

    if (state.userClients.length === 0) {
      setActiveClient(null);
      showWorkspaceOnboarding();
      return;
    }

    const storedClient = localStorage.getItem(getActiveClientStorageKey());
    const selectedClient = getValidSelectedWorkspace(storedClient);
    clearInvalidStoredWorkspace(storedClient, selectedClient);
    setActiveClient(selectedClient);
    renderDashboard();
  } catch (error) {
    els['session-loading-view'].hidden = true;
    els['auth-view'].hidden = true;
    els['workspace-view'].hidden = false;
    hideStandaloneWorkspaceViews();
    hideWorkspaceSections();
    showAlert(els['workspace-message'], error.message || 'Unable to load your Beoflow workspace.');
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  document.addEventListener('change', event => {
    if (event.target.matches('[data-language-select]')) {
      setLanguage(event.target.value);
    }
  });

  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      setPasswordToggleState(button, input, input.type === 'password');
    });
  });

  els['mobile-menu-button'].addEventListener('click', () => {
    if (state.mobileDrawerOpen) {
      closeMobileDrawer();
      return;
    }

    openMobileDrawer();
  });

  els['mobile-drawer-close'].addEventListener('click', closeMobileDrawer);
  els['mobile-drawer-overlay'].addEventListener('click', closeMobileDrawer);

  els['show-sign-in'].addEventListener('click', () => {
    state.authMode = 'signin';
    state.isRecoveryMode = false;
    clearAlerts();
    renderAuthView();
    renderConfigState();
  });

  els['show-sign-up'].addEventListener('click', () => {
    state.authMode = 'signup';
    state.isRecoveryMode = false;
    clearAlerts();
    renderAuthView();
    renderConfigState();
  });

  els['auth-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);

    const email = els['auth-email'].value.trim();
    const password = els['auth-password'].value;
    const confirmPassword = els['auth-confirm-password'].value;
    const fullName = els['auth-full-name'].value.trim();

    try {
      if (state.authMode === 'signup') {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        els['auth-submit'].textContent = 'Creating account';
        await signUp(email, password, fullName);
      } else {
        els['auth-submit'].textContent = 'Signing in';
        await signIn(email, password);
      }
    } catch (error) {
      showAlert(els['auth-message'], error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
      if (!state.user) renderAuthView();
      renderConfigState();
    }
  });

  els['forgot-password-button'].addEventListener('click', () => {
    clearAlerts();
    renderResetRequestView();
    renderConfigState();
  });

  els['back-to-sign-in-button'].addEventListener('click', () => {
    state.authMode = 'signin';
    clearAlerts();
    renderAuthView();
    renderConfigState();
  });

  els['password-reset-request-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);
    els['reset-submit'].textContent = 'Sending reset email';

    try {
      const email = els['reset-email'].value.trim();
      await sendPasswordResetEmail(email);
      state.authMode = 'signin';
      renderAuthView();
      showAlert(els['auth-message'], 'Password reset email sent. Check your inbox.', 'success');
    } catch (error) {
      showAlert(els['auth-message'], error.message || 'Unable to send password reset email.');
      renderResetRequestView();
    } finally {
      els['reset-submit'].textContent = 'Send reset email';
      setLoading(false);
      renderConfigState();
    }
  });

  els['password-recovery-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);
    els['update-password-submit'].textContent = 'Updating password';

    try {
      await updatePassword(els['new-password'].value, els['confirm-new-password'].value);
    } catch (error) {
      renderPasswordRecoveryView();
      showAlert(els['auth-message'], error.message || 'Unable to update password.');
    } finally {
      els['update-password-submit'].textContent = 'Update password';
      els['new-password'].value = '';
      els['confirm-new-password'].value = '';
      setLoading(false);
    }
  });

  els['client-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);

    try {
      const name = els['client-name'].value.trim();
      if (!name) throw new Error('Restaurant / Operation Name is required.');

      await createBeoflowClient({
        name,
        clientType: els['client-type'].value,
        city: els['client-city'].value.trim(),
        state: els['client-state'].value.trim(),
        timezone: els['client-timezone'].value.trim()
      });
    } catch (error) {
      showAlert(els['onboarding-message'], error.message || 'Unable to create restaurant.');
    } finally {
      setLoading(false);
    }
  });

  els['continue-dashboard-button'].addEventListener('click', () => {
    renderDashboard();
  });

  els['selector-add-client-button'].addEventListener('click', addAnotherRestaurant);

  els['switch-client-button'].addEventListener('click', () => {
    showWorkspaceSwitcher();
  });

  els['add-restaurant-button'].addEventListener('click', addAnotherRestaurant);
  els['workspace-settings-button'].addEventListener('click', showWorkspaceSettings);

  document.querySelectorAll('[data-mobile-action]').forEach(button => {
    button.addEventListener('click', () => {
      handleMobileDrawerAction(button.dataset.mobileAction);
    });
  });

  els['workspace-switcher-add-button'].addEventListener('click', addAnotherRestaurant);
  els['workspace-switcher-close'].addEventListener('click', closeWorkspaceModals);
  els['workspace-switcher-modal'].addEventListener('click', event => {
    if (event.target === els['workspace-switcher-modal']) closeWorkspaceModals();
  });

  els['workspace-settings-close'].addEventListener('click', closeWorkspaceModals);
  els['workspace-settings-cancel'].addEventListener('click', closeWorkspaceModals);
  els['workspace-settings-modal'].addEventListener('click', event => {
    if (event.target === els['workspace-settings-modal']) closeWorkspaceModals();
  });

  els['workspace-settings-form'].addEventListener('submit', async event => {
    event.preventDefault();
    clearAlerts();
    setLoading(true);

    try {
      await updateWorkspaceSettings();
    } catch (error) {
      showAlert(els['workspace-settings-message'], error.message || 'Unable to update workspace settings.');
    } finally {
      setLoading(false);
    }
  });

  document.querySelectorAll('.sidebar-link[data-section]').forEach(button => {
    button.addEventListener('click', () => {
      const section = button.dataset.section;
      closeMobileDrawer();

      if (section === 'dashboard') {
        renderDashboard();
        return;
      }

      renderModuleSection(section);
    });
  });

  document.querySelectorAll('.module-card[data-section]').forEach(card => {
    card.addEventListener('click', () => {
      renderModuleSection(card.dataset.section);
    });
  });

  els['operations-calendar']?.addEventListener('click', handleOperationsCalendarClick);

  els['module-action-button'].addEventListener('click', () => {
    if (state.activeSection === 'recipes') {
      startInlineNewRecipe();
      return;
    }
    openModuleModal(state.activeSection);
  });

  els['module-header-action-button'].addEventListener('click', () => {
    if (state.activeSection === 'recipes') {
      startInlineNewRecipe();
      return;
    }
    openModuleModal(state.activeSection);
  });

  els['module-record-list'].addEventListener('click', async event => {
    const inlineButton = event.target.closest('button');
    const inlineCard = inlineButton?.closest('[data-inline-recipe-card]');
    if (inlineButton && inlineCard) {
      if (inlineButton.hasAttribute('data-inline-recipe-add-ingredient')) {
        appendInlineRecipeIngredientRow(inlineCard);
        return;
      }

      if (inlineButton.hasAttribute('data-inline-recipe-ingredient-remove')) {
        const row = inlineButton.closest('[data-inline-recipe-ingredient-row]');
        row?.remove();
        syncInlineRecipeIngredientIndexes(inlineCard);
        return;
      }

      if (inlineButton.hasAttribute('data-inline-recipe-ingredient-add-inventory')) {
        setLoading(true);
        showAlert(els['workspace-message'], '');
        try {
          const row = inlineButton.closest('[data-inline-recipe-ingredient-row]');
          await addInlineRecipeIngredientToInventory(inlineCard, row);
        } catch (error) {
          showAlert(els['workspace-message'], error.message || 'Unable to add ingredient to inventory.');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (inlineButton.hasAttribute('data-inline-recipe-save')) {
        setLoading(true);
        showAlert(els['workspace-message'], '');
        try {
          await saveInlineRecipeCard(inlineCard);
        } catch (error) {
          showAlert(els['workspace-message'], error.message || 'Unable to save recipe.');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (inlineButton.hasAttribute('data-inline-recipe-cancel')) {
        state.recipeInlineNewOpen = false;
        state.recipeInlineNewIngredient = null;
        renderModuleList('recipes', state.moduleRecords.recipes || []);
        return;
      }

      if (inlineButton.hasAttribute('data-inline-recipe-archive')) {
        const recordId = inlineCard.dataset.recordId;
        if (recordId) archiveModuleRecord('recipes', recordId);
        return;
      }
    }

    const actionButton = event.target.closest('[data-module-action]');
    if (!actionButton) return;

    const section = actionButton.dataset.section;
    const recordId = actionButton.dataset.recordId;
    if (actionButton.dataset.moduleAction === 'view-costing-record' || actionButton.dataset.moduleAction === 'view-recipe') {
      const detailSection = actionButton.dataset.moduleAction === 'view-recipe' ? 'recipes' : section;
      const record = getRecordById(detailSection, recordId);
      if (record) openCostingDetailModal(detailSection, record);
      return;
    }

    if (actionButton.dataset.moduleAction === 'edit') {
      const record = getRecordById(section, recordId);
      if (record) openModuleModal(section, record);
      return;
    }

    if (actionButton.dataset.moduleAction === 'archive') {
      archiveModuleRecord(section, recordId);
      return;
    }

    if (actionButton.dataset.moduleAction === 'use-in-recipe') {
      startRecipeWithInventoryItem(recordId);
      return;
    }

    if (actionButton.dataset.moduleAction === 'add-to-recipe') {
      openInventoryRecipeLinkModal(recordId);
    }
  });

  els['module-record-list'].addEventListener('input', event => {
    const row = event.target.closest('[data-inline-recipe-ingredient-row]');
    if (!row) return;

    if (
      event.target.hasAttribute('data-inline-recipe-ingredient-name')
      || event.target.hasAttribute('data-inline-recipe-ingredient-unit')
      || event.target.hasAttribute('data-inline-recipe-ingredient-quantity')
    ) {
      try {
        syncInlineRecipeRowInventoryStatus(row);
      } catch (error) {
        showAlert(els['workspace-message'], error.message || 'Unable to update ingredient status.');
      }
    }
  });

  els['module-record-list'].addEventListener('change', event => {
    const row = event.target.closest('[data-inline-recipe-ingredient-row]');
    if (!row) return;

    if (
      event.target.hasAttribute('data-inline-recipe-ingredient-name')
      || event.target.hasAttribute('data-inline-recipe-ingredient-unit')
      || event.target.hasAttribute('data-inline-recipe-ingredient-quantity')
    ) {
      try {
        syncInlineRecipeRowInventoryStatus(row);
      } catch (error) {
        showAlert(els['workspace-message'], error.message || 'Unable to update ingredient status.');
      }
    }
  });

  els['module-form-fields'].addEventListener('input', event => {
    if (event.target.id === 'recipe-ingredient-search') {
      state.recipeIngredientSearch = event.target.value;
      refreshRecipeIngredientOptions();
      if (state.modalSection === 'subrecipes') {
        const newInventoryName = document.getElementById('recipe-new-inventory-name');
        if (newInventoryName && document.activeElement !== newInventoryName) {
          newInventoryName.value = event.target.value;
          newInventoryName.title = event.target.value || 'Ingredient name';
        }
      }
    }

    if (event.target.id === 'subrecipe-search') {
      state.subrecipeSearch = event.target.value;
      refreshSubrecipeOptions();
    }

    if (event.target.id === 'quick-ingredient-name') {
      const suggestion = els['module-form-fields'].querySelector('[data-quick-ingredient-duplicate-suggestion]');
      if (suggestion) {
        suggestion.innerHTML = renderInventoryDuplicateSuggestion(event.target.value, null, { compact: true });
      }
    }

    if (event.target.name === 'name' && state.modalSection === 'inventory') {
      refreshInventoryDuplicateSuggestion();
    }

    const quantityInputIndex = event.target.dataset.recipeIngredientQuantity;
    if (quantityInputIndex !== undefined) {
      const draftIngredient = state.recipeIngredientsDraft[Number(quantityInputIndex)];
      if (!draftIngredient) return;
      const quantity = Number(event.target.value || 0);
      if (!Number.isFinite(quantity) || quantity < 0) {
        showAlert(els['module-form-message'], 'Ingredient quantity cannot be negative.');
        return;
      }

      state.recipeIngredientsDraft[Number(quantityInputIndex)] = normalizeRecipeIngredient({
        ...draftIngredient,
        quantity
      });
      refreshRecipeCostSummary();
    }

    const unitIndex = event.target.dataset.recipeIngredientUnit;
    if (unitIndex !== undefined) {
      const draftIngredient = state.recipeIngredientsDraft[Number(unitIndex)];
      if (!draftIngredient) return;
      state.recipeIngredientsDraft[Number(unitIndex)] = normalizeRecipeIngredient({
        ...draftIngredient,
        unit: event.target.value
      });
    }

    const nameIndex = event.target.dataset.recipeIngredientName;
    if (nameIndex !== undefined) {
      const draftIngredient = state.recipeIngredientsDraft[Number(nameIndex)];
      if (!draftIngredient) return;
      const name = event.target.value;
      const connectedStatus = getIngredientInventoryStatus({
        ...draftIngredient,
        inventoryItemId: '',
        itemCode: '',
        ingredientName: name
      });
      const existingInventoryItem = draftIngredient.inventoryItemId
        ? getInventoryOptions().find(item => String(item.id) === String(draftIngredient.inventoryItemId))
        : null;
      const shouldKeepExistingInventory = existingInventoryItem
        && normalizeIngredientNameForMatch(name) === normalizeIngredientNameForMatch(existingInventoryItem.name);
      const nextInventoryItem = connectedStatus.item || (shouldKeepExistingInventory ? existingInventoryItem : null);
      state.recipeIngredientsDraft[Number(nameIndex)] = normalizeRecipeIngredient({
        ...draftIngredient,
        ingredientName: name,
        inventoryItemId: nextInventoryItem?.id || '',
        itemCode: draftIngredient.itemCode || '',
        packagePrice: nextInventoryItem ? getInventoryPackagePrice(nextInventoryItem) : null,
        packageQuantity: nextInventoryItem ? getInventoryPackageQuantity(nextInventoryItem) : null,
        packageUnit: nextInventoryItem ? getInventoryPackageUnit(nextInventoryItem) : '',
        validationStatus: nextInventoryItem ? validateInventoryIngredientForRecipe(nextInventoryItem, draftIngredient.quantity).status : 'not_found'
      });
    }

    if (
      (
        ['yield_quantity', 'yield_unit', 'portion_count'].includes(event.target.name)
        || ['pax', 'manual_sale_price'].includes(event.target.name)
      )
      && isCostingRecipeSection(state.modalSection)
    ) {
      refreshRecipeCostSummary();
    }
  });

  els['module-form-fields'].addEventListener('change', async event => {
    if (event.target.hasAttribute('data-image-file-input')) {
      showAlert(els['module-form-message'], '');
      try {
        await handleImageFileInputChange(event.target);
      } catch (error) {
        showAlert(els['module-form-message'], error.message || 'Unable to load image.');
      }
      return;
    }

    const unitIndex = event.target.dataset.recipeIngredientUnit;
    if (unitIndex !== undefined) {
      const draftIngredient = state.recipeIngredientsDraft[Number(unitIndex)];
      if (!draftIngredient) return;
      state.recipeIngredientsDraft[Number(unitIndex)] = normalizeRecipeIngredient({
        ...draftIngredient,
        unit: event.target.value
      });
      refreshRecipeCostSummary();
      return;
    }

    const nameIndex = event.target.dataset.recipeIngredientName;
    if (nameIndex !== undefined) {
      refreshRecipeIngredientBuilder();
      return;
    }

    const quantityIndex = event.target.dataset.recipeIngredientQuantity;
    if (quantityIndex === undefined) return;

    const draftIngredient = state.recipeIngredientsDraft[Number(quantityIndex)];
    if (!draftIngredient) return;

    const quantity = Number(event.target.value || 0);
    if (!Number.isFinite(quantity) || quantity < 0) {
      showAlert(els['module-form-message'], 'Ingredient quantity cannot be negative.');
      event.target.value = draftIngredient.quantity;
      return;
    }
    state.recipeIngredientsDraft[Number(quantityIndex)] = normalizeRecipeIngredient({
      ...draftIngredient,
      quantity
    });
    refreshRecipeIngredientBuilder();
  });

  els['module-form-fields'].addEventListener('click', async event => {
    const clickedButton = event.target.closest('button');
    if (!clickedButton) return;

    if (clickedButton.hasAttribute('data-image-file-remove')) {
      clearImageFileField(clickedButton);
      return;
    }

    const costingDetailEditId = clickedButton.dataset.costingDetailEdit || clickedButton.dataset.recipeDetailEdit;
    if (costingDetailEditId) {
      const detailSection = clickedButton.dataset.section || 'recipes';
      const record = getRecordById(detailSection, costingDetailEditId);
      if (record) openModuleModal(detailSection, record);
      return;
    }

    if (clickedButton.id === 'recipe-add-selected-ingredient') {
      try {
        addSelectedRecipeIngredient();
      } catch (error) {
        showAlert(els['module-form-message'], error.message || 'Unable to add ingredient.');
      }
      return;
    }

    if (clickedButton.id === 'recipe-add-selected-subrecipe') {
      try {
        addSelectedRecipeSubrecipe();
      } catch (error) {
        showAlert(els['module-form-message'], error.message || 'Unable to add subrecipe.');
      }
      return;
    }

    if (clickedButton.id === 'recipe-add-blank-ingredient') {
      addBlankRecipeIngredient();
      return;
    }

    if (clickedButton.id === 'recipe-create-inventory-ingredient') {
      setLoading(true);
      showAlert(els['module-form-message'], '');
      try {
        await createInventoryIngredientFromSubrecipeModal();
      } catch (error) {
        showAlert(els['module-form-message'], error.message || 'Unable to create ingredient.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (clickedButton.id === 'recipe-quick-add-ingredient') {
      state.recipeQuickIngredientOpen = true;
      refreshRecipeIngredientBuilder();
      document.getElementById('quick-ingredient-name')?.focus();
      return;
    }

    if (clickedButton.id === 'recipe-cancel-quick-ingredient') {
      state.recipeQuickIngredientOpen = false;
      refreshRecipeIngredientBuilder();
      return;
    }

    if (clickedButton.id === 'recipe-save-quick-ingredient') {
      setLoading(true);
      showAlert(els['module-form-message'], '');
      try {
        await saveQuickInventoryIngredient();
      } catch (error) {
        showAlert(els['module-form-message'], error.message || 'Unable to create ingredient.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const addInventoryIndex = clickedButton.dataset.recipeIngredientAddInventory;
    if (addInventoryIndex !== undefined) {
      setLoading(true);
      showAlert(els['module-form-message'], '');
      try {
        await addRecipeIngredientRowToInventory(addInventoryIndex);
      } catch (error) {
        showAlert(els['module-form-message'], error.message || 'Unable to add ingredient to inventory.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const removeIndex = clickedButton.dataset.recipeIngredientRemove;
    if (removeIndex !== undefined) {
      if (!window.confirm(translateText('Remove this ingredient?'))) return;
      state.recipeIngredientsDraft.splice(Number(removeIndex), 1);
      refreshRecipeIngredientBuilder();
      return;
    }

    const useExistingIngredientId = clickedButton.dataset.useExistingIngredient;
    if (useExistingIngredientId) {
      const ingredient = getInventoryOptions().find(item => String(item.id) === String(useExistingIngredientId));
      if (!ingredient) return;

      if (isCostingRecipeSection(state.modalSection)) {
        addRecipeIngredientToDraft(createRecipeIngredientFromInventory(ingredient));
        state.recipeQuickIngredientOpen = false;
        state.recipeIngredientSearch = '';
        refreshRecipeIngredientBuilder();
        return;
      }

      if (state.modalSection === 'inventory') {
        openModuleModal('inventory', ingredient);
      }
    }
  });

  els['module-form'].addEventListener('submit', saveModuleRecord);

  els['module-cancel-button'].addEventListener('click', closeModuleModal);
  els['module-modal-close'].addEventListener('click', closeModuleModal);
  els['module-modal'].addEventListener('click', event => {
    if (event.target === els['module-modal']) closeModuleModal();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !els['module-modal'].hidden) {
      closeModuleModal();
    }

    if (event.key === 'Escape' && state.mobileDrawerOpen) {
      closeMobileDrawer();
    }

    if (
      event.key === 'Escape'
      && (!els['workspace-switcher-modal'].hidden || !els['workspace-settings-modal'].hidden)
    ) {
      closeWorkspaceModals();
    }
  });

  els['sign-out-button'].addEventListener('click', () => {
    signOut();
  });

  window.addEventListener('resize', syncMobileDrawerState);
}

async function boot() {
  cacheElements();
  decorateStaticModuleControls();
  bindEvents();
  startLanguageObserver();
  renderLoadingSession();
  applyLanguageToDocument(document.body);

  const supabase = initializeSupabase();
  if (!supabase) {
    renderAuthView();
    renderConfigState();
    return;
  }

  const authUrlState = getAuthUrlState();
  const handledAuthCallback = await handleAuthUrlCallback(supabase, authUrlState);
  if (handledAuthCallback) return;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    renderAuthView();
    showAlert(els['auth-message'], error.message || 'Unable to load session.');
    return;
  }

  if (data.session?.user && !state.isRecoveryMode) {
    await refreshAuthenticatedState(data.session.user);
    return;
  }

  if (!state.isRecoveryMode) renderAuthView();
}

document.addEventListener('DOMContentLoaded', boot);

window.BeoflowClientApp = {
  initializeSupabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getAuthRedirectUrl,
  getEmailActionRedirectUrl,
  getAuthUrlState,
  handleAuthUrlCallback,
  handleAuthStateChange,
  loadCurrentUserProfile,
  loadUserClients,
  getActiveClientId,
  loadModuleData,
  createRecord,
  updateRecord,
  deleteOrArchiveRecord,
  renderModuleList,
  openModuleModal,
  closeModuleModal,
  showToast,
  createBeoflowClient,
  sendPasswordResetEmail,
  updatePassword,
  renderDashboard,
  renderModuleSection,
  showWorkspaceOnboarding,
  renderOnboarding,
  renderClientSelector,
  renderWorkspaceCreated,
  showWorkspaceSwitcher,
  showWorkspaceSettings,
  updateWorkspaceSettings,
  switchWorkspace,
  addAnotherRestaurant,
  clearActiveClient,
  setActiveClient,
  requireActiveClient,
  setLanguage,
  applyLanguageToDocument,
  state
};
