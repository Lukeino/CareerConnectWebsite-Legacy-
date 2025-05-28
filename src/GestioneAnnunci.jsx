import React, { useState, useEffect } from 'react';
import './GestioneAnnunci.css';

function GestioneAnnunci({ currentUser, handleLogout }) {
  // Stati per gestire l'elenco degli annunci
  const [annunci, setAnnunci] = useState([]);
  const [isLoadingAnnunci, setIsLoadingAnnunci] = useState(true);
  const [errorAnnunci, setErrorAnnunci] = useState('');
  
  // Stati per il form di creazione annuncio
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [annuncioText, setAnnuncioText] = useState({
    titolo: '',
    descrizione: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Carica gli annunci all'avvio
  useEffect(() => {
    fetchAnnunci();
  }, [currentUser]);

  // Funzione per caricare TUTTI gli annunci e filtrare lato client
  const fetchAnnunci = async () => {
    try {
      setIsLoadingAnnunci(true);
      setErrorAnnunci('');

      const headers = {
        'Content-Type': 'application/json',
      };
      
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      const apiUrl = 'http://localhost:1337/api/annuncios?populate=*';

      console.log("🔍 Caricamento annunci per recruiter:", currentUser?.id);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dati annunci ricevuti:', data);

      if (data && data.data) {
        // FILTRO CORRETTO: usa la struttura dati reale
        let annunciFiltrati = data.data;
        
        if (currentUser && currentUser.id) {
          annunciFiltrati = data.data.filter(annuncio => {
            // STRUTTURA CORRETTA: createdby è un oggetto diretto
            const createdById = annuncio.createdby?.id;
            
            console.log(`🔍 Filtro annuncio "${annuncio.titolo}": createdby.id=${createdById}, recruiter.id=${currentUser.id}`);
            
            return createdById && createdById.toString() === currentUser.id.toString();
          });
        }
        
        setAnnunci(annunciFiltrati);
        console.log(`✅ Mostrati ${annunciFiltrati.length} annunci di ${data.data.length} totali per ${currentUser?.nome} ${currentUser?.cognome}`);
      } else {
        console.error('Formato dati non valido:', data);
        setErrorAnnunci('Formato dati non valido ricevuto dal server');
      }
    } catch (error) {
      console.error('Errore nel caricamento degli annunci:', error);
      setErrorAnnunci(`Errore nel caricamento degli annunci: ${error.message}`);
    } finally {
      setIsLoadingAnnunci(false);
    }
  };

  // Funzione per salvare un nuovo annuncio
  const handleSaveAnnuncio = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
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
      // Prepara i dati dell'annuncio con il creatore
      const annuncioData = {
        data: {
          titolo: annuncioText.titolo.trim(),
          descrizione: annuncioText.descrizione.trim(),
          createdby: currentUser.id
        }
      };

      console.log("Dati annuncio da inviare:", annuncioData);

      const headers = {
        'Content-Type': 'application/json',
      };
      
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      const response = await fetch('http://localhost:1337/api/annuncios', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(annuncioData)
      });

      if (!response.ok) {
        let errorMessage = `Errore ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += `: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Annuncio creato con successo:", data);

      setMessage('Annuncio salvato con successo!');
      setAnnuncioText({ titolo: '', descrizione: '' });
      
      setTimeout(() => {
        setShowCreateBox(false);
        setMessage('');
        fetchAnnunci();
      }, 2000);
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setMessage('Errore: ' + error.message);
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

  // Funzione per eliminare un annuncio
  const handleDeleteAnnuncio = async (annuncioId) => {
    if (!confirm("Sei sicuro di voler eliminare questo annuncio?")) return;
    
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      const response = await fetch(`http://localhost:1337/api/annuncios/${annuncioId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`Errore nell'eliminazione: ${response.status}`);
      }

      fetchAnnunci();
      alert("Annuncio eliminato con successo!");
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      alert("Errore nell'eliminazione dell'annuncio: " + error.message);
    }
  };

  return (
    <div className="gestione-annunci-container">
      <h1 className="page-title">Gestione Annunci</h1>
      
      <div className="actions-bar">
        <button 
          className="create-button large"
          onClick={() => setShowCreateBox(true)}
        >
          Crea Nuovo Annuncio
        </button>
      </div>
      
      {isLoadingAnnunci && (
        <div className="loader-container">
          <div className="loader"></div>
          <p className="loader-text">Caricamento annunci...</p>
        </div>
      )}

      {errorAnnunci && (
        <div className="error-message">
          ⚠️ {errorAnnunci}
          <button onClick={fetchAnnunci} className="retry-button">
            Riprova
          </button>
        </div>
      )}
      
      {!isLoadingAnnunci && !errorAnnunci && (
        <>
          <h2 className="section-title">
            I tuoi annunci ({annunci.length})
            {currentUser && (
              <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>
                - {currentUser.nome} {currentUser.cognome}
                {currentUser.azienda && ` (${currentUser.azienda})`}
              </span>
            )}
          </h2>
          
          {annunci.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📋</div>
              <h3 className="no-results-title">Nessun annuncio disponibile</h3>
              <p className="no-results-text">
                Non hai ancora creato nessun annuncio. Clicca su "Crea Nuovo Annuncio" per iniziare.
              </p>
            </div>
          ) : (
            <div className="annunci-admin-grid">
              {annunci.map((annuncio) => (
                <div key={annuncio.id} className="annuncio-admin-card">
                  <div className="annuncio-header">
                    <h3 className="annuncio-title">
                      {annuncio.titolo || 'Titolo non disponibile'}
                    </h3>
                    <div className="annuncio-actions">
                      <button 
                        className="delete-button" 
                        onClick={() => handleDeleteAnnuncio(annuncio.id)}
                        title="Elimina annuncio"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <p className="annuncio-description">
                    {annuncio.descrizione || 'Descrizione non disponibile...'}
                  </p>
                  
                  <div className="annuncio-footer">
                    <div className="annuncio-meta">
                      📅 Pubblicato: {formatDate(annuncio.createdAt)}
                    </div>
                    <div className="annuncio-stats">
                      👁️ Visualizzazioni: 0 | 📝 Candidature: 0
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {showCreateBox && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveAnnuncio} className="create-form">
            <h2 className="form-title">Crea un nuovo annuncio</h2>
            
            <div className="creator-info">
              Stai creando come: <strong>{currentUser?.nome} {currentUser?.cognome}</strong>
              {currentUser?.azienda && ` di ${currentUser.azienda}`}
            </div>
            
            {message && (
              <div className={`feedback-message ${message.includes('Errore') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="form-field-container">
              <label htmlFor="titolo" className="form-label">Titolo *</label>
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
              <label htmlFor="descrizione" className="form-label">Descrizione *</label>
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
              <button type="submit" disabled={isLoading} className="save-button">
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
    </div>
  );
}

export default GestioneAnnunci;