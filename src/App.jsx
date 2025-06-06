import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import NavBar from "./components/navBar";
import DashboardPage from "./pages/DashboardPage";
import ExercisePage from "./pages/ExercisesPage";
import SessionsPage from "./pages/SessionsPage";
import SessionPage from "./pages/SessionPage";
import BulkPage from './pages/BulkPage';


function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Redirect root to /dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/sessions/:sessionId" element={<SessionPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/exercises" element={<ExercisePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/bulk" element={<BulkPage />} />


        {/* Catch-all back to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
