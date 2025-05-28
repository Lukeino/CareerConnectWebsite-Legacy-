import React, { useState } from 'react';
import './GestioneAnnunci.css';

function GestioneAnnunci({ currentUser, isLoggedIn }) {
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [annuncioText, setAnnuncioText] = useState({
    titolo: '',
    descrizione: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  return (
    <>
      <button
        className="create-button"
        onClick={() => setShowCreateBox(true)}
      >
        Crea Annuncio
      </button>

      {showCreateBox && (
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
    </>
  );
}

export default GestioneAnnunci;