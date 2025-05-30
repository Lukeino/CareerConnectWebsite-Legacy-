import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa le icone dell'occhio
import './RegisterRecruiter.css';
import recruiterGif from './assets/RegisterRecruiter.gif'; // GIF specifica per il recruiter

function RegisterRecruiter() {
  const navigate = useNavigate();
  
  // Scroll all'inizio della pagina quando il componente viene montato
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Modifica lo state iniziale rimuovendo i campi non necessari
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        email: '',
        password: ''
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
        <div className="gif-recruiter-container">
          <img src={recruiterGif} alt="Recruiter Animation" className="recruiter-gif" />
        </div>
        {/* Wrapper del form con titolo sopra */}
        <div className="form-and-title-wrapper">
          <h1 className="form-title hero-style">Trova i migliori candidati per le tue offerte</h1>
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
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password" 
                    name="password"
                    value={form.password} 
                    onChange={handleChange}
                    className="form-input password-input"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isRegistering}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div className="input-group">
                <label htmlFor="confirm-password" className="form-label">Conferma Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password" 
                    name="confirm-password"
                    className="form-input password-input"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isRegistering}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
                <div className="privacy-notice">
                Cliccando su "Accetta e iscriviti", accetti il Contratto di licenza, l'Informativa sulla privacy e l'Informativa sui cookie di CareerConnect.
              </div>

              <button type="submit" className="btn btn-primary-recruiter btn-wide" disabled={isRegistering}>
                {isRegistering ? 'Registrazione in corso...' : 'Accetta e iscriviti'}
              </button>
              {message && (
                <div className={`message ${message.includes('successo') ? 'message-success' : 'message-error'}`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterRecruiter;