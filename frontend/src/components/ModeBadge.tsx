import type { ExecutionMode } from "../api/types.js";

export function ModeBadge({ mode }: { mode: ExecutionMode }) {
  const isLive = mode === "LIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${
        isLive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-slate-400"}`} />
      {mode}
    </span>
  );
}
