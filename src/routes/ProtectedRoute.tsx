import { Navigate } from 'react-router-dom';
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "CLIENTE"; // 👈 nuevo
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole'); // 👈 obtenemos el rol

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Si hay rol requerido y no coincide, redirigimos
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
