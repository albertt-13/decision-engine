import type { CategoryRef } from "../domain/catalog/ProductProfile.js";

export interface DemoBrandProduct {
  name: string;
  price: string;
  category: CategoryRef;
  subcategory: CategoryRef;
}

export interface DemoBrand {
  slug: string;
  name: string;
  products: DemoBrandProduct[];
}

/**
 * Catálogos 100% simulados, sin ningún vínculo con OrderFlow — a propósito
 * de rubros distintos al de OrderFlow (tecnología) para que la variedad se
 * note. Categoría/subcategoría se asignan a mano acá en vez de pasar por
 * `ProductCategorizer` porque sus reglas de keyword están afinadas para
 * vocabulario de electrónica, no de muebles/deporte/mascotas.
 */
export const DEMO_BRANDS: DemoBrand[] = [
  {
    slug: "nordichome",
    name: "NordicHome",
    products: [
      { name: "Sofá Escandinavo 3 Cuerpos", price: "899.99", category: { code: "MOB", name: "Mobiliario" }, subcategory: { code: "SOF", name: "Sofás" } },
      { name: "Mesa de Centro Roble", price: "249.99", category: { code: "MOB", name: "Mobiliario" }, subcategory: { code: "MES", name: "Mesas" } },
      { name: "Lámpara de Pie Minimalista", price: "89.99", category: { code: "MOB", name: "Mobiliario" }, subcategory: { code: "ILU", name: "Iluminación" } },
      { name: "Alfombra Textil 200x300", price: "159.99", category: { code: "MOB", name: "Mobiliario" }, subcategory: { code: "TEX", name: "Textiles" } },
      { name: "Estantería Modular 5 Niveles", price: "189.99", category: { code: "MOB", name: "Mobiliario" }, subcategory: { code: "EST", name: "Estanterías" } },
    ],
  },
  {
    slug: "urbanfit",
    name: "UrbanFit",
    products: [
      { name: "Zapatillas Running ProGrip", price: "129.99", category: { code: "DEP", name: "Deportes" }, subcategory: { code: "CAL", name: "Calzado" } },
      { name: "Buzo Térmico Trail", price: "79.99", category: { code: "DEP", name: "Deportes" }, subcategory: { code: "IND", name: "Indumentaria" } },
      { name: "Mochila Trekking 30L", price: "99.99", category: { code: "DEP", name: "Deportes" }, subcategory: { code: "ACC", name: "Accesorios" } },
      { name: "Botella Térmica 1L", price: "24.99", category: { code: "DEP", name: "Deportes" }, subcategory: { code: "ACC", name: "Accesorios" } },
      { name: "Colchoneta Yoga Premium", price: "39.99", category: { code: "DEP", name: "Deportes" }, subcategory: { code: "FIT", name: "Fitness" } },
    ],
  },
  {
    slug: "petcorner",
    name: "PetCorner",
    products: [
      { name: "Cama Ortopédica para Perro L", price: "69.99", category: { code: "PET", name: "Mascotas" }, subcategory: { code: "CAM", name: "Descanso" } },
      { name: "Rascador para Gatos Torre", price: "54.99", category: { code: "PET", name: "Mascotas" }, subcategory: { code: "GAT", name: "Gatos" } },
      { name: "Comedero Automático WiFi", price: "119.99", category: { code: "PET", name: "Mascotas" }, subcategory: { code: "TEC", name: "Tecnología" } },
      { name: "Correa Retráctil 5m", price: "29.99", category: { code: "PET", name: "Mascotas" }, subcategory: { code: "ACC", name: "Accesorios" } },
      { name: "Arnés Antitirones", price: "34.99", category: { code: "PET", name: "Mascotas" }, subcategory: { code: "ACC", name: "Accesorios" } },
    ],
  },
];
