import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Importa i tuoi componenti specifici per Recruiter
import RegisterRecruiter from './RegisterRecruiter';
import LoginRecruiter from './LoginRecruiter';
import Welcome from './Welcome';
import GestioneAnnunci from './GestioneAnnunci';

// Importa i componenti per Candidati
import RegisterCandidate from './RegisterCandidate';
import LoginCandidate from './LoginCandidate';

import './App.css';
import logo from './assets/logo.png';

function AppContent() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Stati per gestire la creazione di annunci
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [annuncioText, setAnnuncioText] = useState({
    titolo: '',
    descrizione: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- LOGICA DI AUTENTICAZIONE CENTRALIZZATA ---
  const handleLoginSuccess = (userData, jwtToken) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('jwt', jwtToken);
    setCurrentUser(userData);
    setIsLoggedIn(true);
    
    // Naviga alla dashboard appropriata in base al ruolo
    if (userData.roleType === 'recruiter') {
      navigate('/recruiter-dashboard');
    } else if (userData.roleType === 'candidato') {
      navigate('/welcome'); // Per ora candidato va a welcome
    } else {
      navigate('/welcome');
    }
  };

  // Logica di logout
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwt');
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigate('/welcome');
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
        
        // Reindirizza alla dashboard appropriata in base al ruolo
        if (userData.roleType === 'recruiter') {
          navigate('/recruiter-dashboard');
        }
      } catch (error) {
        console.error('Errore nel recuperare i dati utente o JWT:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('jwt');
      }
    }
  }, [navigate]);

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

  // Funzione per salvare un nuovo annuncio
  const handleSaveAnnuncio = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn || !currentUser) {
      setMessage('Devi essere loggato per creare un annuncio');
      return;
    }
    
    if (!annuncioText.titolo.trim() || !annuncioText.descrizione.trim()) {
      setMessage('Tutti i campi sono obbligatori');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // IMPORTANTE: Aggiungi il creatore dell'annuncio
      const annuncioData = {
        data: {
          titolo: annuncioText.titolo.trim(),
          descrizione: annuncioText.descrizione.trim(),
          createdby: currentUser.id // ← Collega l'annuncio al recruiter
        }
      };

      console.log("Dati annuncio con creatore:", annuncioData);

      // Aggiungi il token JWT per l'autenticazione
      const jwt = localStorage.getItem('jwt');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      const response = await fetch('http://localhost:1337/api/annuncios', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(annuncioData)
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data = await response.json();
      setMessage('Annuncio salvato con successo!');
      setAnnuncioText({ titolo: '', descrizione: '' });
      
      setTimeout(() => {
        setShowCreateBox(false);
        setMessage('');
        
        if (window.location.pathname === '/welcome' || window.location.pathname === '/') {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error('Errore:', error);
      setMessage('Errore: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
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
              <div className="user-container" style={{ display: 'flex', alignItems: 'center' }}>
                {/* Pulsante Crea Annuncio solo per recruiter */}
                {currentUser.roleType === 'recruiter' && (
                  <button
                    onClick={() => setShowCreateBox(true)}
                    style={{ 
                      backgroundColor: '#0d7bd4', 
                      color: 'white',
                      marginRight: '12px',
                      padding: '7px 16px',
                      border: 'none',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Crea Annuncio
                  </button>
                )}
                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
                <span role="img" aria-label="user" className="user-icon">
                  {currentUser.roleType === 'recruiter' ? '👔' : '👤'}
                </span>
                <span className="user-name">
                  {currentUser.nome} {currentUser.cognome} (@{currentUser.username})
                  {currentUser.roleType === 'recruiter' && currentUser.azienda && (
                    <span className="company-info"> - {currentUser.azienda}</span>
                  )}
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
          
          {/* Rotte specifiche per i Candidati */}
          <Route path="/candidate-register" element={<RegisterCandidate />} />
          <Route path="/candidate-login" element={<LoginCandidate onLoginSuccess={handleLoginSuccess} />} />

          {/* Dashboard del Recruiter (protetta) */}
          {isLoggedIn && currentUser?.roleType === 'recruiter' && (
            <Route
              path="/recruiter-dashboard"
              element={<GestioneAnnunci currentUser={currentUser} handleLogout={handleLogout} />}
            />
          )}

          {/* Fallback per rotte non trovate */}
          <Route path="*" element={<Welcome currentUser={currentUser} />} />
        </Routes>

        {/* Modale per la creazione di un nuovo annuncio (solo per recruiter) */}
        {isLoggedIn && currentUser?.roleType === 'recruiter' && showCreateBox && (
          <div className="modal-overlay">
            <form onSubmit={handleSaveAnnuncio} className="create-form">
              <h2 className="form-title">Crea un nuovo annuncio</h2>
              
              <div className="creator-info">
                Stai creando come: <strong>{currentUser?.nome} {currentUser?.cognome}</strong>
                {currentUser?.azienda && ` di ${currentUser.azienda}`}
              </div>
              
              {message && (
                <div className={`feedback-message ${message.includes('Errore') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}

              <div className="form-field-container">
                <label htmlFor="titolo" className="form-label">Titolo *</label>
                <input
                  type="text"
                  id="titolo"
                  name="titolo"
                  value={annuncioText.titolo}
                  onChange={e => setAnnuncioText({ ...annuncioText, titolo: e.target.value })}
                  disabled={isLoading}
                  className="form-input"
                  placeholder="Es. Sviluppatore Frontend React"
                  required
                />
              </div>
              
              <div className="form-field-container">
                <label htmlFor="descrizione" className="form-label">Descrizione *</label>
                <textarea
                  id="descrizione"
                  name="descrizione"
                  value={annuncioText.descrizione}
                  onChange={e => setAnnuncioText({ ...annuncioText, descrizione: e.target.value })}
                  disabled={isLoading}
                  className="form-textarea"
                  placeholder="Descrizione dettagliata della posizione..."
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit" disabled={isLoading} className="save-button">
                  {isLoading ? 'Salvando...' : 'Salva Annuncio'}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  className="cancel-button"
                  onClick={() => {
                    setShowCreateBox(false);
                    setAnnuncioText({ titolo: '', descrizione: '' });
                    setMessage('');
                  }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}
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