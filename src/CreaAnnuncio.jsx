import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import './CreaAnnuncio.css';

function CreaAnnuncio({ currentUser, handleLogout }) {
  const navigate = useNavigate();  const [isEditMode, setIsEditMode] = useState(false);
  const [annuncioId, setAnnuncioId] = useState(null);

  // Controllo di autenticazione
  useEffect(() => {
    if (!currentUser || currentUser.roleType !== 'recruiter') {
      console.log('Access denied to CreaAnnuncio - redirecting to welcome');
      navigate('/welcome');
      return;
    }
    console.log('Access granted to CreaAnnuncio for:', currentUser.nome, currentUser.cognome);
  }, [currentUser, navigate]);

  // Funzione per ottenere la data corrente in formato YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [annuncioText, setAnnuncioText] = useState({
    titolo: '',
    descrizione: '',
    data: getCurrentDate(), // Data corrente automatica
    stato: 'pubblicato' // Default stato
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');    // Controlla se siamo in modalità edit e carica i dati dell'annuncio da modificare
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editMode = urlParams.get('edit') === 'true';
    
    if (editMode) {
      const storedAnnuncioData = sessionStorage.getItem('annuncioToEdit');
      if (storedAnnuncioData) {
        try {
          const annuncioData = JSON.parse(storedAnnuncioData);
          
          console.log('Dati annuncio recuperati da sessione:', annuncioData);
          
          // Verifichiamo che l'ID sia presente
          if (!annuncioData.id) {
            console.error('❌ Errore: ID mancante nei dati dell\'annuncio da modificare', annuncioData);
            setMessage('Errore: ID dell\'annuncio mancante. Impossibile modificare.');
            return;
          }
          
          setAnnuncioText({
            titolo: annuncioData.titolo || '',
            descrizione: annuncioData.descrizione || '',
            data: getCurrentDate(), // Data corrente automatica
            stato: annuncioData.stato || 'pubblicato'
          });
          
          // Utilizziamo l'ID interno di Strapi (id) per le operazioni API
          // Converti sempre a stringa per sicurezza
          setAnnuncioId(annuncioData.id.toString());
          setIsEditMode(true);
          
          console.log('Modalità modifica attivata per annuncio ID:', {
            id: annuncioData.id,
            annuncioId: annuncioData.annuncioId
          });
        } catch (error) {
          console.error('❌ Errore nel parsing dei dati dell\'annuncio:', error);
          setMessage('Errore nel caricamento dei dati dell\'annuncio');
        }
      } else {
        console.error('❌ Nessun dato annuncio trovato in sessione per la modifica');
        setMessage('Errore: Nessun dato disponibile per l\'annuncio da modificare');
      }
    } else {
      console.log('Modalità creazione nuovo annuncio');
    }
  }, []);
  // Funzione per salvare un nuovo annuncio o aggiornare uno esistente
  const handleSaveAnnuncio = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setMessage('Devi essere loggato per gestire gli annunci');
      return;
    }
    
    if (!annuncioText.titolo.trim() || !annuncioText.descrizione.trim()) {
      setMessage('Titolo e descrizione sono obbligatori');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Prepara i dati dell'annuncio
      const annuncioData = {
        data: {
          titolo: annuncioText.titolo.trim(),
          descrizione: annuncioText.descrizione.trim(),
          data: annuncioText.data,
          stato: annuncioText.stato
        }
      };
      
      // Se non siamo in modalità modifica, aggiungiamo il creatore
      if (!isEditMode) {
        annuncioData.data.createdby = currentUser.id;
      }

      console.log(`Dati annuncio da ${isEditMode ? 'aggiornare' : 'creare'}:`, annuncioData);      const headers = {
        'Content-Type': 'application/json',
      };
      
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }

      // URL e metodo dipendono dalla modalità (crea o modifica)
      const url = isEditMode 
        ? `http://localhost:1337/api/annuncios/${annuncioId}` 
        : 'http://localhost:1337/api/annuncios';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
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
      }      const data = await response.json();
      console.log(`Annuncio ${isEditMode ? 'aggiornato' : 'creato'} con successo:`, data);
      
      // Assicuriamoci che l'annuncioId sia sempre presente
      if (!isEditMode && data && data.data) {
        // Estrai l'ID dal risultato (può essere in diverse posizioni in base alla risposta)
        const newAnnuncioId = data.data.id;
        console.log(`Nuovo annuncio creato con ID: ${newAnnuncioId}`);
        
        // Memorizziamo localmente l'ID dell'annuncio appena creato
        setAnnuncioId(newAnnuncioId);
        
        // Aggiungiamo l'ID come annuncioId prima di fare un altro aggiornamento
        if (newAnnuncioId) {
          const updateData = {
            data: {
              annuncioId: newAnnuncioId.toString() // Convertiamo in stringa per sicurezza
            }
          };
          
          try {
            console.log(`Tentativo di aggiornare annuncioId per l'annuncio ${newAnnuncioId}`);
            const updateResponse = await fetch(`http://localhost:1337/api/annuncios/${newAnnuncioId}`, {
              method: 'PUT',
              headers: headers,
              body: JSON.stringify(updateData)
            });
            
            if (updateResponse.ok) {
              const updateResult = await updateResponse.json();
              console.log(`✅ AnnuncioId aggiornato con successo:`, updateResult);
            } else {
              const errorText = await updateResponse.text();
              console.error(`❌ Errore nell'aggiornamento dell'annuncioId: ${updateResponse.status} - ${errorText}`);
            }
          } catch (updateError) {
            console.error('❌ Errore nell\'aggiornamento dell\'annuncioId:', updateError);
          }
        }
      }
      
      setMessage(`Annuncio ${isEditMode ? 'aggiornato' : 'creato'} con successo!`);
      
      // Pulizia dati di sessione se eravamo in modalità modifica
      if (isEditMode) {
        sessionStorage.removeItem('annuncioToEdit');
      }
      
      // Reset del form
      setAnnuncioText({ titolo: '', descrizione: '', data: getCurrentDate(), stato: 'pubblicato' });
        // Redirezione alla lista annunci dopo breve attesa
      setTimeout(() => {
        navigate('/recruiter-annunci?updated=true');
      }, 2000);
    } catch (error) {
      console.error(`Errore durante il ${isEditMode ? 'aggiornamento' : 'salvataggio'}:`, error);
      setMessage('Errore: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };return (
    <div className="crea-annuncio-container">
      {/* Pulsante per tornare alla dashboard */}
      <button 
        className="back-to-dashboard"
        onClick={() => navigate('/recruiter-dashboard')}
        title="Torna alla Dashboard"
      >
        ← Dashboard
      </button>

      {/* Header della pagina */}      <div className="crea-annuncio-header">
        <h1 className="crea-annuncio-title">
          {isEditMode ? 'Modifica Annuncio' : 'Crea Nuovo Annuncio'}
        </h1>
        <p className="crea-annuncio-subtitle">
          {isEditMode 
            ? 'Aggiorna i dettagli dell\'annuncio esistente' 
            : 'Pubblica una nuova offerta di lavoro per trovare i candidati perfetti'
          }
        </p>
        <div className="recruiter-info-badge">
          {currentUser?.nome} {currentUser?.cognome}
          {currentUser?.azienda && ` - ${currentUser.azienda}`}
        </div>
      </div>      {/* Form */}
      <form onSubmit={handleSaveAnnuncio} className="crea-annuncio-form">
        
        {/* Campo Titolo */}
        <div className="form-field-group">
          <label htmlFor="titolo" className="form-label-create">
            Titolo dell'annuncio <span className="required-asterisk">*</span>
          </label>
          <input
            type="text"
            id="titolo"
            name="titolo"
            value={annuncioText.titolo}
            onChange={e => setAnnuncioText({ ...annuncioText, titolo: e.target.value })}
            disabled={isLoading}
            className="form-input-create"
            placeholder="Es. Sviluppatore Frontend React Senior"
            required
          />
        </div>

        {/* Campo Data */}
        <div className="form-field-group">
          <label htmlFor="data" className="form-label-create">
            Data dell'annuncio
            <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'normal' }}>
              (Impostata automaticamente)
            </span>
          </label>
          <input
            type="date"
            id="data"
            name="data"
            value={annuncioText.data}
            disabled={true}
            className="form-input-create"
            style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            title="Data impostata automaticamente alla data corrente"
          />
        </div>

        {/* Campo Descrizione con Markdown */}
        <div className="form-field-group">
          <label htmlFor="descrizione" className="form-label-create">
            Descrizione dettagliata <span className="required-asterisk">*</span>
            <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'normal' }}>
              (Markdown supportato per formattazione)
            </span>
          </label>
          <div className="markdown-editor-wrapper">
            <MDEditor
              value={annuncioText.descrizione}
              onChange={(val) => setAnnuncioText({ ...annuncioText, descrizione: val || '' })}
              preview="edit"
              hideToolbar={false}
              data-color-mode="light"
              height={350}
              style={{ width: '100%' }}
              textareaProps={{
                placeholder: `Descrivi la posizione usando Markdown per una formattazione professionale:

# [Nome Posizione]

## Descrizione del Ruolo
Breve descrizione della posizione e delle responsabilità principali...

## Responsabilità Principali
- Sviluppo di applicazioni web moderne
- Collaborazione con il team di design
- Ottimizzazione delle performance

## Requisiti Richiesti
### Competenze Tecniche:
- **React.js** (esperienza minima 3 anni)
- **JavaScript ES6+**
- *CSS3 e HTML5*

### Soft Skills:
- Capacità di lavorare in team
- Problem solving
- Comunicazione efficace

## Cosa Offriamo
> Smart working, formazione continua, ambiente dinamico

## Come Candidarsi
Invia il tuo CV a: recruiting@azienda.com

---

**Sede:** Milano | **Contratto:** Tempo indeterminato | **RAL:** 40-50k€`,
                disabled: isLoading,
                style: { fontSize: '14px', minHeight: '300px' }
              }}
            />
          </div>
        </div>        {/* Pulsanti di azione */}
        <div className="form-buttons-create">
          <button type="submit" disabled={isLoading} className="btn-primary-create">
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                {isEditMode ? 'Aggiornando...' : 'Pubblicando...'}
              </>
            ) : (
              <>
                {isEditMode ? 'Salva Modifiche' : 'Pubblica Annuncio'}
              </>
            )}
          </button>
        </div>

        {/* Messaggio di feedback sotto i pulsanti */}
        {message && (
          <div className={`feedback-message-create ${message.includes('Errore') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CreaAnnuncio;
