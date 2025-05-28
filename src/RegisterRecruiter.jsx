import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import './RegisterRecruiter.css';
import registerGif from './assets/Register.gif'; // Aggiungi questa riga

function RegisterRecruiter() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    nome: '',
    cognome: '',
    email: '',
    password: '',
    azienda: ''
  });
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setIsRegistering(true);

    try {
      const confirmPassword = document.getElementById('confirm-password').value;
      if (form.password !== confirmPassword) {
        setMessage('Le password non coincidono');
        setIsRegistering(false);
        return;
      }

      // --- PASSO 1: Registrazione dell'utente base in Strapi ---
      // Questo blocco di codice è stato mantenuto per completezza,
      // ma l'utente ha specificato di non voler modifiche al backend.
      // In un'applicazione reale, questa parte interagirebbe con il backend.
      const registerUserResponse = await fetch('http://localhost:1337/api/auth/local/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const userData = await registerUserResponse.json();

      if (!registerUserResponse.ok) {
        setMessage('Errore nella registrazione utente: ' + (userData.error?.message || JSON.stringify(userData)));
        setIsRegistering(false);
        return;
      }

      // Estrazione del JWT e dell'ID dell'utente appena creato
      const jwt = userData.jwt;
      const userId = userData.user.id;

      // --- PASSO 2: Creazione dei dettagli del Recruiter (opzionali) ---
      if (form.nome || form.cognome || form.azienda) {
        const recruiterDetailsResponse = await fetch('http://localhost:1337/api/recruiter-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({
            data: {
              nome: form.nome,
              cognome: form.cognome,
              azienda: form.azienda,
              user: userId
            }
          }),
        });


        if (!recruiterDetailsResponse.ok) {
          const errorData = await recruiterDetailsResponse.json();
          console.error('Errore nella creazione dei dettagli recruiter:', errorData);
          setMessage(prev => prev + ' Ma non è stato possibile salvare i dettagli del recruiter: ' + (errorData.error?.message || JSON.stringify(errorData)));
        }
      }

      // --- PASSO 3: Assegnazione ruolo dell'utente ---
      const userRoleResponse = await fetch('http://localhost:1337/api/user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            roleType: 'recruiter',
            user: userId
          }
        }),
      });

      if (!userRoleResponse.ok) {
        const errorData = await userRoleResponse.json();
        console.error('Errore nell\'assegnazione del ruolo:', errorData);
        setMessage(prev => prev + ' Ma non è stato possibile assegnare il ruolo: ' + (errorData.error?.message || JSON.stringify(errorData)));
      }

      setMessage('Registrazione Recruiter avvenuta con successo! Puoi ora effettuare il login.');
      setForm({
        username: '',
        nome: '',
        cognome: '',
        email: '',
        password: '',
        azienda: ''
      });
      setTimeout(() => {
        navigate('/recruiter-login');
      }, 1500);

    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      setMessage('Errore di connessione al server o durante la registrazione.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registrazione Recruiter</title>
      </Helmet>
      <div className="register-container">
        {/* Contenitore per la GIF */}
        <div className="gif-container">
          <img
            src={registerGif}
            alt="Recruiter GIF"
            className="recruiter-gif"
          />
        </div>
        {/* Wrapper del form con titolo sopra */}
        <div className="form-and-title-wrapper">
          <h1 className="form-title">REGISTRAZIONE RECRUITER</h1> {/* Titolo sopra il form */}
          <div className="form-wrapper">
            <form onSubmit={handleSubmit}>
              {/* Campi obbligatori per la registrazione dell'User */}
              <div className="input-group">
                <label htmlFor="username" className="form-label">Username *</label>
                <input
                  type="text" id="username" name="username"
                  value={form.username} onChange={handleChange}
                  className="form-input" required
                  disabled={isRegistering}
                />
              </div>
              <div className="input-group">
                <label htmlFor="email" className="form-label">E-Mail *</label>
                <input
                  type="email" id="email" name="email"
                  value={form.email} onChange={handleChange}
                  className="form-input" required
                  disabled={isRegistering}
                />
              </div>
              <div className="input-group">
                <label htmlFor="password" className="form-label">Password *</label>
                <input
                  type="password" id="password" name="password"
                  value={form.password} onChange={handleChange}
                  className="form-input" required
                  disabled={isRegistering}
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirm-password" className="form-label">Conferma Password *</label>
                <input
                  type="password" id="confirm-password" name="confirm-password"
                  className="form-input" required
                  disabled={isRegistering}
                />
              </div>

              {/* Campi opzionali per i dettagli del Recruiter */}
              <div className="input-row">
                <div className="input-col">
                  <label htmlFor="nome" className="form-label">Nome</label>
                  <input
                    type="text" id="nome" name="nome"
                    value={form.nome} onChange={handleChange}
                    className="form-input"
                    disabled={isRegistering}
                  />
                </div>
                <div className="input-col">
                  <label htmlFor="cognome" className="form-label">Cognome</label>
                  <input
                    type="text" id="cognome" name="cognome"
                    value={form.cognome} onChange={handleChange}
                    className="form-input"
                    disabled={isRegistering}
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="azienda" className="form-label">Azienda</label>
                <input
                  type="text" id="azienda" name="azienda"
                  value={form.azienda} onChange={handleChange}
                  className="form-input"
                  disabled={isRegistering}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-wide" disabled={isRegistering}>
                {isRegistering ? 'Registrazione in corso...' : 'Registrati come Recruiter'}
              </button>

              {message && (
                <div className={`message ${message.includes('successo') ? 'message-success' : 'message-error'}`}>
                  {message}
                </div>
              )}

              <div className="login-section">
                <div className="login-text">Hai già un account Recruiter?</div>
                <button
                  type="button"
                  className="btn btn-success btn-wide"
                  onClick={() => navigate('/recruiter-login')}
                  disabled={isRegistering}
                >
                  Accedi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterRecruiter;