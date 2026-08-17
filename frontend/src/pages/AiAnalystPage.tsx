import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { askAi, listInsights } from "../api/ai.js";

interface ChatEntry {
  question: string;
  answer: string;
  toolsUsed: string[];
  cached: boolean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export function AiAnalystPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([]);

  const insightsQuery = useQuery({ queryKey: ["insights"], queryFn: listInsights });

  const askMutation = useMutation({
    mutationFn: askAi,
    onSuccess: (result, askedQuestion) => {
      setHistory((prev) => [...prev, { question: askedQuestion, ...result }]);
      setQuestion("");
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim() || askMutation.isPending) return;
    askMutation.mutate(question.trim());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Analyst</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Preguntale al motor sobre recomendaciones, ventas y catálogo. El modelo (Claude) solo ve
            datos agregados a través de tools — nunca la colección cruda completa.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 p-4">
          {history.length === 0 && !askMutation.isPending && (
            <p className="text-sm text-slate-500">
              Probá con algo como "¿cómo van las recomendaciones?" o "¿qué productos tienen más
              abandono de carrito?".
            </p>
          )}

          {history.map((entry, i) => (
            <div key={i} className="space-y-2 border-b border-white/5 pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-white">{entry.question}</p>
              <p className="whitespace-pre-wrap text-sm text-slate-300">{entry.answer}</p>
              {entry.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.toolsUsed.map((tool, ti) => (
                    <span
                      key={ti}
                      className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-400"
                    >
                      {tool}
                    </span>
                  ))}
                  {entry.cached && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">
                      cacheado
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {askMutation.isPending && <p className="text-sm text-slate-500">Pensando...</p>}
          {askMutation.isError && (
            <p className="text-sm text-rose-400">No se pudo responder — revisá que el backend tenga saldo/API key de Anthropic configurada.</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Preguntale algo al AI Analyst..."
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={askMutation.isPending || !question.trim()}
            className="shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            Preguntar
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Últimos insights
        </h2>
        <p className="text-xs text-slate-600">
          Generados automáticamente por el Insight Engine (cron periódico) — no en tiempo real.
        </p>

        {insightsQuery.isLoading && <p className="text-sm text-slate-500">Cargando...</p>}

        {insightsQuery.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            Todavía no se generó ningún insight. El Insight Engine corre según
            `INSIGHTS_CRON_SCHEDULE`.
          </div>
        )}

        <div className="space-y-3">
          {insightsQuery.data?.map((insight) => (
            <div key={insight.id} className="rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-slate-300">{insight.content}</p>
              <p className="mt-2 text-xs text-slate-600">
                {insight.generatedBy} · {formatDate(insight.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
