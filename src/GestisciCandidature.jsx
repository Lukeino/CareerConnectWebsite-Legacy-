import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCalendarAlt, FaBriefcase, FaEnvelope, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import './GestisciCandidature.css';

function GestisciCandidature({ currentUser }) {
  const navigate = useNavigate();
  const [candidature, setCandidature] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidatura, setSelectedCandidatura] = useState(null);
  const [filtroStato, setFiltroStato] = useState('tutte'); // tutte, inviata, accettata, rifiutata

  // Controllo di autenticazione
  useEffect(() => {
    if (!currentUser || currentUser.roleType !== 'recruiter') {
      navigate('/welcome');
      return;
    }
    
    fetchCandidature();
  }, [currentUser, navigate]);
  // Recupera tutte le candidature per gli annunci del recruiter
  const fetchCandidature = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setError('Token di autenticazione mancante');
        return;
      }      console.log('🔍 Recupero candidature per user recruiter:', currentUser.id);      // STEP 1: Test semplice - verifica se l'endpoint candidatures esiste
      const candidatureResponse = await fetch(`http://localhost:1337/api/candidatures?populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!candidatureResponse.ok) {
        throw new Error(`Errore nel recupero candidature: ${candidatureResponse.status}`);
      }      const candidatureData = await candidatureResponse.json();
      console.log('📋 TUTTE le candidature recuperate:', candidatureData);
      
      // Debug: mostra la struttura completa di ogni candidatura
      if (candidatureData.data && candidatureData.data.length > 0) {
        candidatureData.data.forEach((candidatura, index) => {
          console.log(`🔍 CANDIDATURA ${index + 1} - Struttura completa:`, candidatura);
          console.log(`🔍 CANDIDATURA ${index + 1} - Attributes:`, candidatura.attributes);
        });
      }      // Se non ci sono candidature o l'endpoint non restituisce dati, prova altri endpoint
      if (!candidatureData.data || candidatureData.data.length === 0) {
        console.log('⚠️ Nessuna candidatura trovata nell\'endpoint candidatures, provo altri endpoint...');
        
        // Prova con l'endpoint candidatura (singolare)
        try {
          const altResponse = await fetch(`http://localhost:1337/api/candidatura`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log('📋 Dati da endpoint candidatura:', altData);
          }
        } catch (e) {
          console.log('❌ Endpoint candidatura non disponibile');
        }
        
        // Prova con l'endpoint applications
        try {
          const appResponse = await fetch(`http://localhost:1337/api/applications`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (appResponse.ok) {
            const appData = await appResponse.json();
            console.log('📋 Dati da endpoint applications:', appData);
          }
        } catch (e) {
          console.log('❌ Endpoint applications non disponibile');
        }
      }

      // APPROCCIO ALTERNATIVO: Recupera candidature tramite gli annunci del recruiter
      console.log('🔄 Provo approccio alternativo: candidature tramite annunci del recruiter');
      
      // 1. Prima recupera tutti gli annunci del recruiter corrente
      const annunciResponse = await fetch(`http://localhost:1337/api/annuncios?populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (annunciResponse.ok) {
        const annunciData = await annunciResponse.json();
        console.log('📰 Tutti gli annunci:', annunciData);
        
        // Filtra gli annunci del recruiter corrente
        const annunciDelRecruiter = annunciData.data?.filter(annuncio => {
          const createdById = annuncio.createdby?.id || 
                             annuncio.attributes?.createdby?.data?.id ||
                             (annuncio.attributes?.createdby && annuncio.attributes.createdby.id);
          
          console.log(`🔍 Annuncio ${annuncio.id} - CreatedBy ID:`, createdById, 'CurrentUser ID:', currentUser.id);
          return createdById && createdById.toString() === currentUser.id.toString();
        }) || [];
        
        console.log('📰 Annunci del recruiter corrente:', annunciDelRecruiter);
        
        // 2. Ora cerca candidature per questi annunci
        if (annunciDelRecruiter.length > 0) {
          const annunciIds = annunciDelRecruiter.map(a => a.id);
          console.log('🎯 Cerco candidature per annunci IDs:', annunciIds);
            // Filtra candidature per gli annunci del recruiter
          const candidatureDelRecruiter = candidatureData.data?.filter(candidatura => {
            // Debug approfondito per capire la struttura
            console.log(`🔍 CANDIDATURA ${candidatura.id} - ANALISI COMPLETA:`);
            console.log(`  - candidatura.annuncio:`, candidatura.annuncio);
            console.log(`  - candidatura.attributes?.annuncio:`, candidatura.attributes?.annuncio);
            console.log(`  - candidatura.attributes?.annuncio?.data:`, candidatura.attributes?.annuncio?.data);
            
            const annuncioId = candidatura.annuncio?.id || 
                              candidatura.attributes?.annuncio?.data?.id;
            
            console.log(`🔍 Candidatura ${candidatura.id} - Annuncio ID FINALE:`, annuncioId);
            return annuncioId && annunciIds.includes(annuncioId);
          }) || [];
          
          console.log('🎯 Candidature trovate tramite annunci:', candidatureDelRecruiter);
          
          if (candidatureDelRecruiter.length > 0) {
            // Usa queste candidature invece del filtro originale
            console.log('✅ Utilizzo le candidature trovate tramite annunci');
            
            // Processa i dati delle candidature
            const candidatureProcessate = candidatureDelRecruiter?.map(candidatura => ({
              id: candidatura.id,
              documentId: candidatura.documentId,
              stato: candidatura.stato || candidatura.attributes?.stato || 'inviata',
              dataCandidatura: candidatura.data_candidatura || candidatura.attributes?.data_candidatura || candidatura.createdAt,
              note: candidatura.note || candidatura.attributes?.note || '',
              // Dati del candidato
              candidato: {
                id: candidatura.candidato?.id || candidatura.attributes?.candidato?.data?.id,
                nome: candidatura.candidato?.nome || candidatura.attributes?.candidato?.data?.attributes?.nome || 'Nome non disponibile',
                cognome: candidatura.candidato?.cognome || candidatura.attributes?.candidato?.data?.attributes?.cognome || 'Cognome non disponibile',
                email: candidatura.candidato?.user?.email || candidatura.attributes?.candidato?.data?.attributes?.user?.data?.attributes?.email || 'Email non disponibile',
                cv: candidatura.candidato?.cv || candidatura.attributes?.candidato?.data?.attributes?.cv || null
              },
              // Dati dell'annuncio
              annuncio: {
                id: candidatura.annuncio?.id || candidatura.attributes?.annuncio?.data?.id,
                titolo: candidatura.annuncio?.titolo || candidatura.attributes?.annuncio?.data?.attributes?.titolo || 'Titolo non disponibile',
                descrizione: candidatura.annuncio?.descrizione || candidatura.attributes?.annuncio?.data?.attributes?.descrizione || ''
              }
            })) || [];

            console.log('✅ Candidature processate tramite annunci:', candidatureProcessate);
            setCandidature(candidatureProcessate);
            return; // Esce dalla funzione se ha trovato candidature
          }
        }
      }

      // Filtra manualmente le candidature del recruiter corrente
      const candidatureDelRecruiter = candidatureData.data?.filter(candidatura => {
        // Controlla diverse possibili strutture per la relazione recruiter
        const recruiterId = candidatura.recruiter?.id || 
                           candidatura.recruiter?.data?.id ||
                           candidatura.attributes?.recruiter?.data?.id;
        
        const recruiterUserId = candidatura.recruiter?.user?.id ||
                               candidatura.recruiter?.data?.attributes?.user?.data?.id ||
                               candidatura.attributes?.recruiter?.data?.attributes?.user?.data?.id;

        console.log('🔍 Candidatura ID:', candidatura.id, 'Recruiter ID:', recruiterId, 'Recruiter User ID:', recruiterUserId);
        
        // Verifica se il recruiter corrisponde al currentUser
        return recruiterUserId && recruiterUserId.toString() === currentUser.id.toString();
      }) || [];

      console.log('📝 Candidature filtrate per questo recruiter:', candidatureDelRecruiter);      // Processa i dati delle candidature (solo quelle filtrate)
      const candidatureProcessate = candidatureDelRecruiter?.map(candidatura => ({
        id: candidatura.id,
        documentId: candidatura.documentId,
        stato: candidatura.stato || 'inviata',
        dataCandidatura: candidatura.data_candidatura || candidatura.createdAt,
        note: candidatura.note || '',
        // Dati del candidato
        candidato: {
          id: candidatura.candidato?.id,
          nome: candidatura.candidato?.nome || 'Nome non disponibile',
          cognome: candidatura.candidato?.cognome || 'Cognome non disponibile',
          email: candidatura.candidato?.user?.email || 'Email non disponibile',
          cv: candidatura.candidato?.cv || null
        },
        // Dati dell'annuncio
        annuncio: {
          id: candidatura.annuncio?.id,
          titolo: candidatura.annuncio?.titolo || 'Titolo non disponibile',
          descrizione: candidatura.annuncio?.descrizione || ''
        }
      })) || [];

      console.log('✅ Candidature processate:', candidatureProcessate);
      setCandidature(candidatureProcessate);

    } catch (error) {
      console.error('❌ Errore nel caricamento candidature:', error);
      setError(`Errore nel caricamento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  // Aggiorna lo stato di una candidatura
  const updateCandidaturaStato = async (candidaturaId, nuovoStato) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return;

      const candidatura = candidature.find(c => c.id === candidaturaId);
      if (!candidatura) return;

      console.log(`🔄 Aggiornamento stato candidatura ${candidaturaId} a ${nuovoStato}`);

      // Usa l'ID normale per l'aggiornamento in Strapi v5
      const response = await fetch(`http://localhost:1337/api/candidatures/${candidaturaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { stato: nuovoStato }
        })
      });

      if (response.ok) {
        // Aggiorna lo stato locale
        setCandidature(prev => prev.map(c => 
          c.id === candidaturaId ? { ...c, stato: nuovoStato } : c
        ));
        console.log(`✅ Stato candidatura aggiornato a ${nuovoStato}`);
      } else {
        console.error('❌ Errore nell\'aggiornamento stato');
      }
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento:', error);
    }
  };
  // Formatta la data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data non valida';
    }
  };

  // Formatta lo stato per la visualizzazione
  const formatStato = (stato) => {
    switch (stato) {
      case 'inviata':
        return 'IN ATTESA';
      case 'accettata':
        return 'ACCETTATA';
      case 'rifiutata':
        return 'RIFIUTATA';
      default:
        return stato?.toUpperCase() || 'SCONOSCIUTO';
    }
  };

  // Filtra le candidature in base allo stato
  const candidatureFiltrate = candidature.filter(candidatura => {
    if (filtroStato === 'tutte') return true;
    return candidatura.stato === filtroStato;
  });

  // Conta le candidature per stato
  const contatori = {
    tutte: candidature.length,
    inviata: candidature.filter(c => c.stato === 'inviata').length,
    accettata: candidature.filter(c => c.stato === 'accettata').length,
    rifiutata: candidature.filter(c => c.stato === 'rifiutata').length
  };

  if (isLoading) {
    return (
      <div className="gestisci-candidature-container">
        <div className="candidature-loading">
          <p>Caricamento candidature...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestisci-candidature-container">
        <div className="candidature-error">
          <p>Errore: {error}</p>
          <button onClick={fetchCandidature} className="retry-button">
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gestisci-candidature-container">
      {/* Header */}
      <div className="candidature-header">
        <h1 className="candidature-title">Gestisci Candidature</h1>
        <p className="candidature-subtitle">
          Visualizza e gestisci tutte le candidature ricevute per i tuoi annunci
        </p>
      </div>

      {/* Filtri */}
      <div className="candidature-filters">
        <div className="filter-buttons">
          {[
            { key: 'tutte', label: 'Tutte', count: contatori.tutte },
            { key: 'inviata', label: 'In Attesa', count: contatori.inviata },
            { key: 'accettata', label: 'Accettate', count: contatori.accettata },
            { key: 'rifiutata', label: 'Rifiutate', count: contatori.rifiutata }
          ].map(filtro => (
            <button
              key={filtro.key}
              onClick={() => setFiltroStato(filtro.key)}
              className={`filter-button ${filtroStato === filtro.key ? 'active' : ''}`}
            >
              {filtro.label} ({filtro.count})
            </button>
          ))}
        </div>
      </div>

      {/* Layout a due colonne */}
      <div className="candidature-layout">
        {/* Colonna sinistra - Lista candidature */}
        <div className="candidature-sidebar">
          {candidatureFiltrate.length === 0 ? (
            <div className="no-candidature">
              <p>
                {filtroStato === 'tutte' 
                  ? 'Nessuna candidatura ricevuta al momento'
                  : `Nessuna candidatura con stato "${filtroStato}"`
                }
              </p>
            </div>
          ) : (
            <div className="candidature-list">
              {candidatureFiltrate.map((candidatura) => (
                <div 
                  key={candidatura.id}
                  className={`candidatura-item ${selectedCandidatura?.id === candidatura.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCandidatura(candidatura)}
                >
                  <div className="candidatura-item-header">
                    <div className="candidato-info">
                      <FaUser className="candidato-icon" />
                      <div>
                        <h4 className="candidato-nome">
                          {candidatura.candidato.nome} {candidatura.candidato.cognome}
                        </h4>
                        <p className="annuncio-titolo">{candidatura.annuncio.titolo}</p>
                      </div>
                    </div>                    <div className={`stato-badge stato-${candidatura.stato}`}>
                      {formatStato(candidatura.stato)}
                    </div>
                  </div>
                  <div className="candidatura-item-meta">
                    <span className="candidatura-data">
                      <FaCalendarAlt className="meta-icon" />
                      {formatDate(candidatura.dataCandidatura)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>        {/* Colonna destra - Dettaglio candidatura */}
        <div className="candidature-detail">
          {selectedCandidatura ? (
            <div className="candidatura-detail-content">
              {/* Header dettaglio con azioni */}
              <div className="candidatura-detail-header">
                <div className="candidato-detail-info">
                  <h2 className="candidato-detail-nome">
                    {selectedCandidatura.candidato.nome} {selectedCandidatura.candidato.cognome}
                  </h2>
                  <p className="candidato-email">
                    {selectedCandidatura.candidato.email}
                  </p>
                  <p className="candidatura-detail-data">
                    {formatDate(selectedCandidatura.dataCandidatura)}
                  </p>
                </div>
                
                {/* Azioni in alto a destra */}
                {selectedCandidatura.stato === 'inviata' && (
                  <div className="candidatura-actions-header">
                    <button
                      onClick={() => updateCandidaturaStato(selectedCandidatura.id, 'accettata')}
                      className="action-icon-button accept-icon-button"
                      title="Accetta Candidatura"
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={() => updateCandidaturaStato(selectedCandidatura.id, 'rifiutata')}
                      className="action-icon-button reject-icon-button"
                      title="Rifiuta Candidatura"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>              {/* Annuncio di riferimento */}
              <div className="annuncio-riferimento">
                <h3 className="annuncio-riferimento-title">
                  Annuncio di Riferimento
                </h3>
                <h4 className="annuncio-titolo">{selectedCandidatura.annuncio.titolo}</h4>
                {selectedCandidatura.annuncio.descrizione && (
                  <div className="annuncio-descrizione">
                    <ReactMarkdown>{selectedCandidatura.annuncio.descrizione}</ReactMarkdown>
                  </div>
                )}
              </div>{/* CV del candidato */}
              {selectedCandidatura.candidato.cv && (
                <div className="candidato-cv">
                  <h3 className="cv-title">Curriculum Vitae</h3>
                  <div className="cv-actions">
                    <a 
                      href={`http://localhost:1337${selectedCandidatura.candidato.cv}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cv-download-button"
                    >
                      Visualizza CV
                    </a>
                  </div>
                </div>
              )}

              {/* Note */}
              {selectedCandidatura.note && (
                <div className="candidatura-note">
                  <h3 className="note-title">Note</h3>
                  <p className="note-content">{selectedCandidatura.note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection-message">
              <p>Seleziona una candidatura dalla lista per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestisciCandidature;
