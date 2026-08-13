import { describe, expect, it } from "vitest";
import { buildSku, categorizeProduct } from "./ProductCategorizer.js";

describe("categorizeProduct", () => {
  it("categoriza por keyword, sin distinguir mayúsculas", () => {
    expect(categorizeProduct("Laptop Pro 14 pulgadas")).toEqual({
      category: { code: "COM", name: "Cómputo" },
      subcategory: { code: "NOT", name: "Notebooks" },
    });
    expect(categorizeProduct("MONITOR UltraWide 34")).toEqual({
      category: { code: "PAN", name: "Pantallas" },
      subcategory: { code: "MON", name: "Monitores" },
    });
    expect(categorizeProduct("Silla Ergonómica de Oficina")).toEqual({
      category: { code: "MOB", name: "Mobiliario" },
      subcategory: { code: "SIL", name: "Sillas" },
    });
  });

  it("cae en GEN-PRO si no matchea ninguna regla", () => {
    expect(categorizeProduct("Cosa Rarísima Sin Categoría")).toEqual({
      category: { code: "GEN", name: "General" },
      subcategory: { code: "PRO", name: "Producto" },
    });
  });
});

describe("buildSku", () => {
  it("arma la nomenclatura CAT-SUB-#### con padding de 4 dígitos", () => {
    const sku = buildSku({ code: "COM", name: "Cómputo" }, { code: "NOT", name: "Notebooks" }, 1);
    expect(sku).toBe("COM-NOT-0001");
  });

  it("no trunca si la secuencia supera 4 dígitos", () => {
    const sku = buildSku({ code: "COM", name: "Cómputo" }, { code: "NOT", name: "Notebooks" }, 12345);
    expect(sku).toBe("COM-NOT-12345");
  });
});
