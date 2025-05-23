import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ExercisePage from "./pages/ExercisesPage";
import SessionsPage from "./pages/SessionsPage";
import SessionPage from "./pages/SessionPage";

function App() {
  return (
    <Routes>
      {/* Redirect root to /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/sessions/:sessionId" element={<SessionPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/exercises" element={<ExercisePage />} />
      <Route path="/sessions" element={<SessionsPage />} />

      {/* Catch-all back to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
