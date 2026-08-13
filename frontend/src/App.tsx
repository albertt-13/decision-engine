import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.js";
import { RecommendationsPage } from "./pages/RecommendationsPage.js";
import { SnapshotsPage } from "./pages/SnapshotsPage.js";
import { CatalogPage } from "./pages/CatalogPage.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/snapshots" element={<SnapshotsPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/recommendations" replace />} />
    </Routes>
  );
}
