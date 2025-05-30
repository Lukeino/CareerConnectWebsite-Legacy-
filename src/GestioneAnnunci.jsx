import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FaEye, FaEyeSlash, FaTrashAlt, FaPencilAlt } from 'react-icons/fa';
import './GestioneAnnunci.css';

function GestioneAnnunci({ currentUser, handleLogout }) {
  const navigate = useNavigate();  
  // Controllo di autenticazione
  useEffect(() => {
    if (!currentUser || currentUser.roleType !== 'recruiter') {
      console.log('🚫 Access denied to GestioneAnnunci - redirecting to welcome');
      navigate('/welcome');
      return;
    }
    console.log('✅ Access granted to GestioneAnnunci for:', currentUser.nome, currentUser.cognome);
  }, [currentUser, navigate]);

  // Stati per gestire l'elenco degli annunci e l'annuncio selezionato
  const [annunci, setAnnunci] = useState([]);
  const [isLoadingAnnunci, setIsLoadingAnnunci] = useState(true);
  const [errorAnnunci, setErrorAnnunci] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAnnuncio, setSelectedAnnuncio] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');  // Carica gli annunci all'avvio
  useEffect(() => {
    fetchAnnunci();
  }, [currentUser]);

  // Effetto per rilevare il ritorno dalla pagina di modifica e ricaricare i dati
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const updated = urlParams.get('updated');
    
    if (updated === 'true') {
      console.log('🔄 Rilevato ritorno da modifica, ricarico annunci...');
      fetchAnnunci();
      
      // Rimuovi il parametro dall'URL per evitare ricaricamenti multipli
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Effetto per ricaricare quando la pagina diventa visibile (ritorno da altre pagine)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Pagina tornata visibile, ricarico annunci...');
        fetchAnnunci();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Gestisce la ricerca con filtro locale
  const handleSearchChange = (e) => {
    setLocalSearchTerm(e.target.value);
  };

  // Filtro annunci in base al termine di ricerca
  const filterAnnunci = (annunci, searchTerm) => {
    if (!searchTerm.trim()) return annunci;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return annunci.filter(annuncio => {
      const titolo = (annuncio.titolo || '').toLowerCase();
      const descrizione = (annuncio.descrizione || '').toLowerCase();
      const azienda = (annuncio.createdby?.azienda || '').toLowerCase();
      
      return titolo.includes(lowerSearchTerm) || 
             descrizione.includes(lowerSearchTerm) || 
             azienda.includes(lowerSearchTerm);
    });
  };

  const annunciFiltrati = filterAnnunci(annunci, localSearchTerm);
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

      // Aggiungiamo il filtro per pubblicati e draft e miglioriamo la query
      // Aggiungiamo populate=createdby per caricare i dati completi del recruiter
      const apiUrl = 'http://localhost:1337/api/annuncios?populate=createdby&publicationState=preview';

      console.log("🔍 Caricamento annunci per recruiter:", currentUser?.id);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dati annunci ricevuti:', data);      if (data && data.data) {
        // FILTRO CORRETTO: usa la struttura dati reale + filtra solo quelli pubblicati
        let annunciFiltrati = data.data;
        if (currentUser && currentUser.id) {
          annunciFiltrati = data.data.filter(annuncio => {
            // STRUTTURA CORRETTA: createdby è un oggetto diretto
            const createdById = annuncio.createdby?.id;
            
            console.log(`🔍 Filtro annuncio "${annuncio.titolo}": createdby.id=${createdById}, recruiter.id=${currentUser.id}, stato=${annuncio.stato}`);
            
            // Nella gestione admin mostriamo TUTTI gli annunci del recruiter (pubblicati e nascosti)
            return createdById && 
                   createdById.toString() === currentUser.id.toString();
          });
        }
          // Assicuriamoci che ogni annuncio abbia la proprietà annuncioId
        annunciFiltrati = annunciFiltrati.map(annuncio => {
          // Facciamo un log dettagliato degli ID per debug
          console.log(`Debug ID per annuncio "${annuncio.titolo}":`, {
            id: annuncio.id,
            annuncioId: annuncio.annuncioId,
            documentId: annuncio.documentId,
            attributes: annuncio.attributes
          });
          
          // Se manca annuncioId, lo aggiungiamo usando l'id
          if (!annuncio.annuncioId && annuncio.id) {
            console.log(`🔄 Aggiungo annuncioId=${annuncio.id} all'annuncio "${annuncio.titolo}"`);
            annuncio.annuncioId = annuncio.id.toString(); // Converti in stringa per sicurezza
            
            // Aggiorniamo in modo asincrono il database per aggiungere annuncioId
            const jwt = localStorage.getItem('jwt');
            if (jwt) {
              fetch(`http://localhost:1337/api/annuncios/${annuncio.id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${jwt}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  data: {
                    annuncioId: annuncio.id.toString()
                  }
                })
              })
              .then(response => {
                if (response.ok) {
                  console.log(`✅ AnnuncioId aggiornato per annuncio ${annuncio.id}`);
                  return response.json();
                } else {
                  return response.text().then(text => {
                    throw new Error(`Errore ${response.status}: ${text}`);
                  });
                }
              })
              .then(data => {
                console.log(`✅ Dettagli aggiornamento annuncioId:`, data);
              })
              .catch(error => {
                console.error(`❌ Errore nell'aggiornamento di annuncioId per ${annuncio.id}:`, error);
              });
            }
          }
          return annuncio;
        });
          setAnnunci(annunciFiltrati);
        
        // Aggiorna selectedAnnuncio se presente, per evitare di mostrare dati obsoleti
        if (selectedAnnuncio) {
          const annuncioAggiornato = annunciFiltrati.find(annuncio => 
            annuncio.id === selectedAnnuncio.id || 
            annuncio.documentId === selectedAnnuncio.documentId
          );
          if (annuncioAggiornato) {
            console.log(`🔄 Aggiornamento annuncio selezionato da "${selectedAnnuncio.titolo}" a "${annuncioAggiornato.titolo}"`);
            setSelectedAnnuncio(annuncioAggiornato);
          } else {
            // Se l'annuncio selezionato non esiste più (eliminato), deseleziona
            console.log(`❌ Annuncio selezionato "${selectedAnnuncio.titolo}" non trovato, deseleziono`);
            setSelectedAnnuncio(null);
          }
        }
        
        const pubblicati = annunciFiltrati.filter(a => a.stato === "pubblicato").length;
        const nascosti = annunciFiltrati.filter(a => a.stato === "nascosto").length;
        console.log(`✅ Mostrati ${annunciFiltrati.length} annunci totali (${pubblicati} pubblicati, ${nascosti} nascosti) per ${currentUser?.nome} ${currentUser?.cognome}`);
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
  };  // Funzione per cambiare lo stato di un annuncio (nascosto/pubblicato)
  const handleToggleStato = async (annuncioId, titoloAnnuncio, statoAttuale) => {
    const nuovoStato = statoAttuale === "pubblicato" ? "nascosto" : "pubblicato";
    const azione = nuovoStato === "nascosto" ? "nascondere" : "rendere visibile";
    
    const conferma = window.confirm(
      `Sei sicuro di voler ${azione} l'annuncio "${titoloAnnuncio}"?`
    );
    
    if (!conferma) {
      return;
    }

    try {
      setMessage(`${azione.charAt(0).toUpperCase() + azione.slice(1)}ndo annuncio...`);
      
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setMessage('Token di autenticazione mancante');
        return;
      }      // Importante: per l'API Strapi, dobbiamo usare l'ID interno (id), non annuncioId
      // L'ID per l'API deve essere quello di Strapi
      console.log(`📤 Tentativo di ${azione} annuncio:`, {
        passedId: annuncioId,
        annuncio: selectedAnnuncio ? {
          id: selectedAnnuncio.id,
          annuncioId: selectedAnnuncio.annuncioId,
          documentId: selectedAnnuncio.documentId
        } : 'nessun annuncio selezionato'
      });
      
      // Assicuriamoci che l'ID sia una stringa per l'URL
      const idForAPI = annuncioId.toString();
      
      const updateData = {
        data: {
          stato: nuovoStato
        }
      };

      const response = await fetch(`http://localhost:1337/api/annuncios/${idForAPI}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      console.log(`📡 Toggle Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Errore nel ${azione} l'annuncio: ${response.status} - ${errorData}`);
      }

      const responseData = await response.json();
      console.log(`✅ Annuncio ${nuovoStato}:`, responseData);
      
      // Ricarica gli annunci per aggiornare la lista
      await fetchAnnunci();
      setMessage(`✅ Annuncio "${titoloAnnuncio}" ${nuovoStato === "nascosto" ? "nascosto" : "reso visibile"} con successo!`);
      
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error(`❌ Errore nel ${azione} l'annuncio:`, error);
      setMessage(`❌ Errore: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };  // Funzione per eliminare definitivamente un annuncio
  const handleDeleteAnnuncio = async (annuncioId, titoloAnnuncio) => {
    const conferma = window.confirm(
      `⚠️ ATTENZIONE: Sei sicuro di voler ELIMINARE DEFINITIVAMENTE l'annuncio "${titoloAnnuncio}"?\n\nQuesta azione è IRREVERSIBILE e l'annuncio sarà cancellato per sempre dal database.`
    );
    
    if (!conferma) {
      return;
    }

    // Doppia conferma per sicurezza
    const doppiaConferma = window.confirm(
      `Ultima conferma: Eliminare DEFINITIVAMENTE "${titoloAnnuncio}"?\n\nNon potrai più recuperarlo!`
    );
    
    if (!doppiaConferma) {
      return;
    }

    try {
      setMessage('Eliminando annuncio...');
      
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setMessage('Token di autenticazione mancante');
        return;
      }      // Per l'API Strapi, dobbiamo usare l'ID interno (id)
      // Facciamo un log dettagliato per debug
      console.log(`🗑️ Tentativo di eliminare annuncio:`, {
        passedId: annuncioId,
        annuncio: selectedAnnuncio ? {
          id: selectedAnnuncio.id,
          annuncioId: selectedAnnuncio.annuncioId,
          documentId: selectedAnnuncio.documentId
        } : 'nessun annuncio selezionato'
      });
      
      // Assicuriamoci che l'ID sia una stringa per l'URL
      const idForAPI = annuncioId.toString();
      
      const response = await fetch(`http://localhost:1337/api/annuncios/${idForAPI}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      console.log(`📡 Delete Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Errore nell'eliminare l'annuncio: ${response.status} - ${errorData}`);
      }

      console.log(`✅ Annuncio eliminato definitivamente`);
      
      // Ricarica gli annunci per aggiornare la lista
      await fetchAnnunci();
      setMessage(`✅ Annuncio "${titoloAnnuncio}" eliminato definitivamente!`);
      
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('❌ Errore nell\'eliminare l\'annuncio:', error);
      setMessage(`❌ Errore: ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }  };  // Funzione per reindirizzare alla pagina di modifica dell'annuncio
  const handleEditAnnuncio = (annuncio) => {
    // Per l'API Strapi, usiamo SEMPRE documentId come per le altre funzioni (toggle e delete)
    // documentId è l'ID che funziona correttamente con l'API
    const idPerModifica = annuncio.documentId;
    
    console.log('Preparando modifica per annuncio:', annuncio);
    console.log('ID utilizzato per la modifica:', {
      idPerModifica: idPerModifica,
      id: annuncio.id,
      annuncioId: annuncio.annuncioId,
      documentId: annuncio.documentId
    });
    
    // Logghiamo l'intero annuncio per debug
    console.log('Annuncio completo:', JSON.stringify(annuncio, null, 2));
    
    // Salviamo i dati dell'annuncio nella sessione per averli disponibili nella pagina di modifica
    const annuncioToEdit = {
      id: idPerModifica, // ID per l'API Strapi (ora usa documentId)
      annuncioId: annuncio.annuncioId || idPerModifica, // ID business
      titolo: annuncio.titolo,
      descrizione: annuncio.descrizione,
      tipo: annuncio.tipo || 'Lavoro',
      stato: annuncio.stato
    };
    
    console.log('Dati salvati in sessione:', annuncioToEdit);
    sessionStorage.setItem('annuncioToEdit', JSON.stringify(annuncioToEdit));
    
    // Redirect alla pagina di creazione annuncio (che servirà anche per la modifica)
    navigate('/recruiter-crea-annuncio?edit=true');
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
    <div className="gestione-annunci-container">
      {/* Header della pagina */}
      <div className="gestione-annunci-header">
        <h1 className="gestione-annunci-title">I miei Annunci</h1>
        <p className="gestione-annunci-subtitle">
          Gestisci tutti i tuoi annunci di lavoro pubblicati e nascosti
        </p>
        
        {/* Barra di ricerca */}
        <div className="gestione-search-container">
          <div className="gestione-search-bar">
            <div className="gestione-search-input-container">
              <span className="gestione-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cerca nei tuoi annunci per titolo, descrizione o azienda..."
                value={localSearchTerm}
                onChange={handleSearchChange}
                className="gestione-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messaggio di stato */}
      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Layout a due colonne */}
      <div className="gestione-annunci-layout">
        {/* Colonna sinistra - Lista annunci */}
        <div className="gestione-annunci-sidebar">
          {isLoadingAnnunci && (
            <div className="loading-message">
              <p>Caricamento annunci...</p>
            </div>
          )}

          {errorAnnunci && (
            <div className="error-message">
              <p>Errore nel caricamento: {errorAnnunci}</p>
              <button onClick={fetchAnnunci}>Riprova</button>
            </div>
          )}

          {!isLoadingAnnunci && !errorAnnunci && (
            <div className="annunci-list">
              {annunciFiltrati.length === 0 ? (
                <div className="no-results">
                  <p>
                    {localSearchTerm ? 
                      `Nessun risultato per "${localSearchTerm}"` : 
                      'Non hai ancora creato nessun annuncio'
                    }
                  </p>
                  {!localSearchTerm && (
                    <button 
                      className="create-first-button"
                      onClick={() => navigate('/recruiter-crea-annuncio')}
                    >
                      Crea il tuo primo annuncio
                    </button>
                  )}
                </div>
              ) : (                annunciFiltrati.map((annuncio) => (
                  <div 
                    key={annuncio.id} 
                    className={`annuncio-preview ${selectedAnnuncio?.id === annuncio.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAnnuncio(annuncio)}
                  >
                    <div className="annuncio-preview-header">
                      <h4 className="annuncio-preview-title">
                        {annuncio.titolo || 'Titolo non disponibile'}
                        {annuncio.stato === 'nascosto' && (
                          <span className="stato-badge nascosto">NASCOSTO</span>
                        )}
                        {annuncio.stato === 'pubblicato' && (
                          <span className="stato-badge pubblicato">PUBBLICATO</span>
                        )}
                      </h4>
                      <p className="annuncio-preview-company">
                        {annuncio.createdby?.azienda || (annuncio.createdby?.id === currentUser?.id ? currentUser?.azienda : 'Azienda non specificata')}
                      </p>
                    </div>
                    <div className="annuncio-preview-meta">
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
        <div className="gestione-annunci-detail">
          {selectedAnnuncio ? (
            <div className="annuncio-detail">              <div className="annuncio-detail-header">
                <h2 className="annuncio-detail-title">
                  {selectedAnnuncio.titolo}
                  {selectedAnnuncio.stato === 'nascosto' && (
                    <span className="stato-badge nascosto">NASCOSTO</span>
                  )}
                  {selectedAnnuncio.stato === 'pubblicato' && (
                    <span className="stato-badge pubblicato">PUBBLICATO</span>
                  )}
                </h2>
                <div className="annuncio-detail-meta">
                  <p className="annuncio-detail-company">
                    {selectedAnnuncio.createdby?.azienda || (selectedAnnuncio.createdby?.id === currentUser?.id ? currentUser?.azienda : 'Azienda non specificata')}
                  </p>
                  <p className="annuncio-detail-date">
                    Creato: {formatDate(selectedAnnuncio.createdAt)}
                  </p>
                </div>
                
                {/* Icone azioni in alto a destra sopra la descrizione */}
                <div className="annuncio-actions-header">
                  <FaEye 
                    className={`action-icon ${selectedAnnuncio.stato === 'nascosto' ? 'show-icon' : 'hide-icon'}`}
                    onClick={() => {
                      console.log("Debug Toggle - selectedAnnuncio:", {
                        id: selectedAnnuncio.id, 
                        annuncioId: selectedAnnuncio.annuncioId,
                        documentId: selectedAnnuncio.documentId
                      });
                      handleToggleStato(
                        selectedAnnuncio.documentId, 
                        selectedAnnuncio.titolo || 'Annuncio senza titolo', 
                        selectedAnnuncio.stato
                      );
                    }}
                    title={selectedAnnuncio.stato === 'nascosto' ? 'Rendi visibile annuncio' : 'Nascondi annuncio'}
                  />
                  
                  <FaPencilAlt 
                    className="action-icon edit-icon"
                    onClick={() => handleEditAnnuncio(selectedAnnuncio)}
                    title="Modifica annuncio"
                  />
                    
                  <FaTrashAlt 
                    className="action-icon delete-icon"
                    onClick={() => {
                      console.log("Debug Delete - selectedAnnuncio:", {
                        id: selectedAnnuncio.id, 
                        annuncioId: selectedAnnuncio.annuncioId,
                        documentId: selectedAnnuncio.documentId
                      });
                      handleDeleteAnnuncio(
                        selectedAnnuncio.documentId, 
                        selectedAnnuncio.titolo || 'Annuncio senza titolo'
                      );
                    }}
                    title="Elimina definitivamente annuncio"
                  />
                </div>
              </div>
              <div className="annuncio-detail-content">
                <ReactMarkdown>
                  {selectedAnnuncio.descrizione || 'Descrizione non disponibile'}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="no-selection-message">
              <p>Seleziona un annuncio dalla lista per visualizzare i dettagli</p>
              <button 
                className="create-new-button"
                onClick={() => navigate('/recruiter-crea-annuncio')}
              >
                Crea nuovo annuncio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestioneAnnunci;