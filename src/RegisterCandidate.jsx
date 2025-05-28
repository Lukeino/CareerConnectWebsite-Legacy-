import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import './RegisterCandidate.css';
import registerGif from './assets/Register.gif';

function RegisterCandidate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    nome: '',
    cognome: '',
    email: '',
    password: ''
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

      console.log("🚀 INIZIO REGISTRAZIONE CANDIDATO");
      console.log("📝 Dati form:", form);

      // --- PASSO 1: Registrazione dell'utente base in Strapi ---
      console.log("🔍 Step 1: Registrazione utente base...");
      
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
      console.log("🔍 Step 1 Response:", userData);

      if (!registerUserResponse.ok) {
        console.error("❌ Errore Step 1:", userData);
        setMessage('Errore nella registrazione utente: ' + (userData.error?.message || JSON.stringify(userData)));
        setIsRegistering(false);
        return;
      }

      console.log("✅ Step 1 completato - Utente creato!");
      
      // Estrazione del JWT e dell'ID dell'utente appena creato
      const jwt = userData.jwt;
      const userId = userData.user.id;
      console.log("🔑 JWT ottenuto:", jwt ? "✅" : "❌");
      console.log("👤 User ID:", userId);

      // --- PASSO 2: Creazione dei dettagli del Candidato ---
      console.log("🔍 Step 2: Creazione dettagli candidato...");
      
      if (form.nome || form.cognome) {
        const candidatoData = {
          data: {
            nome: form.nome,
            cognome: form.cognome,
            user: userId
          }
        };
        
        console.log("📤 Dati candidato da inviare:", candidatoData);
        
        const candidatoDetailsResponse = await fetch('http://localhost:1337/api/candidatoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify(candidatoData),
        });

        const candidatoResult = await candidatoDetailsResponse.json();
        console.log("🔍 Step 2 Response:", candidatoResult);

        if (!candidatoDetailsResponse.ok) {
          console.error('❌ Errore Step 2:', candidatoResult);
          setMessage('Utente creato ma errore nei dettagli candidato: ' + (candidatoResult.error?.message || JSON.stringify(candidatoResult)));
        } else {
          console.log("✅ Step 2 completato - Dettagli candidato creati!");
        }
      } else {
        console.log("⚠️ Step 2 saltato - Nome e cognome vuoti");
      }

      // --- PASSO 3: Assegnazione ruolo dell'utente ---
      console.log("🔍 Step 3: Assegnazione ruolo candidato...");
      
      const roleData = {
        data: {
          roleType: 'candidato',
          user: userId
        }
      };
      
      console.log("📤 Dati ruolo da inviare:", roleData);
      
      const userRoleResponse = await fetch('http://localhost:1337/api/user-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(roleData),
      });

      const roleResult = await userRoleResponse.json();
      console.log("🔍 Step 3 Response:", roleResult);

      if (!userRoleResponse.ok) {
        console.error('❌ Errore Step 3:', roleResult);
        setMessage('Utente creato ma errore nell\'assegnazione ruolo: ' + (roleResult.error?.message || JSON.stringify(roleResult)));
      } else {
        console.log("✅ Step 3 completato - Ruolo candidato assegnato!");
      }

      console.log("🎉 REGISTRAZIONE CANDIDATO COMPLETATA!");
      setMessage('Registrazione Candidato avvenuta con successo! Puoi ora effettuare il login.');
      
      setForm({
        username: '',
        nome: '',
        cognome: '',
        email: '',
        password: ''
      });
      
      setTimeout(() => {
        navigate('/candidate-login');
      }, 1500);

    } catch (error) {
      console.error('❌ Errore generale durante la registrazione:', error);
      setMessage('Errore di connessione al server: ' + error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registrazione Candidato</title>
      </Helmet>
      <div className="register-container">
        {/* Contenitore per la GIF */}
        <div className="gif-container">
          <img
            src={registerGif}
            alt="Candidato GIF"
            className="candidato-gif"
          />
        </div>
        {/* Wrapper del form con titolo sopra */}
        <div className="form-and-title-wrapper">
          <h1 className="form-title">REGISTRAZIONE CANDIDATO</h1>
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

              {/* Campi per i dettagli del Candidato */}
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

              <button type="submit" className="btn btn-primary btn-wide" disabled={isRegistering}>
                {isRegistering ? 'Registrazione in corso...' : 'Registrati come Candidato'}
              </button>

              {message && (
                <div className={`message ${message.includes('successo') ? 'message-success' : 'message-error'}`}>
                  {message}
                </div>
              )}

              <div className="login-section">
                <div className="login-text">Hai già un account Candidato?</div>
                <button
                  type="button"
                  className="btn btn-success btn-wide"
                  onClick={() => navigate('/candidate-login')}
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

export default RegisterCandidate;