// frontend/src/App.js
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Header from './Header';
import PrivateRoute from './PrivateRoute';
import LoadingSpinner from './LoadingSpinner';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const CreateProfilePage = lazy(() => import('../pages/CreateProfilePage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AppointmentsPage = lazy(() => import('../pages/AppointmentsPage'));
const DoctorsPage = lazy(() => import('../pages/DoctorsPage'));
const MessagesPage = lazy(() => import('../pages/MessagesPage'));
const PrescriptionsPage = lazy(() => import('../pages/PrescriptionsPage')); // 1. IMPORT THE NEW PAGE

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/create-profile" element={<PrivateRoute><CreateProfilePage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
      <Route path="/doctors" element={<PrivateRoute><DoctorsPage /></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
      {/* 2. ADD THE ROUTE FOR THE NEW PAGE */}
      <Route path="/prescriptions" element={<PrivateRoute><PrescriptionsPage /></PrivateRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
}

// The App() function below remains unchanged
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <main className="App-main">
            <Suspense fallback={<LoadingSpinner />}>
              <AppRoutes />
            </Suspense>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;