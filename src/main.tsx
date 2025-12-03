import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';

// --- Páginas públicas ---
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { LandingPage } from './pages/LandingPage';

// --- Páginas protegidas ---
import { ClienteDashboard } from './pages/cliente/ClienteDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

// --- Páginas de Pago ---
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// --- Rutas ---
import ProtectedRoute from './routes/ProtectedRoute';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* --- RUTAS DE PAGO (Públicas) --- */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />

        {/* --- RUTAS PROTEGIDAS --- */}
        {/* CLIENTE */}
        <Route
          path="/cliente-dashboard/*"
          element={
            <ProtectedRoute requiredRole="CLIENTE">
              <ClienteDashboard/>
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* --- REDIRECCIÓN --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);                                                                                                                     