import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecruiterDashboard.css';
import guestPfp from './assets/Guest_PFP.png';

function RecruiterDashboard({ currentUser, handleLogout, updateCurrentUser }) {
  const navigate = useNavigate();
    // Stati per la gestione del form
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    nome: '',
    cognome: '',
    azienda: '',
    email: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Controllo di autenticazione semplificato
  useEffect(() => {
    if (currentUser === null) {
      // Se currentUser è esplicitamente null (non undefined), reindirizza
      console.log('🚫 Access denied to RecruiterDashboard - redirecting to welcome');
      navigate('/welcome');
      return;
    }
    
    if (currentUser && currentUser.roleType !== 'recruiter') {
      console.log('🚫 Access denied to RecruiterDashboard - wrong role - redirecting to welcome');
      navigate('/welcome');
      return;
    }
  }, [currentUser, navigate]);  // Inizializzazione dei dati del profilo - SOLO al primo caricamento o se l'ID cambia
  useEffect(() => {
    if (currentUser && currentUser.roleType === 'recruiter') {
      console.log('✅ Access granted to RecruiterDashboard for:', currentUser.nome, currentUser.cognome);
      
      // Recupera sempre i dati FRESCHI dal database
      fetchFreshRecruiterData();
    }
  }, [currentUser?.id]); // ← Cambiato da [currentUser] a [currentUser?.id]

  // Funzione per recuperare dati freschi dal database
  const fetchFreshRecruiterData = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt || !currentUser) return;

      console.log('🔍 Recupero dati recruiter FRESCHI dal database per utente:', currentUser.id);
      
      const response = await fetch(`http://localhost:1337/api/recruiter-details?filters[user][id][$eq]=${currentUser.id}&populate=*&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const recruiterData = data.data?.[0];
        
        console.log('🔍 Dati recruiter dal database:', recruiterData);
        
        // Inizializza con dati base dell'utente
        const initialData = {
          username: currentUser.username || '',
          email: currentUser.email || '', // Sempre dall'utente base
          nome: recruiterData?.nome || '', // Dal database, accesso diretto
          cognome: recruiterData?.cognome || '', // Dal database, accesso diretto
          azienda: recruiterData?.azienda || '' // Dal database, accesso diretto
        };
        
        console.log('📝 Dati inizializzati per il form:', initialData);
        setProfileData(initialData);
        setOriginalData(initialData);
        
        // Aggiorna anche currentUser se i dati dal database sono più completi
        if (recruiterData && (recruiterData.nome || recruiterData.cognome || recruiterData.azienda)) {
          // Solo se i dati sono effettivamente diversi
          const shouldUpdate = 
            recruiterData.nome !== currentUser.nome || 
            recruiterData.cognome !== currentUser.cognome ||
            recruiterData.azienda !== currentUser.azienda;
            
          if (shouldUpdate) {
            const updatedCurrentUser = {
              ...currentUser,
              nome: recruiterData.nome || currentUser.nome || '',
              cognome: recruiterData.cognome || currentUser.cognome || '',
              azienda: recruiterData.azienda || currentUser.azienda || ''
            };
            console.log('🔄 Aggiornamento currentUser con dati dal database:', updatedCurrentUser);
            updateCurrentUser(updatedCurrentUser);
          }
        }
      } else {
        // Se non trova il recruiter nel database, inizializza con dati minimi
        const initialData = {
          username: currentUser.username || '',
          email: currentUser.email || '', // Mantieni sempre l'email dell'utente
          nome: '', // Vuoto se non c'è entry nel database
          cognome: '', // Vuoto se non c'è entry nel database
          azienda: '' // Vuoto se non c'è entry nel database
        };
        console.log('📝 Nessun recruiter nel database, inizializzazione con dati minimi:', initialData);
        setProfileData(initialData);
        setOriginalData(initialData);
      }
    } catch (error) {
      console.error('❌ Errore nel recuperare i dati del recruiter:', error);
      // Fallback ai dati base dell'utente in caso di errore
      const initialData = {
        username: currentUser.username || '',
        email: currentUser.email || '', // Mantieni sempre l'email dell'utente
        nome: '',
        cognome: '',
        azienda: ''
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
  };

  // Salva le modifiche
  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setMessage('Token di autenticazione mancante');
        setIsLoading(false);
        return;
      }      console.log('💾 Salvando modifiche profilo recruiter:', JSON.stringify(profileData, null, 2));

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

      // STEP 2: Recupera i dettagli del recruiter dal database UNA SOLA VOLTA
      console.log('🔍 Recupero dettagli recruiter dal database per ID utente:', currentUser.id);
      
      const recruiterDetailsResponse = await fetch(`http://localhost:1337/api/recruiter-details?filters[user][id][$eq]=${currentUser.id}&populate=*&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      let existingRecruiter = null;
      if (recruiterDetailsResponse.ok) {
        const recruiterDetailsData = await recruiterDetailsResponse.json();
        console.log('🔍 Risposta dettagli recruiter:', JSON.stringify(recruiterDetailsData, null, 2));
        existingRecruiter = recruiterDetailsData.data?.[0];
      } else {
        console.warn('⚠️ Errore nel recuperare dettagli recruiter:', recruiterDetailsResponse.status);
      }
      
      console.log('🔍 Recruiter esistente trovato:', existingRecruiter ? `ID: ${existingRecruiter.id}, DocumentID: ${existingRecruiter.documentId}` : 'Nessuno');

      // STEP 3: Prepara i dati per l'aggiornamento del recruiter
      const recruiterUpdateData = {
        data: {
          nome: profileData.nome.trim(),
          cognome: profileData.cognome.trim(),
          azienda: profileData.azienda.trim(),
          user: currentUser.id,
          publishedAt: new Date().toISOString()
        }
      };

      console.log('📝 Dati per aggiornamento recruiter:', JSON.stringify(recruiterUpdateData, null, 2));

      let recruiterResponse;
      
      // LOGICA SEMPLIFICATA: Se esiste aggiorna, altrimenti crea
      if (existingRecruiter?.id) {
        // Prova prima con documentId se disponibile, altrimenti usa id
        const updateId = existingRecruiter.documentId || existingRecruiter.id;
        console.log('🔄 Aggiornamento record esistente con ID:', existingRecruiter.id, 'DocumentID:', existingRecruiter.documentId, 'Usando:', updateId);
        recruiterResponse = await fetch(`http://localhost:1337/api/recruiter-details/${updateId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recruiterUpdateData)
        });
      } else {
        console.log('➕ Creazione nuovo record recruiter');
        recruiterResponse = await fetch('http://localhost:1337/api/recruiter-details', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recruiterUpdateData)
        });
      }

      if (!recruiterResponse.ok) {
        const errorText = await recruiterResponse.text();
        console.error('❌ Errore dettagli recruiter (text):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Errore dettagli recruiter:', errorData);
          throw new Error(`Errore nell'operazione recruiter: ${errorData.error?.message || recruiterResponse.status}`);
        } catch (parseError) {
          throw new Error(`Errore nell'operazione recruiter: ${recruiterResponse.status}`);
        }
      }

      const updatedRecruiterDetails = await recruiterResponse.json();
      console.log('✅ Operazione recruiter completata:', JSON.stringify(updatedRecruiterDetails, null, 2));      // STEP 4: Recupera dati freschi dal database dopo il salvataggio
      await fetchFreshRecruiterData();

      // STEP 5: Aggiorna currentUser SOLO se necessario (evita loop infiniti)
      const shouldUpdateCurrentUser = 
        currentUser.username !== profileData.username ||
        currentUser.email !== profileData.email ||
        currentUser.nome !== profileData.nome ||
        currentUser.cognome !== profileData.cognome ||
        currentUser.azienda !== profileData.azienda;

      if (shouldUpdateCurrentUser) {
        console.log('🔄 Aggiornamento currentUser necessario');
        const updatedCurrentUser = {
          ...currentUser,
          username: profileData.username,
          email: profileData.email,
          nome: profileData.nome,
          cognome: profileData.cognome,
          azienda: profileData.azienda
        };
        updateCurrentUser(updatedCurrentUser);
      } else {
        console.log('✅ currentUser già aggiornato, nessun update necessario');
      }

      setIsEditing(false);
      setMessage('✅ Profilo aggiornato con successo!');

    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
      setMessage(`❌ Errore: ${error.message}`);
    } finally {
      setIsLoading(false);
    }  };  // Se currentUser non è ancora disponibile, mostra loading
  if (!currentUser) {
    return (
      <div className="profile-edit-container">
        <h1>Caricamento...</h1>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-header">
        <h2>Il mio profilo</h2>
        {!isEditing && (
          <button 
            className="edit-button"
            onClick={handleEdit}
            disabled={isLoading}
          >
            Modifica Profilo
          </button>
        )}
      </div>

      {/* Messaggio di feedback */}
      {message && (
        <div className={`profile-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="profile-form">
        {/* Immagine profilo più grande */}
        <div className="profile-image-section">
          <img 
            src={guestPfp} 
            alt="Profilo" 
            className="profile-image-large"
          />
        </div>

        <div className="profile-details">            {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleInputChange}
                className="form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="form-display">@{profileData.username || 'Non specificato'}</div>
            )}
          </div>

          {/* Nome */}
          <div className="form-group">
            <label className="form-label">Nome</label>
            {isEditing ? (
              <input
                type="text"
                name="nome"
                value={profileData.nome}
                onChange={handleInputChange}
                className="form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="form-display">{profileData.nome || 'Non specificato'}</div>
            )}
          </div>

          {/* Cognome */}
          <div className="form-group">
            <label className="form-label">Cognome</label>
            {isEditing ? (
              <input
                type="text"
                name="cognome"
                value={profileData.cognome}
                onChange={handleInputChange}
                className="form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="form-display">{profileData.cognome || 'Non specificato'}</div>
            )}
          </div>

          {/* Azienda */}
          <div className="form-group">
            <label className="form-label">Azienda</label>
            {isEditing ? (
              <input
                type="text"
                name="azienda"
                value={profileData.azienda}
                onChange={handleInputChange}
                className="form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="form-display">{profileData.azienda || 'Non specificata'}</div>
            )}
          </div>

          {/* Email - sempre modificabile */}
          <div className="form-group">
            <label className="form-label">Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="form-input"
                disabled={isLoading}
              />
            ) : (
              <div className="form-display">{profileData.email || 'Non specificata'}</div>
            )}
          </div>

          {/* Pulsanti Salva/Annulla */}
          {isEditing && (
            <div className="form-actions">
              <button 
                className="save-button"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Salva'}
              </button>
              <button 
                className="cancel-button"
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

export default RecruiterDashboard;
