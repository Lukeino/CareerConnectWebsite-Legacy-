import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginCandidate.css';

function LoginCandidate({ onLoginSuccess }) {
  const navigate = useNavigate();
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

      // Verifica che esista un ruolo e che sia 'candidato'
      if (!roleData.data?.[0] || roleData.data[0].roleType !== 'candidato') {
        console.log("Role data exists:", !!roleData.data?.[0]);
        if (roleData.data?.[0]) {
            console.log("User role value from data[0]:", roleData.data[0].roleType);
        }
        setLoginMessage('Accesso negato: Non sei un account Candidato.');
        setIsLoggingIn(false);
        return;
      }

      // --- PASSO 2: Recupera i dettagli del Candidato ---
      const detailsResponse = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${baseUser.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });

      const candidatoDetailsData = await detailsResponse.json();

      if (!detailsResponse.ok) {
        console.error('Errore nel recuperare i dettagli del candidato:', candidatoDetailsData);
        setLoginMessage('Login effettuato, ma non è stato possibile caricare i dettagli del candidato.');
        setIsLoggingIn(false);
        return;
      }

      // Estrai i dettagli del candidato
      const candidatoDetails = candidatoDetailsData.data?.[0];

      const combinedUserData = {
        ...baseUser,
        roleType: 'candidato',
        nome: candidatoDetails?.attributes?.nome || '',
        cognome: candidatoDetails?.attributes?.cognome || '',
      };

      setLoginMessage('Login Candidato effettuato con successo!');
      onLoginSuccess(combinedUserData, jwt);

    } catch (error) {
      console.error('Errore di connessione o autenticazione:', error);
      setLoginMessage('Errore di connessione al server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-candidato-container">
      <form className="login-form" onSubmit={handleLoginSubmit}>
        <h2>Accesso Candidato</h2>
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
        </div>
        <button type="submit" className="login-button" disabled={isLoggingIn}>
          {isLoggingIn ? 'Accesso in corso...' : 'Accedi'}
        </button>
        {loginMessage && (
          <div className={`message ${loginMessage.includes('successo') ? 'success' : 'error'}`}>
            {loginMessage}
          </div>
        )}
        <div className="register-link">
          Non hai un account? <button type="button" onClick={() => navigate('/candidate-register')} disabled={isLoggingIn}>Registrati</button>
        </div>
      </form>
    </div>
  );
}

export default LoginCandidate;