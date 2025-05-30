import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CandidateDashboard.css';
import guestPfp from './assets/Guest_PFP.png';

function CandidateDashboard({ currentUser, handleLogout, updateCurrentUser }) {
  const navigate = useNavigate();
  // Stati per la gestione del form
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    nome: '',
    cognome: '',
    email: '',
    cv: null
  });
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  // Controllo di autenticazione semplificato
  useEffect(() => {
    if (currentUser === null) {
      // Se currentUser è esplicitamente null (non undefined), reindirizza
      console.log('🚫 Access denied to CandidateDashboard - redirecting to welcome');
      navigate('/welcome');
      return;
    }
      if (currentUser && currentUser.roleType !== 'candidato') {
      console.log('🚫 Access denied to CandidateDashboard - wrong role - redirecting to welcome');
      navigate('/welcome');
      return;
    }  }, [currentUser, navigate]);  // Inizializzazione dei dati del profilo - SOLO al primo caricamento o se l'ID cambia
  useEffect(() => {
    if (currentUser && currentUser.roleType === 'candidato') {
      console.log('✅ Access granted to CandidateDashboard for:', currentUser.nome, currentUser.cognome);
      
      // Recupera sempre i dati FRESCHI dal database
      fetchFreshCandidateData();
    }
  }, [currentUser?.id]); // ← Cambiato da [currentUser] a [currentUser?.id]

  // Funzione per recuperare dati freschi dal database
  const fetchFreshCandidateData = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt || !currentUser) return;

      console.log('🔍 Recupero dati candidato FRESCHI dal database per utente:', currentUser.id);
      
      const response = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${currentUser.id}&populate=*&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const candidateData = data.data?.[0];
          console.log('🔍 Dati candidato dal database:', candidateData);
          // Inizializza con dati base dell'utente
        const initialData = {
          username: currentUser.username || '',
          email: currentUser.email || '', // Sempre dall'utente base
          nome: candidateData?.nome || '', // Dal database, accesso diretto
          cognome: candidateData?.cognome || '', // Dal database, accesso diretto
          cv: candidateData?.cv || null // Dal database, accesso diretto
        };
          console.log('📝 Dati inizializzati per il form:', initialData);
        setProfileData(initialData);
        setOriginalData(initialData);
          // Aggiorna anche currentUser se i dati dal database sono più completi
        if (candidateData && (candidateData.nome || candidateData.cognome)) {
          // Solo se i dati sono effettivamente diversi
          const shouldUpdate = 
            candidateData.nome !== currentUser.nome || 
            candidateData.cognome !== currentUser.cognome ||
            JSON.stringify(candidateData.cv) !== JSON.stringify(currentUser.cv);
            
          if (shouldUpdate) {
            const updatedCurrentUser = {
              ...currentUser,
              nome: candidateData.nome || currentUser.nome || '',
              cognome: candidateData.cognome || currentUser.cognome || '',
              cv: candidateData.cv || currentUser.cv || null
            };
            console.log('🔄 Aggiornamento currentUser con dati dal database:', updatedCurrentUser);
            updateCurrentUser(updatedCurrentUser);
          }
        }} else {
        // Se non trova il candidato nel database, inizializza con dati minimi
        const initialData = {
          username: currentUser.username || '',
          email: currentUser.email || '', // Mantieni sempre l'email dell'utente
          nome: '', // Vuoto se non c'è entry nel database
          cognome: '', // Vuoto se non c'è entry nel database
          cv: null
        };
        console.log('📝 Nessun candidato nel database, inizializzazione con dati minimi:', initialData);
        setProfileData(initialData);
        setOriginalData(initialData);
      }    } catch (error) {
      console.error('❌ Errore nel recuperare i dati del candidato:', error);
      // Fallback ai dati base dell'utente in caso di errore
      const initialData = {
        username: currentUser.username || '',
        email: currentUser.email || '', // Mantieni sempre l'email dell'utente
        nome: '',
        cognome: '',
        cv: null
      };
      setProfileData(initialData);
      setOriginalData(initialData);
    }
  };
  // Gestione dell'input del form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestione dell'upload del CV
  const handleCvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verifica che sia un PDF
      if (file.type !== 'application/pdf') {
        setMessage('❌ Il file deve essere in formato PDF');
        return;
      }
      // Verifica dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ Il file deve essere massimo 5MB');
        return;
      }
      setCvFile(file);
      setMessage('');    }
  };  // Upload del CV - Versione semplificata
  const handleCvUpload = async () => {
    console.log('🔥 handleCvUpload chiamata!', { cvFile, currentUser });
    
    if (!cvFile) {
      console.log('❌ Nessun file selezionato');
      setMessage('❌ Seleziona prima un file CV');
      return;
    }

    console.log('📁 File selezionato:', cvFile.name, 'Tipo:', cvFile.type, 'Dimensione:', cvFile.size);
    setIsUploadingCv(true);
    setMessage('⏳ Caricamento CV in corso...');

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        console.log('❌ Token JWT mancante');
        setMessage('Token di autenticazione mancante');
        setIsUploadingCv(false);
        return;
      }

      console.log('🔑 Token JWT presente, procedendo con upload...');

      // STEP 1: Upload del file su Strapi
      const formData = new FormData();
      formData.append('files', cvFile);

      console.log('📤 Inizio upload file...');
      const uploadResponse = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        console.error('❌ Errore upload response:', uploadResponse.status);
        const errorText = await uploadResponse.text();
        console.error('Dettagli errore:', errorText);
        throw new Error(`Errore nell'upload del file: ${uploadResponse.status}`);
      }

      const uploadedFiles = await uploadResponse.json();
      if (!uploadedFiles || !uploadedFiles.length) {
        console.error('❌ Nessun file è stato caricato nella risposta');
        throw new Error('Nessun file è stato caricato');
      }
      
      const uploadedCv = uploadedFiles[0];
      console.log('✅ CV caricato con successo:', JSON.stringify(uploadedCv, null, 2));

      // STEP 2: Aggiorna solo lo stato locale - Il salvataggio nel database avverrà con handleSave
      setProfileData(prev => ({
        ...prev,
        cv: uploadedCv
      }));

      setCvFile(null);
      setMessage('✅ CV caricato! Clicca "Salva" per salvare definitivamente il profilo.');

    } catch (error) {
      console.error('❌ Errore nell\'upload del CV:', error.message, error.stack);
      setMessage(`❌ Errore nell'upload: ${error.message}`);
    } finally {
      setIsUploadingCv(false);
    }
  };
  // Rimozione del CV (solo dallo stato locale, salvataggio tramite handleSave)
  const handleCvRemove = () => {
    console.log('🗑️ Rimozione del CV dallo stato locale');
    setProfileData(prev => ({
      ...prev,
      cv: null
    }));
    setCvFile(null);
    setMessage('🗑️ CV rimosso localmente! Clicca "Salva" per confermare la rimozione definitiva');
  };
  // Avvia la modalità di editing generale
  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  // Annulla le modifiche
  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
    setMessage('');
  };  // Salva le modifiche
  const handleSave = async () => {
    setIsLoading(true);
    setMessage('⏳ Salvataggio in corso...');

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setMessage('Token di autenticazione mancante');
        setIsLoading(false);
        return;
      }      console.log('💾 Salvando modifiche profilo candidato:', JSON.stringify(profileData, null, 2));

      // Validazione dell'email
      if (!profileData.email || profileData.email.trim() === '') {
        setMessage('❌ L\'email è obbligatoria e non può essere vuota');
        setIsLoading(false);
        return;
      }

      // STEP 1: Aggiorna i dati base dell'utente (username e email)
      const userUpdateData = {
        username: profileData.username.trim(),
        email: profileData.email.trim()
      };

      console.log('👤 Aggiornamento dati utente:', JSON.stringify(userUpdateData, null, 2));
      
      const userResponse = await fetch(`http://localhost:1337/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userUpdateData)
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('❌ Errore aggiornamento utente (text):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(`Errore nell'aggiornamento utente: ${errorData.error?.message || userResponse.status}`);
        } catch (parseError) {
          throw new Error(`Errore nell'aggiornamento utente: ${userResponse.status}`);
        }
      }
      
      const updatedUser = await userResponse.json();
      console.log('✅ Utente aggiornato:', JSON.stringify(updatedUser, null, 2));
      
      // STEP 2: Gestione CV se c'è un file selezionato
      let cvId = null;
      if (cvFile) {
        console.log('📄 CV file selezionato, eseguo upload prima del salvataggio candidato');
        // Carica il CV su Strapi
        const formData = new FormData();
        formData.append('files', cvFile);

        console.log('📤 Inizio upload file...');
        const uploadResponse = await fetch('http://localhost:1337/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          console.error('❌ Errore upload response:', uploadResponse.status);
          const errorText = await uploadResponse.text();
          console.error('Dettagli errore upload:', errorText);
          throw new Error(`Errore nell'upload del file: ${uploadResponse.status}`);
        }

        const uploadedFiles = await uploadResponse.json();
        if (!uploadedFiles || !uploadedFiles.length) {
          console.error('❌ Nessun file è stato caricato nella risposta');
          throw new Error('Nessun file è stato caricato');
        }
        
        const uploadedCv = uploadedFiles[0];
        console.log('✅ CV caricato con successo:', JSON.stringify(uploadedCv, null, 2));
        
        // Aggiorna lo stato locale del CV
        setProfileData(prev => ({
          ...prev,
          cv: uploadedCv
        }));
        
        // Usa l'ID del CV appena caricato
        cvId = uploadedCv.id;
        setCvFile(null);
      }      // STEP 3: Recupera i dettagli del candidato dal database UNA SOLA VOLTA
      console.log('🔍 Recupero dettagli candidato dal database per ID utente:', currentUser.id);
      
      const candidatoDetailsResponse = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${currentUser.id}&populate=*&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      let existingCandidate = null;
      if (candidatoDetailsResponse.ok) {
        const candidatoDetailsData = await candidatoDetailsResponse.json();
        console.log('🔍 Risposta dettagli candidato:', JSON.stringify(candidatoDetailsData, null, 2));
        existingCandidate = candidatoDetailsData.data?.[0];
      } else {
        console.warn('⚠️ Errore nel recuperare dettagli candidato:', candidatoDetailsResponse.status);
      }
      
      console.log('🔍 Candidato esistente trovato:', existingCandidate ? `ID: ${existingCandidate.id}, DocumentID: ${existingCandidate.documentId}` : 'Nessuno');
        // STEP 4: Determina correttamente l'ID del CV
      if (!cvId) {
        if (profileData.cv && profileData.cv.id) {
          console.log('📄 Usando CV da profileData:', profileData.cv.id);
          cvId = profileData.cv.id;
        } else if (existingCandidate && existingCandidate.cv && existingCandidate.cv.id) {
          console.log('📄 Usando CV esistente dal database:', existingCandidate.cv.id);
          cvId = existingCandidate.cv.id;
        }
      }
      
      console.log('📄 CV ID finale per salvataggio:', cvId);
      
      const candidateUpdateData = {
        data: {
          nome: profileData.nome.trim(),
          cognome: profileData.cognome.trim(),
          cv: cvId,
          user: currentUser.id,
          publishedAt: new Date().toISOString()
        }
      };      console.log('📝 Dati per aggiornamento candidato:', JSON.stringify(candidateUpdateData, null, 2));

      let candidateResponse;
        // LOGICA SEMPLIFICATA: Se esiste aggiorna, altrimenti crea
      if (existingCandidate?.id) {
        // Prova prima con documentId se disponibile, altrimenti usa id
        const updateId = existingCandidate.documentId || existingCandidate.id;
        console.log('🔄 Aggiornamento record esistente con ID:', existingCandidate.id, 'DocumentID:', existingCandidate.documentId, 'Usando:', updateId);
        candidateResponse = await fetch(`http://localhost:1337/api/candidatoes/${updateId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(candidateUpdateData)
        });
      } else {
        console.log('➕ Creazione nuovo record candidato');
        candidateResponse = await fetch('http://localhost:1337/api/candidatoes', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(candidateUpdateData)
        });
      }

      if (!candidateResponse.ok) {
        const errorText = await candidateResponse.text();
        console.error('❌ Errore dettagli candidato (text):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Errore dettagli candidato:', errorData);
          throw new Error(`Errore nell'operazione candidato: ${errorData.error?.message || candidateResponse.status}`);
        } catch (parseError) {
          throw new Error(`Errore nell'operazione candidato: ${candidateResponse.status}`);
        }
      }
      
      const updatedCandidateDetails = await candidateResponse.json();
      console.log('✅ Operazione candidato completata:', JSON.stringify(updatedCandidateDetails, null, 2));
      
      // STEP 5: Aggiorna i dati nell'app utilizzando la funzione del padre
      // Conserviamo il CV nell'oggetto updatedCurrentUser
      let cvData = null;
      if (cvId) {
        // Se abbiamo un CV, assicuriamoci che sia un oggetto completo
        if (profileData.cv && profileData.cv.id === cvId) {
          cvData = profileData.cv;
        } else {
          // Dobbiamo costruire un oggetto CV minimo
          cvData = {
            id: cvId,
            name: 'CV.pdf', // Nome generico se non conosciamo il nome reale
            url: `/uploads/${cvId}` // URL approssimativo
          };
        }
      }
      
      const updatedCurrentUser = {
        username: profileData.username,
        email: profileData.email,
        nome: profileData.nome,
        cognome: profileData.cognome,
        cv: cvData, // Usa i dati del CV determinati sopra
        id: currentUser.id, // Mantieni l'ID utente
        roleType: currentUser.roleType // Mantieni il tipo di ruolo
      };

      console.log('🔄 Aggiornamento currentUser:', JSON.stringify(updatedCurrentUser, null, 2));
      
      // Usa la funzione updateCurrentUser del componente padre per aggiornamento in tempo reale
      updateCurrentUser(updatedCurrentUser);

      // Aggiorna anche lo stato locale per riflettere il CV
      const updatedProfileData = {
        ...profileData,
        cv: cvData
      };
        setProfileData(updatedProfileData);
      setOriginalData(updatedProfileData);
      setIsEditing(false);
      setMessage('✅ Profilo aggiornato con successo!');
      
      // Aggiorna i dati freschi dal database per sincronizzazione
      setTimeout(() => {
        fetchFreshCandidateData();
      }, 500); // Piccolo delay per assicurarsi che il database sia aggiornato

    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error.message, error.stack);
      setMessage(`❌ Errore: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };// Se currentUser non è ancora disponibile, mostra loading
  if (!currentUser) {
    return (
      <div className="candidate-profile-container">
        <h1>Caricamento...</h1>
      </div>
    );
  }

  return (
    <div className="candidate-profile-container">
      <div className="candidate-profile-header">
        <h2>Il mio profilo</h2>
        {!isEditing && (
          <button 
            className="candidate-edit-button"
            onClick={handleEdit}
            disabled={isLoading}
          >
            Modifica Profilo
          </button>
        )}
      </div>

      {/* Messaggio di feedback */}
      {message && (
        <div className={`candidate-profile-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="candidate-profile-form">
        {/* Immagine profilo più grande */}
        <div className="candidate-profile-image-section">
          <img 
            src={guestPfp} 
            alt="Profilo" 
            className="candidate-profile-image-large"
          />
        </div>

        <div className="candidate-profile-details">            {/* Username */}
          <div className="candidate-form-group">
            <label className="candidate-form-label">Username</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleInputChange}
                className="candidate-form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="candidate-form-display">@{profileData.username || 'Non specificato'}</div>
            )}
          </div>

          {/* Nome */}
          <div className="candidate-form-group">
            <label className="candidate-form-label">Nome</label>
            {isEditing ? (
              <input
                type="text"
                name="nome"
                value={profileData.nome}
                onChange={handleInputChange}
                className="candidate-form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="candidate-form-display">{profileData.nome || 'Non specificato'}</div>
            )}
          </div>

          {/* Cognome */}
          <div className="candidate-form-group">
            <label className="candidate-form-label">Cognome</label>
            {isEditing ? (
              <input
                type="text"
                name="cognome"
                value={profileData.cognome}
                onChange={handleInputChange}
                className="candidate-form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="candidate-form-display">{profileData.cognome || 'Non specificato'}</div>
            )}
          </div>          {/* Email - sempre modificabile */}
          <div className="candidate-form-group">
            <label className="candidate-form-label">Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="candidate-form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="candidate-form-display">{profileData.email || 'Non specificata'}</div>
            )}
          </div>

          {/* CV Upload */}
          <div className="candidate-form-group">
            <label className="candidate-form-label">Curriculum Vitae (PDF)</label>
            <div className="candidate-cv-section">
              {profileData.cv ? (
                <div className="candidate-cv-current">                  <div className="candidate-cv-info">
                    <span className="candidate-cv-filename">📄 {profileData.cv.name || 'CV.pdf'}</span>
                    <div className="candidate-cv-actions">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleCvRemove}
                          className="candidate-cv-remove"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Rimuovendo...' : 'Rimuovi'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="candidate-cv-empty">
                  <span>Nessun CV caricato</span>
                </div>
              )}
                {isEditing && (
                <div className="candidate-cv-upload">
                  <label className="candidate-cv-upload-label">
                    <span className="candidate-cv-upload-text">Seleziona file PDF</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleCvFileChange}
                      className="candidate-cv-input"
                      disabled={isLoading || isUploadingCv}
                    />
                  </label>
                  {cvFile && (
                    <div className="candidate-cv-selected">
                      <span>File selezionato: <strong>{cvFile.name}</strong></span>
                      <button
                        type="button"
                        onClick={handleCvUpload}
                        className="candidate-cv-upload-btn"
                        disabled={isLoading || isUploadingCv}
                      >
                        {isUploadingCv ? '⏳ Caricando...' : '📤 Carica CV'}
                      </button>
                    </div>
                  )}
                  <div className="candidate-cv-note">
                    <small>Nota: puoi caricare direttamente con "Carica CV" o selezionare un file e poi cliccare "Salva" per salvare tutto insieme.</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pulsanti Salva/Annulla */}
          {isEditing && (
            <div className="candidate-form-actions">
              <button 
                className="candidate-save-button"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Salva'}
              </button>
              <button 
                className="candidate-cancel-button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Annulla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboard;
