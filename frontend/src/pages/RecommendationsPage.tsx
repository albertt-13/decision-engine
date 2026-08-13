import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateRecommendations,
  getExecutionMode,
  listRecommendations,
  setExecutionMode,
} from "../api/recommendations.js";
import { ModeBadge } from "../components/ModeBadge.js";
import type { ExecutionMode } from "../api/types.js";

export function RecommendationsPage() {
  const queryClient = useQueryClient();

  const modeQuery = useQuery({ queryKey: ["execution-mode"], queryFn: getExecutionMode });
  const recommendationsQuery = useQuery({ queryKey: ["recommendations"], queryFn: () => listRecommendations() });

  const generateMutation = useMutation({
    mutationFn: generateRecommendations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
  });

  const toggleModeMutation = useMutation({
    mutationFn: (mode: ExecutionMode) => setExecutionMode(mode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["execution-mode"] }),
  });

  const currentMode = modeQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Recomendaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Motor de reglas sobre bestsellers reales de OrderFlow — auditable, con shadow mode.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentMode && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="text-xs text-slate-500">Modo:</span>
              <ModeBadge mode={currentMode} />
              <button
                onClick={() => toggleModeMutation.mutate(currentMode === "LIVE" ? "SHADOW" : "LIVE")}
                disabled={toggleModeMutation.isPending}
                className="ml-1 rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Cambiar a {currentMode === "LIVE" ? "SHADOW" : "LIVE"}
              </button>
            </div>
          )}
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {generateMutation.isPending ? "Generando..." : "Generar recomendaciones"}
          </button>
        </div>
      </div>

      {recommendationsQuery.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

      {recommendationsQuery.data && recommendationsQuery.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
          Todavía no hay recomendaciones. Generá la primera tanda con el botón de arriba.
        </div>
      )}

      <ul className="space-y-3">
        {recommendationsQuery.data?.map((rec) => (
          <li
            key={rec.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-200">{rec.reason}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Regla: <span className="font-mono text-slate-400">{rec.ruleTriggered}</span>
                </p>
              </div>
              <ModeBadge mode={rec.mode} />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
              <span>Creada: {new Date(rec.createdAt).toLocaleString("es-AR")}</span>
              {rec.executedAt && <span className="text-emerald-500">Ejecutada: {new Date(rec.executedAt).toLocaleString("es-AR")}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
