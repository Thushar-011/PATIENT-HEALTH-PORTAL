// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getMyPatientProfile } from '../api/client';
import { getTokens, setTokens, removeTokens } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getTokens());
  // Add state for user role
  const [isDoctor, setIsDoctor] = useState(localStorage.getItem('userRole') === 'doctor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect can be simplified as the initial state is now set directly
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const tokens = await loginUser(username, password);
      setTokens(tokens);
      setIsAuthenticated(true);

      // After login, determine the user's role
      try {
        const patientProfile = await getMyPatientProfile();
        if (patientProfile && patientProfile.length > 0) {
          // User is a patient
          localStorage.setItem('userRole', 'patient');
          setIsDoctor(false);
        } else {
          // User is likely a doctor (or has no profile yet)
          localStorage.setItem('userRole', 'doctor');
          setIsDoctor(true);
        }
      } catch (profileError) {
        // Handle cases where profile check fails, default to patient view
        localStorage.setItem('userRole', 'patient');
        setIsDoctor(false);
      }

      return tokens;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    removeTokens();
    localStorage.removeItem('userRole'); // Clear role on logout
    setIsAuthenticated(false);
    setIsDoctor(false);
    // Redirect to login page to ensure clean state
    window.location.href = '/login';
  };

  const authData = {
    isAuthenticated,
    isDoctor, // Expose the isDoctor flag
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authData}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);