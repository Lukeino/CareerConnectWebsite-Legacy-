import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FaBell, FaCommentDots } from 'react-icons/fa'; // Aggiungo l'icona del messaggio
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

// Importa i tuoi componenti specifici per Recruiter
import RegisterRecruiter from './RegisterRecruiter';
import LoginRecruiter from './LoginRecruiter';
import Welcome from './Welcome';
import GestioneAnnunci from './GestioneAnnunci';
import RecruiterDashboard from './RecruiterDashboard';
import CreaAnnuncio from './CreaAnnuncio';

// Importa i componenti per Candidati
import RegisterCandidate from './RegisterCandidate';
import LoginCandidate from './LoginCandidate';
import ListaOfferte from './ListaOfferte';

import './App.css';
import logo from './assets/logo.png';
import guestPfp from './assets/Guest_PFP.png';

function AppContent() {
  const navigate = useNavigate();
  
  // Inizializzazione sincrona per evitare flash
  const initializeAuth = () => {
    const storedUser = localStorage.getItem('currentUser');
    const storedJwt = localStorage.getItem('jwt');
    if (storedUser && storedJwt) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('✅ Utente autenticato:', userData.nome, userData.cognome, '- Ruolo:', userData.roleType);
        return { user: userData, loggedIn: true };
      } catch (error) {
        console.error('Errore nel recuperare i dati utente o JWT:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('jwt');
        return { user: null, loggedIn: false };
      }
    }
    return { user: null, loggedIn: false };
  };

  const { user: initialUser, loggedIn: initialLoggedIn } = initializeAuth();
  
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Stato per la ricerca
  const [searchTerm, setSearchTerm] = useState('');

  // --- LOGICA DI AUTENTICAZIONE CENTRALIZZATA ---
  const handleLoginSuccess = (userData, jwtToken) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('jwt', jwtToken);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    
    // Naviga alla homepage per tutti i ruoli
    navigate('/welcome');
  };

  // Logica di logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwt');
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigate('/welcome');
  };

  // --- LOGICA DI NAVIGAZIONE HEADER ---
  const handleRecruiterLoginClick = () => {
    navigate('/recruiter-login');
  };

  const handleTitleClick = () => {
    navigate('/welcome');
  };

  const handleCandidateLoginClick = () => {
    navigate('/candidate-login');
  };

  // Gestione menu utente
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const closeUserMenu = () => {
    setShowUserMenu(false);
  };

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Funzione per aggiornare l'utente corrente (passata al dashboard del recruiter)
  const updateCurrentUser = (updatedUser) => {
    // Aggiorna sia lo stato che il localStorage per sincronizzazione completa
    const newUserData = {
      ...currentUser,
      ...updatedUser
    };
    localStorage.setItem('currentUser', JSON.stringify(newUserData));
    setCurrentUser(newUserData);
    console.log('✅ CurrentUser aggiornato in tempo reale:', newUserData);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-and-home-container">
            <img
              src={logo}
              alt="CareerConnect Logo"
              className="clickable-title"
              onClick={handleTitleClick}
              title="Torna alla home"
            />
            <button
              className={`home-button-header ${(() => {
                const path = window.location.pathname;
                return (path === '/welcome' || path === '/') ? 'active' : '';
              })()}`}
              onClick={handleTitleClick}
              title="Torna alla home"
            >
              Home
            </button>
            <button
              className="home-button-header"
              onClick={() => {}}
              title="Contatti"
            >
              Contatti
            </button>
          </div>
          {/* Barra di ricerca visibile solo nella home e per candidati, escluso dalle pagine recruiter */}
          {(() => {
            const path = window.location.pathname;
            const isRecruiterPage = path.startsWith('/recruiter-') || 
                                   path === '/recruiter-dashboard' || 
                                   path === '/recruiter-annunci' || 
                                   path === '/recruiter-crea-annuncio';
            const isHomePage = path === '/welcome' || path === '/';
            const isCandidato = currentUser?.roleType === 'candidato';
            
            // Mostra la barra di ricerca solo se:
            // - È nella home page OPPURE
            // - L'utente è un candidato E NON è in una pagina recruiter
            return (isHomePage || (isCandidato && !isRecruiterPage)) && (
              <input
                type="text"
                className="search-bar"
                placeholder="Cerca offerte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            );
          })()}
          <div className="auth-buttons">
            {isLoggedIn && currentUser ? (
              <div className="user-menu-container">
                {/* Icone per recruiter */}
                {currentUser.roleType === 'recruiter' && (
                  <div className="recruiter-icons">
                    <FaCommentDots 
                      className="message-icon" 
                      title="Messaggi"
                      onClick={() => console.log('Messaggi clicked')} // Placeholder per future funzionalità
                    />
                    <FaBell 
                      className="notification-bell" 
                      title="Notifiche"
                      onClick={() => console.log('Notifiche clicked')} // Placeholder per future funzionalità
                    />
                  </div>
                )}
                <img
                  src={guestPfp}
                  alt="User Profile"
                  className="user-profile-image"
                  onClick={toggleUserMenu}
                  title="Menu utente"
                />
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-info-section">
                      <div className="user-nickname">@{currentUser.username}</div>
                      {(currentUser.nome || currentUser.cognome) && (
                        <div className="user-fullname">
                          {currentUser.nome} {currentUser.cognome}
                        </div>
                      )}
                      {currentUser.roleType === 'recruiter' && currentUser.azienda && (
                        <div className="user-company">{currentUser.azienda}</div>
                      )}
                    </div>
                    <div className="user-actions-section">
                      {currentUser.roleType === 'recruiter' && (
                        <>
                          <button
                            className="dropdown-button dashboard-btn"
                            onClick={() => {
                              navigate('/recruiter-dashboard');
                              closeUserMenu();
                            }}
                          >
                            Dashboard
                          </button>
                          <button
                            className="dropdown-button dashboard-btn"
                            onClick={() => {
                              navigate('/recruiter-annunci');
                              closeUserMenu();
                            }}
                          >
                            I miei annunci
                          </button>
                          <div className="menu-separator"></div>
                        </>
                      )}
                      <button
                        className="dropdown-button logout-btn"
                        onClick={() => {
                          handleLogout();
                          closeUserMenu();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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
          <Route path="/" element={<Welcome currentUser={currentUser} searchTerm={searchTerm} />} />
          <Route path="/welcome" element={<Welcome currentUser={currentUser} searchTerm={searchTerm} />} />

          {/* Rotte specifiche per i Recruiter */}
          <Route path="/recruiter-register" element={<RegisterRecruiter />} />
          <Route path="/recruiter-login" element={<LoginRecruiter onLoginSuccess={handleLoginSuccess} />} />
          
          {/* Rotte specifiche per i Candidati */}
          <Route path="/candidate-register" element={<RegisterCandidate />} />
          <Route path="/candidate-login" element={<LoginCandidate onLoginSuccess={handleLoginSuccess} />} />
          
          {/* Pagina Lista Offerte */}
          <Route path="/lista-offerte" element={<ListaOfferte currentUser={currentUser} searchTerm={searchTerm} />} />

          {/* Dashboard del Recruiter (sempre disponibili, con controllo interno) */}
          <Route
            path="/recruiter-dashboard"
            element={<RecruiterDashboard currentUser={currentUser} handleLogout={handleLogout} updateCurrentUser={updateCurrentUser} />}
          />
          <Route
            path="/recruiter-annunci"
            element={<GestioneAnnunci currentUser={currentUser} handleLogout={handleLogout} />}
          />
          <Route
            path="/recruiter-crea-annuncio"
            element={<CreaAnnuncio currentUser={currentUser} handleLogout={handleLogout} />}
          />

          {/* Fallback per rotte non trovate */}
          <Route path="*" element={<Welcome currentUser={currentUser} searchTerm={searchTerm} />} />
        </Routes>
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