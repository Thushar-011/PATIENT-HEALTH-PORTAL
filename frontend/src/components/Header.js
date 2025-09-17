// frontend/src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="header">
      <nav>
        <Link to="/" className="logo">My Healthcare App</Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/appointments">Appointments</Link>
              <Link to="/doctors">Doctors</Link>
              <Link to="/messages">Messages</Link>
              {/* ADD THE LINK TO THE NEW PAGE HERE */}
              <Link to="/prescriptions">Prescriptions</Link>
              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;