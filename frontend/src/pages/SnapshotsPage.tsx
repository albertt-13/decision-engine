import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getSalesSnapshots } from "../api/recommendations.js";

export function SnapshotsPage() {
  const snapshotsQuery = useQuery({ queryKey: ["sales-snapshots"], queryFn: getSalesSnapshots });

  const snapshots = snapshotsQuery.data ?? [];

  // Pivotea por capturedAt -> { capturedAt, [productName]: unitsSold } para el chart
  const byTimestamp = new Map<string, Record<string, number | string>>();
  const productNames = new Set<string>();

  for (const s of snapshots) {
    const key = new Date(s.capturedAt).toLocaleString("es-AR");
    productNames.add(s.productName);
    const row = byTimestamp.get(key) ?? { capturedAt: key };
    row[s.productName] = s.unitsSold;
    byTimestamp.set(key, row);
  }

  const chartData = Array.from(byTimestamp.values());
  const colors = ["#8b5cf6", "#22d3ee", "#f472b6", "#facc15", "#34d399"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Tendencia de ventas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Snapshots del pipeline de agregación — una foto de bestsellers cada corrida, guardada en MongoDB.
        </p>
      </div>

      {snapshotsQuery.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {chartData.length > 0 && (
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
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Unidades vendidas</th>
              <th className="px-4 py-3">Capturado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {snapshots.map((s) => (
              <tr key={s.id} className="text-slate-300">
                <td className="px-4 py-3">{s.productName}</td>
                <td className="px-4 py-3">{s.unitsSold}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(s.capturedAt).toLocaleString("es-AR")}</td>
              </tr>
            ))}
            {snapshots.length === 0 && !snapshotsQuery.isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
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
