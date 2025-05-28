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
      setError('');

      // Aggiungiamo il parametro populate per ottenere i dati completi
      const response = await fetch('http://localhost:1337/api/annuncios?populate=*', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dati annunci ricevuti:', data); // Debug per verificare la struttura

      // Verifichiamo la struttura della risposta
      if (data && data.data) {
        setAnnunci(data.data);
      } else {
        console.error('Formato dati non valido:', data);
        setError('Formato dati non valido ricevuto dal server');
      }
    } catch (error) {
      console.error('Errore nel caricamento degli annunci:', error);
      setError(`Errore nel caricamento degli annunci: ${error.message}`);
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

  // Funzione per aiutare a estrarre i valori dagli annunci in modo più sicuro
  const getAnnuncioValue = (annuncio, field) => {
    // Debug dettagliato per trovare dove sono i dati
    console.log(`Tentativo di accedere a ${field} per annuncio:`, annuncio);
    
    if (!annuncio) return null;
    
    // Metodo 1: Accesso diretto
    if (annuncio[field]) {
      return annuncio[field];
    }
    
    // Metodo 2: Accesso tramite attributes
    if (annuncio.attributes && annuncio.attributes[field]) {
      return annuncio.attributes[field];
    }
    
    // Metodo 3: Accesso tramite data.attributes (per risposta API annidata)
    if (annuncio.data && annuncio.data.attributes && annuncio.data.attributes[field]) {
      return annuncio.data.attributes[field];
    }
    
    // Se non troviamo il campo, restituiamo null
    return null;
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
            {currentUser.role === 'recruiter' && currentUser.azienda && (
              <span className="company-info">
                Azienda: {currentUser.azienda}
              </span>
            )}
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
                {annunci.map((annuncio) => {
                  // Debug dell'annuncio corrente
                  console.log('Rendering annuncio:', annuncio);
                  
                  return (
                    <div key={annuncio.id} className="annuncio-card">
                      {/* Header dell'annuncio */}
                      <div className="annuncio-header">
                        <h3 className="annuncio-title">
                          {/* Metodo più robusto per accedere al titolo */}
                          {annuncio.attributes?.titolo || 
                           getAnnuncioValue(annuncio, 'titolo') || 
                           'Titolo non disponibile'}
                        </h3>
                        <span className="annuncio-badge">Nuovo</span>
                      </div>

                      {/* Descrizione */}
                      <p className="annuncio-description">
                        {/* Metodo più robusto per accedere alla descrizione */}
                        {annuncio.attributes?.descrizione || 
                         getAnnuncioValue(annuncio, 'descrizione') || 
                         'Descrizione non disponibile...'}
                      </p>

                      {/* Footer dell'annuncio */}
                      <div className="annuncio-footer">
                        <div className="annuncio-meta">
                          📅 Pubblicato: {formatDate(annuncio.attributes?.createdAt)}
                        </div>
                        <button className="annuncio-button">
                          Scopri di più →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Welcome;