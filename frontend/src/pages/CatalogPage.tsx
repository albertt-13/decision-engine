import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCatalog, syncCatalog, seedDemoBrands } from "../api/catalog.js";
import type { ProductProfile } from "../api/types.js";

const EMPTY_PRODUCTS: ProductProfile[] = [];

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function CatalogPage() {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({ queryKey: ["catalog"], queryFn: listCatalog });
  const [brandFilter, setBrandFilter] = useState<string>("todas");

  const syncMutation = useMutation({
    mutationFn: syncCatalog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  const seedBrandsMutation = useMutation({
    mutationFn: seedDemoBrands,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog"] }),
  });

  const allProducts = catalogQuery.data ?? EMPTY_PRODUCTS;
  const brands = useMemo(() => Array.from(new Set(allProducts.map((p) => p.brand))).sort(), [allProducts]);
  const products = brandFilter === "todas" ? allProducts : allProducts.filter((p) => p.brand === brandFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Catálogo</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Perfiles enriquecidos por producto — SKU con nomenclatura propia, categoría, y métricas de
            marketing.{" "}
            <span className="text-amber-400">
              Las métricas de comportamiento (vistas, carrito, tiempos) son simuladas — OrderFlow solo
              trackea pedidos confirmados, no navegación ni carrito. Cada producto también tiene métricas
              simuladas de Google Ads, GA4, Search Console y Meta Ads (preguntale al AI Analyst por ROAS,
              spend o sesiones por canal). Las marcas distintas de "OrderFlow" son catálogos 100%
              simulados — no hay aislamiento real de datos por cliente, es variedad visual, no multi-tenancy.
            </span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => seedBrandsMutation.mutate()}
            disabled={seedBrandsMutation.isPending}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {seedBrandsMutation.isPending ? "Sembrando..." : "Sembrar marcas demo"}
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {syncMutation.isPending ? "Sincronizando..." : "Sincronizar catálogo"}
          </button>
        </div>
      </div>

      {syncMutation.data && (
        <p className="text-sm text-emerald-400">
          Sincronizado: {syncMutation.data.created} nuevos, {syncMutation.data.skipped} ya existían.
        </p>
      )}
      {seedBrandsMutation.data && (
        <p className="text-sm text-emerald-400">
          Marcas demo: {seedBrandsMutation.data.created} productos nuevos, {seedBrandsMutation.data.skipped} ya existían.
        </p>
      )}

      {brands.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBrandFilter("todas")}
            className={
              brandFilter === "todas"
                ? "rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
            }
          >
            Todas las marcas
          </button>
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setBrandFilter(brand)}
              className={
                brandFilter === brand
                  ? "rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
              }
            >
              {brand}
            </button>
          ))}
        </div>
      )}

      {products.length === 0 && !catalogQuery.isLoading && (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
          Todavía no hay perfiles de producto. Sincronizá el catálogo con el botón de arriba.
        </div>
      )}

      {products.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Vistas</th>
                <th className="px-4 py-3">Conversión</th>
                <th className="px-4 py-3">Abandono carrito</th>
                <th className="px-4 py-3">Tiempo en carrito</th>
                <th className="px-4 py-3">Hora pico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p) => (
                <tr key={p.id} className="text-slate-300">
                  <td className="px-4 py-3 font-mono text-xs text-violet-400">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {p.brand === "OrderFlow" ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        {p.brand}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        {p.brand}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {p.category.name} <span className="text-slate-600">/ {p.subcategory.name}</span>
                  </td>
                  <td className="px-4 py-3">${p.price}</td>
                  <td className="px-4 py-3">{p.marketing.viewCount.toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3">{formatPercent(p.marketing.conversionRate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.marketing.cartAbandonmentRate >= 0.5
                          ? "rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-400"
                          : "rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400"
                      }
                    >
                      {formatPercent(p.marketing.cartAbandonmentRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatSeconds(p.marketing.avgTimeInCartSeconds)}</td>
                  <td className="px-4 py-3 text-slate-400">{p.marketing.peakPurchaseHour}:00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
