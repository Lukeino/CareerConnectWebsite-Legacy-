import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Importa i tuoi componenti specifici per Recruiter
import RegisterRecruiter from './RegisterRecruiter';
import LoginRecruiter from './LoginRecruiter';
import Welcome from './Welcome';
import GestioneAnnunci from './GestioneAnnunci'; // Componente per la gestione annunci dei recruiter

import './App.css'; // Il tuo CSS principale
import logo from './assets/logo.png'; // Aggiusta il percorso in base a dove hai messo l'immagine

function AppContent() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- LOGICA DI AUTENTICAZIONE CENTRALIZZATA ---
  // Questa funzione è la "porta" per il login, chiamata da LoginRecruiter.jsx
  const handleLoginSuccess = (userData, jwtToken) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('jwt', jwtToken);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    // Naviga alla dashboard del recruiter dopo il login
    navigate('/recruiter-dashboard');
  };

  // Logica di logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwt');
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigate('/welcome'); // Torna alla home o pagina di benvenuto
  };

  // Verifica lo stato di autenticazione all'avvio dell'app
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedJwt = localStorage.getItem('jwt');
    if (storedUser && storedJwt) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsLoggedIn(true);
        // Se già loggato, reindirizza alla dashboard del recruiter
        navigate('/recruiter-dashboard');
      } catch (error) {
        console.error('Errore nel recuperare i dati utente o JWT:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('jwt');
      }
    }
  }, []);

  // --- LOGICA DI NAVIGAZIONE HEADER ---
  const handleRecruiterLoginClick = () => {
    navigate('/recruiter-login');
  };

  const handleRecruiterRegisterClick = () => {
    navigate('/recruiter-register');
  };

  const handleTitleClick = () => {
    navigate('/welcome');
  };

  const handleCandidateLoginClick = () => {
  navigate('/candidate-login');
};

  return (
    <div className="app-container">
      <head>
        <title>CareerConnect</title>
      </head>
      <header className="app-header">
        <div className="header-content">
          <img
            src={logo}
            alt="CareerConnect Logo"
            className="clickable-title"
            onClick={handleTitleClick}
            title="Torna alla home"
          />
          <input
            type="text"
            className="search-bar"
            placeholder="Cerca offerte..."
          />
          <div className="auth-buttons">
            {isLoggedIn && currentUser ? (
              <div className="user-container">
                {/* Il pulsante "Crea Annuncio" sarà gestito all'interno di GestioneAnnunci */}
                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
                <span role="img" aria-label="user" className="user-icon">👤</span>
                <span className="user-name">
                  {currentUser.nome} {currentUser.cognome} (@{currentUser.username})
                </span>
              </div>
            ) : (
              <>
                <button className="login-button" onClick={handleRecruiterLoginClick}>
                  Accedi come RECRUITER
                </button>
                <button className="login-button candidate" onClick={handleCandidateLoginClick}>
                  Accedi come CANDIDATO
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Welcome currentUser={currentUser} />} />
          <Route path="/welcome" element={<Welcome currentUser={currentUser} />} />

          {/* Rotte specifiche per i Recruiter */}
          <Route path="/recruiter-register" element={<RegisterRecruiter />} />
          <Route path="/recruiter-login" element={<LoginRecruiter onLoginSuccess={handleLoginSuccess} />} />

          {/* Dashboard del Recruiter (protetta) */}
          {isLoggedIn && currentUser?.roleType === 'recruiter' && (
            <Route
              path="/recruiter-dashboard"
              element={<GestioneAnnunci currentUser={currentUser} handleLogout={handleLogout} />}
            />
          )}

          {/* Fallback per rotte non trovate, o reindirizzamento se non loggato */}
          <Route path="*" element={<Welcome currentUser={currentUser} />} />
        </Routes>

        {/* Il modal per la creazione annunci è stato spostato in GestioneAnnunci.jsx */}
      </main>
      <footer className="app-footer">
        <p>© 2025 CareerConnect. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;