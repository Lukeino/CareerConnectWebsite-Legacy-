import React, { useState } from 'react';
import './LoginRecruiter.css';

function LoginRecruiter() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Login effettuato con successo!');
        // Puoi salvare il JWT token: data.jwt
      } else {
        setMessage('Credenziali non valide');
      }
    } catch (error) {
      setMessage('Errore di connessione al server.');
    }
  };

  return (
    <div className="candidate-box">
      <h2>Login Recruiter</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <label className="candidate-label" htmlFor="identifier">Email o Username</label>
        <input
          className="candidate-input"
          type="text"
          id="identifier"
          name="identifier"
          value={form.identifier}
          onChange={handleChange}
          required
        />
        <label className="candidate-label" htmlFor="password">Password</label>
        <input
          className="candidate-input"
          type="password"
          id="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button className="entra-btn" type="submit">ENTRA</button>
        {message && (
          <div className={`login-message ${message.includes('successo') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default LoginRecruiter;