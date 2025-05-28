import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import './ListaOfferte.css';

function ListaOfferte({ currentUser, searchTerm }) {
  const navigate = useNavigate();
  const [annunci, setAnnunci] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnuncio, setSelectedAnnuncio] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  // Carica gli annunci al montaggio del componente
  useEffect(() => {
    fetchAnnunci();
  }, []);
  // Sincronizza localSearchTerm con searchTerm quando cambia
  useEffect(() => {
    setLocalSearchTerm(searchTerm || '');
  }, [searchTerm]);

  // Gestisce la ricerca con debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    
    // Usa un timeout per evitare troppe navigazioni
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      if (value.trim() === '') {
        navigate('/lista-offerte');
      } else {
        navigate(`/lista-offerte?search=${encodeURIComponent(value)}`);
      }
    }, 300); // Aspetta 300ms prima di navigare
  };

  const fetchAnnunci = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Aggiungiamo il parametro populate e publicationState per ottenere i dati completi
      // Specifico populate=createdby per assicurarci che i dati del recruiter siano inclusi
      const response = await fetch('http://localhost:1337/api/annuncios?populate=createdby&publicationState=preview', {
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
        // Verifichiamo la struttura della risposta e filtriamo solo quelli pubblicati
      if (data && data.data) {
        // Filtra solo gli annunci con stato "pubblicato"
        const annunciPubblicati = data.data.filter(annuncio => {
          // Con publicationState=preview, i dati sono diretti (non in attributes)
          const stato = annuncio.stato;
          
          console.log(`Annuncio ${annuncio.id || 'senza id'}: titolo="${annuncio.titolo}", stato="${stato}"`);
          return stato === "pubblicato";
        });
        
        // Assicuriamoci che ogni annuncio abbia la proprietà annuncioId
        const annunciConId = annunciPubblicati.map(annuncio => {
          // Se manca annuncioId, lo aggiungiamo usando l'id esistente
          if (!annuncio.annuncioId && annuncio.id) {
            annuncio.annuncioId = annuncio.id;
          }
          return annuncio;
        });
        
        console.log(`📋 Mostrando ${annunciConId.length} annunci pubblicati di ${data.data.length} totali`);
        setAnnunci(annunciConId);
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

  // Funzione per nascondere un annuncio (solo per il creatore)
  const handleDeleteAnnuncio = async (annuncioId, titoloAnnuncio) => {
    // Sostituito window.confirm con un messaggio di conferma personalizzato
    const confirmation = prompt(
      `Sei sicuro di voler nascondere l'annuncio "${titoloAnnuncio}"?\n\nL'annuncio non sarà più visibile ma rimarrà salvato e potrai ripubblicarlo dalla gestione annunci.\n\nDigita 'conferma' per procedere:`
    );
    
    if (confirmation !== 'conferma') return;

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        // Sostituito alert con un messaggio personalizzato
        console.error('Token di autenticazione mancante');
        return;
      }

      // Cambia lo stato a "nascosto" invece di cancellare
      const hideData = {
        data: {
          stato: "nascosto"
        }
      };

      const response = await fetch(`http://localhost:1337/api/annuncios/${annuncioId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hideData)
      });      if (!response.ok) {
        throw new Error(`Errore nel nascondere l'annuncio: ${response.status}`);
      }      // Aggiorna la lista rimuovendo l'annuncio nascosto dalla vista
      setAnnunci(prevAnnunci => prevAnnunci.filter(annuncio => annuncio.id !== annuncioId));
      // Sostituito alert con un messaggio personalizzato
      console.log(`✅ Annuncio "${titoloAnnuncio}" nascosto con successo!`);
      
    } catch (error) {
      console.error('Errore nel nascondere l\'annuncio:', error);
      // Sostituito alert con un messaggio personalizzato
      console.error(`❌ Errore: ${error.message}`);
    }
  };  // Funzione per verificare se l'utente può nascondere un annuncio
  const canDeleteAnnuncio = (annuncio) => {
    if (!currentUser || currentUser.roleType !== 'recruiter') return false;
    
    // Verifica se l'annuncio è stato creato dall'utente corrente
    // Gestisce diverse strutture di dati possibili
    const createdById = annuncio.createdby?.id || 
                       annuncio.attributes?.createdby?.data?.id ||
                       (annuncio.attributes?.createdby && annuncio.attributes.createdby.id);
    
    return createdById && createdById.toString() === currentUser.id.toString();
  };

  // Funzione per formattare la data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    try {
      const date = new Date(dateString);
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('it-IT', options);
    } catch (error) {
      return 'Data non valida';
    }
  };  // Funzione per aiutare a estrarre i valori dagli annunci in modo più sicuro
  const getAnnuncioValue = (annuncio, field) => {
    if (!annuncio) return null;
    
    // Metodo 1: Accesso diretto
    if (annuncio[field] !== undefined) {
      return annuncio[field];
    }
    
    // Metodo 2: Accesso tramite attributes
    if (annuncio.attributes && annuncio.attributes[field] !== undefined) {
      return annuncio.attributes[field];
    }
    
    // Metodo 3: Accesso tramite data.attributes (per risposta API annidata)
    if (annuncio.data && annuncio.data.attributes && annuncio.data.attributes[field] !== undefined) {
      return annuncio.data.attributes[field];
    }

    // Metodo 4: Accesso più profondo per campi annidati come createdby
    if (annuncio.attributes && annuncio.attributes.data && 
        annuncio.attributes.data.attributes && 
        annuncio.attributes.data.attributes[field] !== undefined) {
      return annuncio.attributes.data.attributes[field];
    }

    return null;
  };// Funzione per filtrare gli annunci in base al termine di ricerca
  const filterAnnunci = (annunci, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return annunci;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return annunci.filter(annuncio => {
      // Con publicationState=preview, i dati sono diretti
      const titolo = (annuncio.titolo || '').toLowerCase();
      const descrizione = (annuncio.descrizione || '').toLowerCase();
      
      // Ottieni il nome dell'azienda/recruiter se disponibile
      const recruiterNome = annuncio.createdby?.nome || '';
      const recruiterCognome = annuncio.createdby?.cognome || '';
      const azienda = annuncio.createdby?.azienda || '';
      const fullRecruiterName = `${recruiterNome} ${recruiterCognome} ${azienda}`.toLowerCase();
      
      // Cerca in tutti i campi rilevanti
      return titolo.includes(searchLower) || 
             descrizione.includes(searchLower) || 
             fullRecruiterName.includes(searchLower);
    });
  };
  // Applica il filtro agli annunci usando localSearchTerm per il filtro in tempo reale
  const annunciFiltrati = filterAnnunci(annunci, localSearchTerm);

  console.log('🔍 DEBUG ListaOfferte:', {
    isLoading,
    error,
    annunciLength: annunci.length,
    annunciFiltrati: annunciFiltrati.length,
    searchTerm
  });

  return (
    <div className="lista-offerte-container">
      {/* Header della pagina */}      <div className="lista-offerte-header">
        <h1 className="lista-offerte-title">Lista Offerte di Lavoro</h1>
        <p className="lista-offerte-subtitle">
          Esplora tutte le opportunità di lavoro disponibili sulla piattaforma
        </p>
          {/* Barra di ricerca */}
        <div className="lista-search-container">
          <div className="lista-search-bar">
            <div className="lista-search-input-container">
              <span className="lista-search-icon">🔍</span>              <input
                type="text"
                placeholder="Cerca offerte per titolo, descrizione o azienda..."
                value={localSearchTerm}
                onChange={handleSearchChange}
                className="lista-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layout a due colonne */}
      <div className="lista-offerte-layout">
        {/* Colonna sinistra - Lista annunci */}
        <div className="lista-offerte-sidebar">
          {isLoading && (
            <div className="loading-message">
              <p>Caricamento annunci...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>Errore nel caricamento: {error}</p>
              <button onClick={fetchAnnunci}>Riprova</button>
            </div>
          )}

          {!isLoading && !error && (              <div className="annunci-list">
              {annunciFiltrati.length === 0 ? (                <div className="no-results">
                  <p>
                    {localSearchTerm ? 
                      `Nessun risultato per "${localSearchTerm}"` : 
                      'Nessun annuncio disponibile al momento'
                    }
                  </p>
                </div>
              ) : (
                annunciFiltrati.map((annuncio) => (                  <div 
                    key={annuncio.annuncioId || annuncio.id} 
                    className={`lista-preview ${selectedAnnuncio?.id === annuncio.id || selectedAnnuncio?.annuncioId === annuncio.annuncioId ? 'selected' : ''}`}
                    onClick={() => setSelectedAnnuncio(annuncio)}
                  >
                    <div className="lista-preview-header">
                      <h4 className="lista-preview-title">
                        {annuncio.titolo || 'Titolo non disponibile'}
                      </h4>
                      <p className="lista-preview-company">
                        {annuncio.createdby?.azienda || (annuncio.createdby?.id === currentUser?.id ? currentUser?.azienda : 'Azienda non specificata')}
                      </p>
                    </div>
                    <div className="lista-preview-meta">
                      <span className="annuncio-date">
                        {formatDate(annuncio.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Colonna destra - Dettaglio annuncio */}
        <div className="lista-offerte-detail">
          {selectedAnnuncio ? (
            <div className="annuncio-detail">
              <div className="annuncio-detail-header">
                <h2 className="annuncio-detail-title">
                  {selectedAnnuncio.titolo}
                </h2>
                <div className="annuncio-detail-meta">
                  <p className="annuncio-detail-company">
                    {selectedAnnuncio.createdby?.azienda || (selectedAnnuncio.createdby?.id === currentUser?.id ? currentUser?.azienda : 'Azienda non specificata')}
                  </p>
                  <p className="annuncio-detail-date">
                    Pubblicato: {formatDate(selectedAnnuncio.createdAt)}
                  </p>
                </div>                {canDeleteAnnuncio(selectedAnnuncio) && (
                  <button 
                    className="delete-button"                    onClick={() => handleDeleteAnnuncio(
                      selectedAnnuncio.id, 
                      selectedAnnuncio.titolo
                    )}
                    title="Nascondi annuncio"
                  >
                    Nascondi annuncio
                  </button>
                )}
              </div>
              <div className="annuncio-detail-content">
                <ReactMarkdown>
                  {selectedAnnuncio.descrizione || 'Descrizione non disponibile'}
                </ReactMarkdown>
              </div>
              <div className="annuncio-detail-footer">
                <span className="annuncio-type">
                  {selectedAnnuncio.tipo || 'Lavoro'}
                </span>
              </div>
            </div>
          ) : (
            <div className="no-selection-message">
              <p>Seleziona un'offerta dalla lista per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListaOfferte;