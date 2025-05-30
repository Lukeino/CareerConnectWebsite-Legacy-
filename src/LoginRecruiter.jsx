import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginRecruiter.css';

function LoginRecruiter({ onLoginSuccess }) {
  const navigate = useNavigate();
  
  // Scroll all'inizio della pagina quando il componente viene montato
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [loginMessage, setLoginMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginChange = e => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async e => {
    e.preventDefault();
    setLoginMessage('');
    setIsLoggingIn(true);

    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginMessage('Username e password sono obbligatori');
      setIsLoggingIn(false);
      return;
    }

    try {
      // --- PASSO 1: Autenticazione dell'utente ---
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: loginForm.username,
          password: loginForm.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage('Username o password non corretti');
        setIsLoggingIn(false);
        return;
      }

      const jwt = data.jwt;
      const baseUser = data.user;

      // Verifica del ruolo attraverso user-roles
      const roleResponse = await fetch(`http://localhost:1337/api/user-roles?filters[user][id][$eq]=${baseUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });

      const roleData = await roleResponse.json();
      console.log("Full role data:", roleData);

      // Verifica che esista un ruolo e che sia 'recruiter'
      if (!roleData.data?.[0] || roleData.data[0].roleType !== 'recruiter') {
        console.log("Role data exists:", !!roleData.data?.[0]);
        if (roleData.data?.[0]) {
            console.log("User role value from data[0]:", roleData.data[0].roleType);
        }
        setLoginMessage('Accesso negato: Non sei un account Recruiter.');
        setIsLoggingIn(false);
        return;
      }

      // --- PASSO 2: Recupera i dettagli del Recruiter usando populate ---
      const detailsResponse = await fetch(`http://localhost:1337/api/users/${baseUser.id}?populate=recruiter_detail`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });

      const fullUserData = await detailsResponse.json();

      if (!detailsResponse.ok) {
        console.error('Errore nel recuperare i dettagli del recruiter:', fullUserData);
        setLoginMessage('Login effettuato, ma non è stato possibile caricare i dettagli del recruiter.');
        setIsLoggingIn(false);
        return;
      }

      // IMPORTANTE: Aggiungi roleType anche per il recruiter
      const combinedUserData = {
        ...baseUser,
        roleType: 'recruiter', // ← AGGIUNTO QUESTO CAMPO!
        nome: fullUserData.recruiter_detail?.nome || '',
        cognome: fullUserData.recruiter_detail?.cognome || '',
        azienda: fullUserData.recruiter_detail?.azienda || '',
      };

      console.log("✅ Login recruiter completato! User data finale:", combinedUserData);
      setLoginMessage('Login Recruiter effettuato con successo!');
      onLoginSuccess(combinedUserData, jwt);

    } catch (error) {
      console.error('Errore di connessione o autenticazione:', error);
      setLoginMessage('Errore di connessione al server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-recruiter-container">
      <form className="login-form" onSubmit={handleLoginSubmit}>
        <h2>Accesso Recruiter</h2>
        <div className="form-group">
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={loginForm.username}
            onChange={handleLoginChange}
            className="form-input"
            disabled={isLoggingIn}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={loginForm.password}
            onChange={handleLoginChange}
            className="form-input"
            disabled={isLoggingIn}
          />
        </div>        <button type="submit" className="login-button-recruiter" disabled={isLoggingIn}>
          {isLoggingIn ? 'Accesso in corso...' : 'Accedi'}
        </button>
        {loginMessage && (
          <div className={`message ${loginMessage.includes('successo') ? 'success' : 'error'}`}>
            {loginMessage}
          </div>
        )}
        <div className="register-link">
          Non hai un account? <button type="button" onClick={() => navigate('/recruiter-register')} disabled={isLoggingIn}>Registrati</button>
        </div>
      </form>
    </div>
  );
}

export default LoginRecruiter;