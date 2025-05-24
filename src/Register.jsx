import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import './Register.css';

function Register({ onLoginSubmit, loginMessage }) {
  const [form, setForm] = useState({
    username: '',
    nome: '',
    cognome: '',
    email: '',
    password: '',
    azienda: ''
  });
  const [message, setMessage] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLoginChange = e => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:1337/api/recruiters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: form }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registrazione avvenuta con successo!');
        setForm({ 
          username: '', 
          nome: '', 
          cognome: '', 
          email: '', 
          password: '', 
          azienda: '' 
        });
      } else {
        console.error(data);
        setMessage('Errore nella registrazione: ' + (data.error?.message || JSON.stringify(data)));
      }
    } catch (error) {
      setMessage('Errore di connessione al server.');
    }
  };

  const handleLoginSubmit = async e => {
    e.preventDefault();
    
    // Chiama la funzione centralizzata dall'App.jsx
    if (onLoginSubmit) {
      onLoginSubmit(loginForm);
    }
  };

  // Form di login
  const LoginForm = (
    <form className="login-form" onSubmit={handleLoginSubmit}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <input
        type="text"
        name="username"
        placeholder="Username"
        required
        value={loginForm.username}
        onChange={handleLoginChange}
        className="form-input"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        value={loginForm.password}
        onChange={handleLoginChange}
        className="form-input"
      />
      <button type="submit" className="btn btn-primary">
        Accedi
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          setShowLogin(false);
          setLoginForm({ username: '', password: '' });
        }}
      >
        Torna alla Registrazione
      </button>
      
      {loginMessage && (
        <div className={`message ${loginMessage.includes('successo') ? 'message-success' : 'message-error'}`}>
          {loginMessage.includes('successo') ? '✅ ' : '❌ '}
          {loginMessage}
        </div>
      )}
    </form>
  );

  return (
    <>
      <Helmet>
        <title>CareerConnect - Registrazione</title>
      </Helmet>
      <div className="register-container">
        <h1>{showLogin ? 'Login' : 'Registrazione'}</h1>
        <div className={`form-wrapper ${showLogin ? 'login-wrapper' : 'register-wrapper'}`}>
          {showLogin ? (
            LoginForm
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username" className="form-label">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="input-row">
                <div className="input-col">
                  <label htmlFor="nome" className="form-label">
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="input-col">
                  <label htmlFor="cognome" className="form-label">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    id="cognome"
                    name="cognome"
                    value={form.cognome}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="email" className="form-label">
                  E-Mail *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="password" className="form-label">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirm-password" className="form-label">
                  Conferma Password *
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  name="confirm-password"
                  className="form-input"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="azienda" className="form-label">
                  Azienda
                </label>
                <input
                  type="text"
                  id="azienda"
                  name="azienda"
                  value={form.azienda || ''}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-wide">
                Registrati
              </button>
              
              {message && (
                <div className={`message ${message.includes('successo') ? 'message-success' : 'message-error'}`}>
                  {message}
                </div>
              )}

              <div className="login-section">
                <div className="login-text">
                  Se hai già un account, clicca sul tasto LOGIN
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-wide"
                  onClick={() => {
                    setShowLogin(true);
                    setMessage('');
                  }}
                >
                  LOGIN
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default Register;