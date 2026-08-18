import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getSalesSnapshots, backfillSalesTrend } from "../api/recommendations.js";

type Granularity = "day" | "week" | "month";

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

/** Trunca a la fecha de corte del período — lunes de esa semana, día 1 del mes, etc. */
function bucketStart(date: Date, granularity: Granularity): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (granularity === "day") return d;
  if (granularity === "week") {
    const isoDay = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - isoDay);
    return d;
  }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function bucketLabel(bucketDate: Date, granularity: Granularity): string {
  if (granularity === "day") return bucketDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  if (granularity === "week") return `Sem. ${bucketDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}`;
  return bucketDate.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

export function SnapshotsPage() {
  const queryClient = useQueryClient();
  const snapshotsQuery = useQuery({ queryKey: ["sales-snapshots"], queryFn: getSalesSnapshots });
  const [granularity, setGranularity] = useState<Granularity>("day");

  const backfillMutation = useMutation({
    mutationFn: backfillSalesTrend,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales-snapshots"] }),
  });

  const snapshots = snapshotsQuery.data ?? [];
  const simulatedCount = snapshots.filter((s) => s.source === "simulated").length;

  // Agrupa por período (día/semana/mes) y se queda con el valor más alto de
  // cada bucket — unitsSold es un contador ACUMULADO, así que "el total de la
  // semana" es el máximo dentro de esa semana, no una suma (sumar duplicaría).
  const productNames = new Set<string>();
  const buckets = new Map<string, { label: string; sortKey: number; values: Map<string, number> }>();

  for (const s of snapshots) {
    productNames.add(s.productName);
    const start = bucketStart(new Date(s.capturedAt), granularity);
    const key = start.toISOString();
    const bucket = buckets.get(key) ?? { label: bucketLabel(start, granularity), sortKey: start.getTime(), values: new Map() };
    bucket.values.set(s.productName, Math.max(bucket.values.get(s.productName) ?? 0, s.unitsSold));
    buckets.set(key, bucket);
  }

  const chartData = Array.from(buckets.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((bucket) => ({ capturedAt: bucket.label, ...Object.fromEntries(bucket.values) }));

  const colors = ["#8b5cf6", "#22d3ee", "#f472b6", "#facc15", "#34d399"];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Tendencia de ventas</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Snapshots del pipeline de agregación — una foto de bestsellers cada corrida, guardada en MongoDB.
            Los productos y sus unidades vendidas son reales (OrderFlow).{" "}
            {simulatedCount > 0 && (
              <span className="text-amber-400">
                {simulatedCount} de los puntos del gráfico son historial simulado (generado con
                "Generar historial") para ver tendencia con profundidad, sin esperar semanas de corridas reales.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => backfillMutation.mutate()}
          disabled={backfillMutation.isPending}
          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {backfillMutation.isPending ? "Generando..." : "Generar historial (30 días)"}
        </button>
      </div>

      {backfillMutation.data && (
        <p className="text-sm text-emerald-400">
          Se generaron {backfillMutation.data.snapshotsCreated} snapshots simulados de historial.
        </p>
      )}

      {snapshotsQuery.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {chartData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                className={
                  granularity === opt.value
                    ? "rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
                }
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="capturedAt" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Legend />
                {Array.from(productNames).map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Unidades vendidas</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Capturado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {snapshots.map((s) => (
              <tr key={s.id} className="text-slate-300">
                <td className="px-4 py-3">{s.productName}</td>
                <td className="px-4 py-3">{s.unitsSold}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      s.source === "real"
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400"
                        : "rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400"
                    }
                  >
                    {s.source === "real" ? "real" : "simulado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(s.capturedAt).toLocaleString("es-AR")}</td>
              </tr>
            ))}
            {snapshots.length === 0 && !snapshotsQuery.isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Sin snapshots todavía — el pipeline corre cada 10 minutos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
