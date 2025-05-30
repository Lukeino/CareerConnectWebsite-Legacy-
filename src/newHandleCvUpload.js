// Questa è la nuova implementazione corretta di handleCvUpload
  const handleCvUpload = async () => {
    console.log('🔥 handleCvUpload chiamata!', { cvFile, currentUser });
    
    if (!cvFile) {
      console.log('❌ Nessun file selezionato');
      setMessage('❌ Seleziona prima un file CV');
      return;
    }

    console.log('📁 File selezionato:', cvFile.name);
    setIsUploadingCv(true);
    setMessage('');

    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        console.log('❌ Token JWT mancante');
        setMessage('Token di autenticazione mancante');
        setIsUploadingCv(false);
        return;
      }

      console.log('🔑 Token JWT presente, procedendo con upload...');

      // STEP 1: Trova l'entry esistente del candidato PRIMA dell'upload
      // In questo modo ci assicuriamo di avere l'ID dell'entry corretta
      console.log('🔍 Cerco entry esistente del candidato con ID utente:', currentUser.id);
      const candidatoDetailsResponse = await fetch(`http://localhost:1337/api/candidatoes?filters[user][id][$eq]=${currentUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        }
      });

      if (!candidatoDetailsResponse.ok) {
        throw new Error('Errore nel recuperare i dettagli del candidato');
      }

      const candidatoDetailsData = await candidatoDetailsResponse.json();
      console.log('🔍 Dettagli candidato trovati:', candidatoDetailsData);
      
      // Verifica se esiste già un'entry per questo utente
      const existingCandidate = candidatoDetailsData.data?.[0];
      const existingCandidateId = existingCandidate?.id;
      
      if (!existingCandidateId) {
        console.log('⚠️ Nessun profilo candidato trovato, creerò uno nuovo');
        // Se non esiste, il CV verrà salvato nel handleSave
        setMessage('Per salvare il CV, inserisci prima nome e cognome e salva');
        setIsUploadingCv(false);
        return;
      }
      
      console.log('✅ Trovata entry esistente con ID:', existingCandidateId);

      // STEP 2: Upload del file su Strapi
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
        console.log('❌ Errore upload response:', uploadResponse.status);
        throw new Error('Errore nell\'upload del file');
      }

      const uploadedFiles = await uploadResponse.json();
      const uploadedCv = uploadedFiles[0];
      console.log('✅ CV caricato con successo:', uploadedCv);

      // STEP 3: Aggiorna l'entry esistente del candidato IMMEDIATAMENTE
      console.log('🔄 Aggiornamento diretto dell\'entry esistente con ID:', existingCandidateId);
      
      const candidateUpdateData = {
        data: {
          nome: profileData.nome.trim() || existingCandidate.attributes?.nome || '',
          cognome: profileData.cognome.trim() || existingCandidate.attributes?.cognome || '',
          cv: uploadedCv.id,
          user: currentUser.id // Mantiene l'associazione con l'utente
          // Non includere publishedAt per evitare problemi
        }
      };
      
      const candidateResponse = await fetch(`http://localhost:1337/api/candidatoes/${existingCandidateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidateUpdateData)
      });
      
      if (!candidateResponse.ok) {
        const errorData = await candidateResponse.json();
        console.error('❌ Errore nell\'aggiornamento del candidato:', errorData);
        throw new Error(`Errore nel salvare il CV: ${errorData.error?.message || candidateResponse.status}`);
      }
      
      const updatedCandidate = await candidateResponse.json();
      console.log('✅ Entry candidato aggiornata con successo:', updatedCandidate);

      // STEP 4: Aggiorna lo stato locale
      setProfileData(prev => ({
        ...prev,
        cv: uploadedCv
      }));

      // Aggiorna anche originalData
      setOriginalData(prev => ({
        ...prev,
        cv: uploadedCv
      }));

      setCvFile(null);
      setMessage('✅ CV caricato e salvato con successo!');

    } catch (error) {
      console.error('❌ Errore nell\'upload del CV:', error);
      setMessage(`❌ Errore nell'upload: ${error.message}`);
    } finally {
      setIsUploadingCv(false);
    }
  };
