import type { CategoryRef } from "./ProductProfile.js";

export interface CategoryAssignment {
  category: CategoryRef;
  subcategory: CategoryRef;
}

interface CategoryRule {
  category: CategoryRef;
  subcategory: CategoryRef;
  keywords: string[];
}

const FALLBACK: CategoryAssignment = {
  category: { code: "GEN", name: "General" },
  subcategory: { code: "PRO", name: "Producto" },
};

/**
 * Categorización por reglas de keyword — determinística y auditable (mismo
 * espíritu que `RecommendationRules`: se puede explicar exactamente por qué
 * un producto cayó en una categoría, no es una caja negra). Primera regla
 * que matchea gana; si ninguna matchea, cae en GEN-PRO.
 */
const RULES: CategoryRule[] = [
  {
    category: { code: "COM", name: "Cómputo" },
    subcategory: { code: "NOT", name: "Notebooks" },
    keywords: ["laptop", "notebook"],
  },
  {
    category: { code: "COM", name: "Cómputo" },
    subcategory: { code: "ALM", name: "Almacenamiento" },
    keywords: ["ssd", "disco", "almacenamiento"],
  },
  {
    category: { code: "PAN", name: "Pantallas" },
    subcategory: { code: "MON", name: "Monitores" },
    keywords: ["monitor"],
  },
  {
    category: { code: "PAN", name: "Pantallas" },
    subcategory: { code: "TAB", name: "Tablets" },
    keywords: ["tablet"],
  },
  {
    category: { code: "PER", name: "Periféricos" },
    subcategory: { code: "TEC", name: "Teclados" },
    keywords: ["teclado"],
  },
  {
    category: { code: "PER", name: "Periféricos" },
    subcategory: { code: "MOU", name: "Mouse" },
    keywords: ["mouse"],
  },
  {
    category: { code: "PER", name: "Periféricos" },
    subcategory: { code: "CAM", name: "Cámaras" },
    keywords: ["webcam", "cámara", "camara"],
  },
  {
    category: { code: "PER", name: "Periféricos" },
    subcategory: { code: "WEA", name: "Wearables" },
    keywords: ["smartwatch", "reloj"],
  },
  {
    category: { code: "AUD", name: "Audio" },
    subcategory: { code: "AUR", name: "Auriculares" },
    keywords: ["auricular", "headset"],
  },
  {
    category: { code: "AUD", name: "Audio" },
    subcategory: { code: "MIC", name: "Micrófonos" },
    keywords: ["micrófono", "microfono"],
  },
  {
    category: { code: "CON", name: "Conectividad y Energía" },
    subcategory: { code: "RED", name: "Redes" },
    keywords: ["router", "hub", "wifi"],
  },
  {
    category: { code: "CON", name: "Conectividad y Energía" },
    subcategory: { code: "ENE", name: "Energía" },
    keywords: ["cargador", "batería", "bateria"],
  },
  {
    category: { code: "MOB", name: "Mobiliario" },
    subcategory: { code: "SIL", name: "Sillas" },
    keywords: ["silla"],
  },
  {
    category: { code: "MOB", name: "Mobiliario" },
    subcategory: { code: "ESC", name: "Escritorios" },
    keywords: ["escritorio"],
  },
  {
    category: { code: "MOB", name: "Mobiliario" },
    subcategory: { code: "SOP", name: "Soportes" },
    keywords: ["soporte"],
  },
  {
    category: { code: "OFI", name: "Oficina" },
    subcategory: { code: "IMP", name: "Impresoras" },
    keywords: ["impresora"],
  },
];

export function categorizeProduct(productName: string): CategoryAssignment {
  const normalized = productName.toLowerCase();
  const match = RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return match ? { category: match.category, subcategory: match.subcategory } : FALLBACK;
}

export function buildSku(category: CategoryRef, subcategory: CategoryRef, sequence: number): string {
  return `${category.code}-${subcategory.code}-${String(sequence).padStart(4, "0")}`;
}
