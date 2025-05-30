import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaCheck, FaTrash } from 'react-icons/fa';
import './ListaOfferte.css';

function ListaOfferte({ currentUser, searchTerm }) {
  const navigate = useNavigate();
  const [annunci, setAnnunci] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnuncio, setSelectedAnnuncio] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
    // Stati per il sistema di candidature
  const [candidature, setCandidature] = useState(new Set()); // Set di ID annunci a cui l'utente ha già candidato
  const [isApplying, setIsApplying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false); // Nuovo stato per il ritiro
  const [applicationMessage, setApplicationMessage] = useState('');// Carica gli annunci al montaggio del componente
  useEffect(() => {
    fetchAnnunci();
    if (currentUser && currentUser.roleType === 'candidato') {
      fetchUserApplications();
    }
  }, [currentUser]);
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
      setError(`Errore nel caricamento degli annunci: ${error.message}`);    } finally {
      setIsLoading(false);
    }
  };  // Carica le candidature esistenti dell'utente
  const fetchUserApplications = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt || !currentUser) return;

      // Prima trova il candidato corrispondente nella collection candidatoes
      const candidatoResponse = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${currentUser.id}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!candidatoResponse.ok) {
        console.log('⚠️ Nessun profilo candidato trovato per questo utente');
        return;
      }

      const candidatoData = await candidatoResponse.json();
      if (!candidatoData.data || candidatoData.data.length === 0) {
        console.log('⚠️ Nessun profilo candidato trovato');
        return;
      }

      const candidatoProfile = candidatoData.data[0];
      console.log('👤 Profilo candidato trovato:', candidatoProfile);      // Ora cerca le candidature per questo candidato usando il suo documentId
      const response = await fetch(`http://localhost:1337/api/candidatures?filters[candidato][documentId][$eq]=${candidatoProfile.documentId}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Candidature trovate:', data);
        // Estrae gli ID degli annunci a cui l'utente ha già candidato
        // Usa documentId dell'annuncio o fallback su id normale per compatibilità
        const appliedJobIds = new Set(
          data.data?.map(candidatura => {
            const annuncioRef = candidatura.annuncio;
            return annuncioRef?.documentId || annuncioRef?.id || candidatura.annuncio_id;
          }).filter(Boolean) || []
        );
        setCandidature(appliedJobIds);
        console.log('📋 Candidature utente caricate (usando documentId):', appliedJobIds);
      } else {
        console.log('📋 Nessuna candidatura trovata o collection candidatures non esiste ancora');
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento candidature:', error);
    }
  };

  // Gestisce la candidatura a un'offerta di lavoro
  const handleApplyToJob = async (annuncio) => {
    if (!currentUser) {
      setApplicationMessage('⚠️ Devi effettuare il login per candidarti');
      setTimeout(() => navigate('/candidate-login'), 2000);
      return;
    }

    if (currentUser.roleType !== 'candidato') {
      setApplicationMessage('⚠️ Solo i candidati possono candidarsi alle offerte');
      return;
    }

    // Verifica se ha un CV caricato
    if (!currentUser.cv) {
      setApplicationMessage('⚠️ Devi caricare un CV nel tuo profilo prima di candidarti');
      setTimeout(() => navigate('/candidate-dashboard'), 3000);
      return;
    }    // Verifica se ha già candidato usando documentId
    const annuncioIdForCheck = annuncio.documentId || annuncio.id;
    if (candidature.has(annuncioIdForCheck)) {
      setApplicationMessage('ℹ️ Hai già candidato per questa posizione');
      return;
    }

    setIsApplying(true);
    setApplicationMessage('');

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setApplicationMessage('❌ Token di autenticazione mancante');
        setIsApplying(false);
        return;
      }      // STEP 1: Prima trova l'ID del candidato nella collection candidatoes
      const candidatoResponse = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${currentUser.id}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!candidatoResponse.ok) {
        setApplicationMessage('❌ Errore: profilo candidato non trovato');
        setIsApplying(false);
        return;
      }

      const candidatoData = await candidatoResponse.json();
      if (!candidatoData.data || candidatoData.data.length === 0) {
        setApplicationMessage('❌ Errore: profilo candidato non esistente');
        setIsApplying(false);
        return;
      }      const candidatoProfile = candidatoData.data[0];
      console.log('👤 Candidato trovato:', candidatoProfile);

      // STEP 2: Trova l'ID del recruiter nella collection recruiter-details
      let recruiterId = null;
      if (annuncio.createdby?.id) {
        try {
          const recruiterResponse = await fetch(`http://localhost:1337/api/recruiter-details?filters[user][id][$eq]=${annuncio.createdby.id}&populate=*`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          });

          if (recruiterResponse.ok) {
            const recruiterData = await recruiterResponse.json();
            if (recruiterData.data && recruiterData.data.length > 0) {
              recruiterId = recruiterData.data[0].id;
              console.log('👔 Recruiter trovato con ID:', recruiterId);
            } else {
              console.log('⚠️ Nessun profilo recruiter trovato per l\'utente:', annuncio.createdby.id);
            }
          }
        } catch (error) {
          console.log('⚠️ Errore nel recupero del recruiter:', error);
        }
      }      // STEP 3: Crea la candidatura usando gli ID corretti
      const candidaturaData = {
        data: {
          candidato: candidatoProfile.id, // Usa l'ID del candidato, non dell'utente
          annuncio: annuncio.id,
          recruiter: recruiterId, // Usa l'ID del recruiter-detail, non dell'utente
          stato: 'inviata',
          data_candidatura: new Date().toISOString(),
          note: '', // Campo note obbligatorio come stringa vuota
          publishedAt: new Date().toISOString()
        }
      };console.log('📤 Dati candidatura preparati:', candidaturaData);
      console.log('👤 Candidato ID:', candidatoProfile.id);
      console.log('📋 Annuncio ID:', annuncio.id);
      console.log('👔 Recruiter Detail ID:', recruiterId);
      console.log('👔 User Recruiter ID:', annuncio.createdby?.id);      console.log('📤 Invio candidatura:', candidaturaData);

      // STEP 4: Invia la candidatura
      const response = await fetch('http://localhost:1337/api/candidatures', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidaturaData)
      });      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Errore risposta candidatura:', errorData);
        console.error('❌ Status:', response.status, response.statusText);
        console.error('❌ Dati inviati:', candidaturaData);
        console.error('❌ Errore dettagliato:', JSON.stringify(errorData, null, 2));
        setApplicationMessage(`❌ Errore durante l'invio della candidatura: ${errorData.error?.message || 'Errore sconosciuto'}`);
        setIsApplying(false);
        return;
      }      const candidaturaResult = await response.json();
      console.log('✅ Candidatura creata con successo:', candidaturaResult);

      // STEP 5: Aggiorna lo stato locale usando documentId dell'annuncio
      const annuncioIdForSet = annuncio.documentId || annuncio.id;
      setCandidature(prev => new Set([...prev, annuncioIdForSet]));
      setApplicationMessage('✅ Candidatura inviata con successo!');

      // STEP 6: Invia notifica al recruiter (se presente)
      if (annuncio.createdby?.id) {
        await sendNotificationToRecruiter(annuncio.createdby.id, annuncio, candidatoProfile);
      }

      // Rimuovi il messaggio dopo 3 secondi
      setTimeout(() => setApplicationMessage(''), 3000);    } catch (error) {
      console.error('❌ Errore nel processo di candidatura:', error);
      setApplicationMessage('❌ Errore di connessione durante l\'invio della candidatura');
    } finally {
      setIsApplying(false);
    }
  };
  // Invia notifica al recruiter
  const sendNotificationToRecruiter = async (recruiterId, annuncio, candidato) => {
    if (!recruiterId) return;

    try {
      const jwt = localStorage.getItem('jwt');      const notificationData = {
        data: {
          recipient: recruiterId,
          type: 'new_application',
          title: 'Nuova candidatura ricevuta',
          message: `${candidato.nome} ${candidato.cognome} si è candidato per la posizione "${annuncio.titolo}"`,
          read: 'false', // CAMBIATO: ora è text invece di boolean
          data: {
            job_id: annuncio.id,
            candidate_id: candidato.id,
            job_title: annuncio.titolo
          },
          publishedAt: new Date().toISOString()
        }
      };

      await fetch('http://localhost:1337/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });
      
      console.log('📨 Notifica inviata al recruiter');
    } catch (error) {
      console.error('⚠️ Errore invio notifica al recruiter:', error);
      // Non blocchiamo la candidatura se la notifica fallisce
    }
  };

  // Gestisce il ritiro di una candidatura
  const handleWithdrawApplication = async (annuncio) => {
    if (!currentUser) {
      setApplicationMessage('⚠️ Devi effettuare il login');
      return;
    }

    // Conferma prima del ritiro
    const conferma = window.confirm(
      `Sei sicuro di voler ritirare la candidatura per "${annuncio.titolo}"?\n\nQuesta azione non può essere annullata.`
    );
    
    if (!conferma) {
      return;
    }

    setIsWithdrawing(true);
    setApplicationMessage('');

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setApplicationMessage('❌ Token di autenticazione mancante');
        setIsWithdrawing(false);
        return;
      }

      // STEP 1: Trova il candidato
      const candidatoResponse = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${currentUser.id}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!candidatoResponse.ok) {
        setApplicationMessage('❌ Errore: profilo candidato non trovato');
        setIsWithdrawing(false);
        return;
      }

      const candidatoData = await candidatoResponse.json();
      if (!candidatoData.data || candidatoData.data.length === 0) {
        setApplicationMessage('❌ Errore: profilo candidato non esistente');
        setIsWithdrawing(false);
        return;
      }

      const candidatoProfile = candidatoData.data[0];      // STEP 2: Trova la candidatura da ritirare usando documentId
      console.log('🔍 Cercando candidatura per candidato:', candidatoProfile.documentId, 'e annuncio:', annuncio.documentId || annuncio.id);
      
      const candidaturaResponse = await fetch(`http://localhost:1337/api/candidatures?filters[candidato][documentId][$eq]=${candidatoProfile.documentId}&filters[annuncio][documentId][$eq]=${annuncio.documentId || annuncio.id}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!candidaturaResponse.ok) {
        setApplicationMessage('❌ Errore nella ricerca della candidatura');
        setIsWithdrawing(false);
        return;
      }

      const candidaturaData = await candidaturaResponse.json();
      if (!candidaturaData.data || candidaturaData.data.length === 0) {
        setApplicationMessage('❌ Candidatura non trovata');
        setIsWithdrawing(false);
        return;
      }      const candidatura = candidaturaData.data[0];
      console.log('🔍 Candidatura trovata da ritirare:', candidatura);
      console.log('🔍 Document ID della candidatura:', candidatura.documentId);

      // Verifica che abbiamo il documentId
      if (!candidatura.documentId) {
        console.error('❌ DocumentId mancante nella candidatura:', candidatura);
        setApplicationMessage('❌ Errore: ID documento candidatura mancante');
        setIsWithdrawing(false);
        return;
      }

      // STEP 3: Elimina la candidatura usando il documentId
      const deleteResponse = await fetch(`http://localhost:1337/api/candidatures/${candidatura.documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        console.error('❌ Errore nel ritiro candidatura:', errorData);
        setApplicationMessage('❌ Errore durante il ritiro della candidatura');
        setIsWithdrawing(false);
        return;
      }      console.log('✅ Candidatura ritirata con successo');

      // STEP 4: Aggiorna lo stato locale usando documentId dell'annuncio
      const annuncioIdForSet = annuncio.documentId || annuncio.id;
      setCandidature(prev => {
        const newSet = new Set(prev);
        newSet.delete(annuncioIdForSet);
        return newSet;
      });

      setApplicationMessage('✅ Candidatura ritirata con successo');

      // Rimuovi il messaggio dopo 3 secondi
      setTimeout(() => setApplicationMessage(''), 3000);

    } catch (error) {
      console.error('❌ Errore nel processo di ritiro candidatura:', error);
      setApplicationMessage('❌ Errore di connessione durante il ritiro della candidatura');
    } finally {
      setIsWithdrawing(false);
    }
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
    
    // Controlla se l'utente ha specificato "descrizione=" all'inizio
    const isDescriptionSearch = searchLower.startsWith('descrizione=');
    
    return annunci.filter(annuncio => {
      // Con publicationState=preview, i dati sono diretti
      const titolo = (annuncio.titolo || '').toLowerCase();
      const descrizione = (annuncio.descrizione || '').toLowerCase();
      
      if (isDescriptionSearch) {
        // Estrae il termine di ricerca dopo "descrizione="
        const descriptionSearchTerm = searchLower.substring('descrizione='.length);
        if (descriptionSearchTerm.trim() === '') return true; // Se non c'è termine dopo "descrizione=", mostra tutto
        return descrizione.includes(descriptionSearchTerm);
      } else {
        // Ricerca normale: filtra solo per titolo
        return titolo.includes(searchLower);
      }
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
                placeholder="Cerca per titolo oppure scrivi 'descrizione=' per cercare nella descrizione..."
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
            <div className="annuncio-detail">              <div className="annuncio-detail-header">
                <div className="annuncio-header-content">
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
                  </div>
                </div>
                  {/* Icone discrete per candidatura */}                {currentUser && currentUser.roleType === 'candidato' && (
                  <div className="annuncio-actions">
                    {!candidature.has(selectedAnnuncio.documentId || selectedAnnuncio.id) ? (
                      <button
                        onClick={() => handleApplyToJob(selectedAnnuncio)}
                        disabled={isApplying}
                        className="action-icon apply-icon"
                        title={isApplying ? "Invio candidatura..." : "Candidati per questa posizione"}
                      >
                        {isApplying ? <span className="loading-spinner">⏳</span> : <FaPaperPlane />}
                      </button>
                    ) : (
                      <div className="application-status-icons">
                        <span 
                          className="action-icon applied-icon"
                          title="Candidatura inviata"
                        >
                          <FaCheck />
                        </span>
                        <button
                          onClick={() => handleWithdrawApplication(selectedAnnuncio)}
                          disabled={isWithdrawing}
                          className="action-icon withdraw-icon"
                          title={isWithdrawing ? "Ritiro in corso..." : "Ritira candidatura"}
                        >
                          {isWithdrawing ? <span className="loading-spinner">⏳</span> : <FaTrash />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div><div className="annuncio-detail-content">
                <ReactMarkdown>
                  {selectedAnnuncio.descrizione || 'Descrizione non disponibile'}
                </ReactMarkdown>
              </div>              {/* Messaggi per candidatura */}
              {currentUser && currentUser.roleType === 'candidato' && (
                <div className="annuncio-application-section">
                  {applicationMessage && (
                    <div className={`application-message ${
                      applicationMessage.includes('✅') ? 'success' : 
                      applicationMessage.includes('⚠️') || applicationMessage.includes('ℹ️') ? 'warning' : 'error'
                    }`}>
                      {applicationMessage}
                    </div>
                  )}
                  
                  {!currentUser.cv && (
                    <p className="cv-warning">
                      ⚠️ Ricorda di caricare il tuo CV nel <button onClick={() => navigate('/candidate-dashboard')} className="link-button">profilo</button> prima di candidarti
                    </p>
                  )}
                </div>
              )}

              {/* Messaggio per recruiter o utenti non loggati */}
              {(!currentUser || currentUser.roleType !== 'candidato') && (
                <div className="annuncio-login-section">
                  {!currentUser ? (
                    <p className="login-prompt">
                      <button onClick={() => navigate('/candidate-login')} className="login-link-button">
                        Accedi come candidato
                      </button> per candidarti a questa posizione
                    </p>
                  ) : (
                    <p className="role-info">
                      Solo i candidati possono candidarsi alle offerte di lavoro
                    </p>
                  )}
                </div>
              )}
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