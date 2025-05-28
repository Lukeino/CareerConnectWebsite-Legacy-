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
  }, [currentUser, navigate]);  // Inizializzazione dei dati del profilo
  useEffect(() => {
    if (currentUser && currentUser.roleType === 'recruiter') {
      console.log('✅ Access granted to RecruiterDashboard for:', currentUser.nome, currentUser.cognome);
      
      // Inizializza i dati del profilo con quelli dell'utente corrente
      const initialData = {
        username: currentUser.username || '',
        nome: currentUser.nome || '',
        cognome: currentUser.cognome || '',
        azienda: currentUser.azienda || '',
        email: currentUser.email || ''
      };
      setProfileData(initialData);
      setOriginalData(initialData);
    }
  }, [currentUser]);

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
      }

      console.log('💾 Salvando modifiche profilo:', profileData);

      // STEP 1: Aggiorna i dati base dell'utente (username e email)
      const userUpdateData = {
        username: profileData.username.trim(),
        email: profileData.email.trim()
      };

      const userResponse = await fetch(`http://localhost:1337/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userUpdateData)
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(`Errore nell'aggiornamento utente: ${errorData.error?.message || userResponse.status}`);
      }      const updatedUser = await userResponse.json();
      console.log('✅ Utente aggiornato:', updatedUser);      // STEP 2: Recupera i dati completi dell'utente con la relazione recruiter_detail
      const userWithDetailsResponse = await fetch(`http://localhost:1337/api/users/${currentUser.id}?populate=recruiter_detail&publicationState=preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      if (!userWithDetailsResponse.ok) {
        throw new Error('Errore nel recuperare i dettagli dell\'utente');
      }

      const userWithDetails = await userWithDetailsResponse.json();
      console.log('🔍 Utente con dettagli:', userWithDetails);      // STEP 3: Aggiorna o crea i dettagli del recruiter
      const recruiterUpdateData = {
        data: {
          nome: profileData.nome.trim(),
          cognome: profileData.cognome.trim(),
          azienda: profileData.azienda.trim(),
          user: currentUser.id,
          publishedAt: new Date().toISOString() // Pubblica automaticamente
        }
      };

      let recruiterResponse;
      
      // Verifica se esistono dettagli del recruiter
      if (userWithDetails.recruiter_detail && userWithDetails.recruiter_detail.id) {
        // Aggiorna i dettagli esistenti
        const existingDetailId = userWithDetails.recruiter_detail.id;
        console.log('🔄 Aggiornamento dettagli recruiter esistenti, ID:', existingDetailId);
          recruiterResponse = await fetch(`http://localhost:1337/api/recruiter-details/${existingDetailId}?publicationState=preview`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recruiterUpdateData)
        });
        
        // Se l'aggiornamento fallisce, prova a creare un nuovo record
        if (!recruiterResponse.ok) {
          console.log('⚠️ Aggiornamento fallito, provo a creare nuovo record');
          recruiterResponse = await fetch('http://localhost:1337/api/recruiter-details', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recruiterUpdateData)
          });
        }
      } else {
        // Crea nuovi dettagli del recruiter
        console.log('➕ Creazione nuovi dettagli recruiter');
        
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
        const errorData = await recruiterResponse.json();
        console.error('❌ Errore dettagli recruiter:', errorData);
        throw new Error(`Errore nell'aggiornamento dettagli recruiter: ${errorData.error?.message || recruiterResponse.status}`);
      }      const updatedRecruiterDetails = await recruiterResponse.json();
      console.log('✅ Dettagli recruiter aggiornati:', updatedRecruiterDetails);

      // STEP 4: Aggiorna i dati nell'app utilizzando la funzione del padre
      const updatedCurrentUser = {
        username: profileData.username,
        email: profileData.email,
        nome: profileData.nome,
        cognome: profileData.cognome,
        azienda: profileData.azienda
      };

      // Usa la funzione updateCurrentUser del componente padre per aggiornamento in tempo reale
      updateCurrentUser(updatedCurrentUser);

      // Aggiorna anche originalData per future modifiche
      setOriginalData(profileData);
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
