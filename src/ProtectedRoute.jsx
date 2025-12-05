// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";        // <- 경로도 ../ 로
import LoadingSpinner from "../components/common/Loader";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();       // <- loading 으로 받기
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullscreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
