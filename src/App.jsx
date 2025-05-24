/* Importazione delle dipendenze necessarie */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

/* Importazione dei componenti */
import Register from './Register';
import Recruiter from './Recruiter';
import AccessCandidate from './AccessCandidate';
import Welcome from './Welcome';
import './App.css';

/* Componente principale dell'applicazione */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  /* Stati per la gestione dell'utente */
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* Stati per la gestione degli annunci */
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [annuncioText, setAnnuncioText] = useState({
    titolo: '',
    descrizione: ''
  });
  
  /* Stati per la gestione del caricamento e dei messaggi */
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  /* Verifica dello stato di autenticazione all'avvio */
  useEffect(() => {
    const storedUser = localStorage.getItem('recruiterUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Errore nel recuperare i dati utente:', error);
        localStorage.removeItem('recruiterUser');
      }
    }
  }, []);

  /* Gestione del login */
  const handleLogin = (userData) => {
    localStorage.setItem('recruiterUser', JSON.stringify(userData));
    setCurrentUser(userData);
    setIsLoggedIn(true);
    navigate('/welcome');
  };

  /* Gestione del logout */
  const handleLogout = () => {
    localStorage.removeItem('recruiterUser');
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigate('/welcome');
  };

  /* Navigazione tra le pagine */
  const handleRegisterClick = () => {
    navigate('/recruiter');
  };

  const handleCandidateClick = () => {
    navigate('/candidate');
  };

  /* Gestione del processo di login */
  const [loginMessage, setLoginMessage] = useState('');

  const handleLoginSubmit = async (loginData) => {
    setLoginMessage('');
    
    if (!loginData.username.trim() || !loginData.password.trim()) {
      setLoginMessage('Username e password sono obbligatori');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:1337/api/recruiters?filters[username][$eq]=${encodeURIComponent(loginData.username)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const data = await response.json();
      
      if (data.data && data.data.length > 0 && data.data[0].password === loginData.password) {
        const userData = {
          id: data.data[0].id,
          username: data.data[0].username,
          nome: data.data[0].nome,
          cognome: data.data[0].cognome,
          email: data.data[0].email,
          azienda: data.data[0].azienda
        };
        
        setLoginMessage('Login effettuato con successo!');
        
        setTimeout(() => {
          handleLogin(userData);
        }, 800);
      } else {
        setLoginMessage('Username o password non corretti');
      }
    } catch (error) {
      console.error('Errore di connessione al server:', error);
      setLoginMessage('Errore di connessione al server');
    }
  };

  /* Gestione della navigazione alla home */
  const handleTitleClick = () => {
    navigate('/welcome');
  };

  /* Gestione del salvataggio degli annunci */
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
      const annuncioData = {
        data: {
          titolo: annuncioText.titolo.trim(),
          descrizione: annuncioText.descrizione.trim()
        }
      };

      const response = await fetch('http://localhost:1337/api/annuncios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(annuncioData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Annuncio salvato con successo!');
        setAnnuncioText({ titolo: '', descrizione: '' });
        setTimeout(() => {
          setShowCreateBox(false);
          setMessage('');
        }, 2000);
      } else {
        console.error('Errore dal server:', data);
        setMessage('Errore nel salvare l\'annuncio: ' + (data.error?.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Errore di connessione:', error);
      setMessage('Errore di connessione al server.');
    } finally {
      setIsLoading(false);
    }
  };

  /* Struttura del componente */
  return (
    <div className="app-container">
      <head>
        <title>CareerConnect</title>
      </head>
      <header className="app-header">
        <div className="header-content">
          <h1 
            className="clickable-title"
            onClick={handleTitleClick}
            title="Torna alla home"
          >
            CareerConnect
          </h1>
          <input
            type="text"
            className="search-bar"
            placeholder="Cerca offerte..."
          />
          <div className="auth-buttons">
            {isLoggedIn && currentUser ? (
              <div className="user-container">
                <button
                  className="create-button"
                  onClick={() => setShowCreateBox(true)}
                >
                  Crea Annuncio
                </button>
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
                <button className="login-button" onClick={handleCandidateClick}>
                  Entra come CANDIDATO
                </button>
                <button className="register-button" onClick={handleRegisterClick}>
                  Entra come RECRUITER
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
          <Route path="/register" element={<Register onLoginSubmit={handleLoginSubmit} loginMessage={loginMessage} />} />
          <Route path="/recruiter" element={<Recruiter onLoginSubmit={handleLoginSubmit} loginMessage={loginMessage} />} />
          <Route path="/candidate" element={<AccessCandidate />} />
        </Routes>

        {isLoggedIn && currentUser && showCreateBox && (
          <div className="modal-overlay">
            <form onSubmit={handleSaveAnnuncio} className="create-form">
              <h2 className="form-title">Crea un nuovo annuncio</h2>
              
              <div className="creator-info">
                Stai creando come: <strong>{currentUser?.nome} {currentUser?.cognome}</strong>
              </div>
              
              {message && (
                <div className={`feedback-message ${message.includes('Errore') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}

              <div className="form-field-container">
                <label htmlFor="titolo" className="form-label">
                  Titolo *
                </label>
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
                <label htmlFor="descrizione" className="form-label">
                  Descrizione *
                </label>
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="save-button"
                >
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

/* Componente wrapper per il routing */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;