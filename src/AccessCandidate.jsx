import './App.css';
import './AccessCandidate.css';

/* Componente per la gestione dell'accesso e registrazione dei candidati */
function AccessCandidate() {
  return (
    /* Area principale dei candidati con due sezioni affiancate */
    <div className="candidate-area">
      {/* Box per il login dei candidati esistenti */}
      <div className="candidate-box">
        <h2>Entra come Candidato</h2>
        <label className="candidate-label" htmlFor="username">Username</label>
        <input className="candidate-input" type="text" id="username" name="username" />
        <label className="candidate-label" htmlFor="password">Password</label>
        <input className="candidate-input" type="password" id="password" name="password" />
        <button className="forgot-password-btn" type="button">
          Hai dimenticato la password?
        </button>
        <button className="entra-btn" type="button">
          ENTRA
        </button>
      </div>

      {/* Box per la registrazione di nuovi candidati */}
      <div className="candidate-box">
        <h2>Registrati</h2>
        {/* Form di registrazione da implementare */}
      </div>
    </div>
  );
}

export default AccessCandidate;