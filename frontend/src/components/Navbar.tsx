import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
  }`;

export function Navbar() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="text-sm font-semibold tracking-tight text-white">
            decision<span className="text-violet-400">·</span>engine
          </span>
          <nav className="flex items-center gap-1">
            <NavLink to="/recommendations" className={linkClasses}>
              Recomendaciones
            </NavLink>
            <NavLink to="/catalog" className={linkClasses}>
              Catálogo
            </NavLink>
            <NavLink to="/snapshots" className={linkClasses}>
              Tendencia de ventas
            </NavLink>
          </nav>
        </div>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
