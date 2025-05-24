import React, { useState, useEffect } from 'react';
import './Welcome.css';

function Welcome({ currentUser }) {
  const [annunci, setAnnunci] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Carica gli annunci al montaggio del componente
  useEffect(() => {
    fetchAnnunci();
  }, []);

  const fetchAnnunci = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:1337/api/annuncios', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnunci(data.data || []);
      } else {
        setError('Errore nel caricamento degli annunci');
        console.error('Errore nel fetch degli annunci:', response.status);
      }
    } catch (error) {
      setError('Errore di connessione al server');
      console.error('Errore nel caricamento degli annunci:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per formattare la data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Data non valida';
    }
  };

  return (
    <div className="welcome-container">
      {/* Header della sezione */}
      <div className="section-header">
        <h1 className="section-title">Opportunità di Lavoro</h1>
        <p className="section-subtitle">
          Scopri le ultime posizioni aperte dalle nostre aziende partner
        </p>
      </div>

      {/* Messaggio di benvenuto per utenti loggati */}
      {currentUser && (
        <div className="welcome-message">
          <p className="welcome-text">
            👋 Benvenuto/a <strong>{currentUser.nome} {currentUser.cognome}</strong>!
            <span className="company-info">
              Azienda: {currentUser.azienda || 'Non specificata'}
            </span>
          </p>
        </div>
      )}

      {/* Stato di caricamento */}
      {isLoading && (
        <div className="loader-container">
          <div className="loader"></div>
          <p className="loader-text">Caricamento annunci...</p>
        </div>
      )}

      {/* Messaggio di errore */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={fetchAnnunci} className="retry-button">
            Riprova
          </button>
        </div>
      )}

      {/* Lista degli annunci */}
      {!isLoading && !error && (
        <>
          {annunci.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📋</div>
              <h3 className="no-results-title">Nessun annuncio disponibile</h3>
              <p className="no-results-text">
                Gli annunci di lavoro appariranno qui non appena verranno pubblicati.
              </p>
            </div>
          ) : (
            <>
              {/* Contatore annunci */}
              <div className="annunci-counter">
                Trovati <strong>{annunci.length}</strong> annunci di lavoro
              </div>

              {/* Griglia degli annunci */}
              <div className="annunci-grid">
                {annunci.map((annuncio) => (
                  <div key={annuncio.id} className="annuncio-card">
                    {/* Header dell'annuncio */}
                    <div className="annuncio-header">
                      <h3 className="annuncio-title">
                        {annuncio.titolo || 'Titolo non disponibile'}
                      </h3>
                      <span className="annuncio-badge">Nuovo</span>
                    </div>

                    {/* Descrizione */}
                    <p className="annuncio-description">
                      {annuncio.descrizione || 'Descrizione non disponibile...'}
                    </p>

                    {/* Footer dell'annuncio */}
                    <div className="annuncio-footer">
                      <div className="annuncio-meta">
                        📅 Pubblicato: {formatDate(annuncio.dataCreazione || annuncio.createdAt)}
                        {annuncio.recruiterUsername && (
                          <span style={{ marginLeft: '10px' }}>
                            👤 {annuncio.recruiterUsername}
                          </span>
                        )}
                      </div>
                      <button className="annuncio-button">
                        Scopri di più →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Welcome;