import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import JobOfferImage from './assets/JobOffer.png';
import FindJobImage from './assets/FindJob.png';
import RecruiterUserImage from './assets/RecruiterUser.jpg';
import WriteAnnounceImage from './assets/WriteAnnounce.png';
import ConsulenceImage from './assets/Consulence.png';
import './Welcome.css';

function Welcome({ currentUser, searchTerm }) {
  const navigate = useNavigate();
  const [recruiterStats, setRecruiterStats] = useState({
    annunciPubblicati: 0,
    candidatureOttenute: 0,
    visiteAlProfilo: 0
  });

  // Funzione per determinare il saluto in base all'orario
  const getTimeBasedGreeting = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 6 && currentHour < 12) {
      return 'Buongiorno';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Buon pomeriggio';
    } else {
      return 'Buonasera';
    }
  };

  // Carica le statistiche del recruiter
  useEffect(() => {
    const fetchRecruiterStats = async () => {
      if (!currentUser || currentUser.roleType !== 'recruiter') {
        return;
      }

      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        // Recupera tutti gli annunci del recruiter corrente
        const response = await fetch('http://localhost:1337/api/annuncios?populate=*', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Errore nel recupero delle statistiche');
          return;
        }

        const data = await response.json();
        
        if (data && data.data) {
          // Filtra gli annunci del recruiter corrente
          const annunciDelRecruiter = data.data.filter(annuncio => {
            const createdById = annuncio.createdby?.id || 
                               annuncio.attributes?.createdby?.data?.id ||
                               (annuncio.attributes?.createdby && annuncio.attributes.createdby.id);
            
            return createdById && createdById.toString() === currentUser.id.toString();
          });

          // Conta solo gli annunci pubblicati
          const annunciPubblicati = annunciDelRecruiter.filter(annuncio => {
            const stato = annuncio.stato || 
                         annuncio.attributes?.stato || 
                         'pubblicato'; // default se non specificato
            return stato === 'pubblicato';
          }).length;

          setRecruiterStats({
            annunciPubblicati: annunciPubblicati,
            candidatureOttenute: 0, // Per ora 0 come richiesto
            visiteAlProfilo: 0 // Per ora 0 come richiesto
          });

          console.log(`📊 Statistiche recruiter aggiornate: ${annunciPubblicati} annunci pubblicati`);
        }
      } catch (error) {
        console.error('Errore nel caricamento delle statistiche:', error);
        // Mantieni i valori di default in caso di errore
        setRecruiterStats({
          annunciPubblicati: 0,
          candidatureOttenute: 0,
          visiteAlProfilo: 0
        });
      }
    };

    fetchRecruiterStats();
  }, [currentUser]);

  return (
    <div className="welcome-container">      {/* Container trasparente superiore */}
      <div className="welcome-hero-container">
        <div className="hero-content">          <h1 className="hero-title">
            {currentUser ? (
              <>{getTimeBasedGreeting()}, {currentUser.nome}!</>
            ) : (
              'Ti diamo il benvenuto su CareerConnect!'
            )}
          </h1>
            <p className="hero-subtitle">
            {currentUser?.roleType === 'recruiter' && currentUser.azienda ? (
              <>Nella tua dashboard personale puoi gestire gli annunci, le candidature e tanto altro ancora!</>
            ) : (
              <>Scopri tutte le offerte lavorative dei nostri Recruiter e le nostre aziende partner.<br />Registrati, invia la candidatura e inizia la tua carriera!</>
            )}
          </p>
          
          {/* Statistiche per recruiter o pulsante per altri utenti */}
          {currentUser?.roleType === 'recruiter' ? (
            <div className="recruiter-stats">
              <div className="stat-item">
                <div className="stat-number">{recruiterStats.annunciPubblicati}</div>
                <div className="stat-label">Annunci pubblicati</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{recruiterStats.candidatureOttenute}</div>
                <div className="stat-label">Candidature ottenute</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{recruiterStats.visiteAlProfilo}</div>
                <div className="stat-label">Visite al profilo</div>
              </div>
            </div>
          ) : (
            <button 
              className="hero-cta-button"
              onClick={() => navigate('/candidate-login')}
            >
              Inizia
            </button>
          )}
        </div>
        
        <div className="hero-image">
          <img src={FindJobImage} alt="Find Job" className="hero-image-img" />
        </div>
      </div>      {/* Container principale bianco */}
      <div className="welcome-main-container">
        {/* 3 schede dashboard */}
        <div className="dashboard-cards-container">          {/* Prima scheda - Lista Offerte */}          
          <div className="dashboard-card with-background" onClick={() => navigate('/lista-offerte')}>
            <div className="card-icon-image">
              <img src={JobOfferImage} alt="Lista Offerte" className="card-icon-img" />
            </div>
            <h3 className="card-title">Lista Offerte</h3>
            <p className="card-description">
              Esplora tutte le opportunità di lavoro disponibili sulla piattaforma
            </p>
          </div>          {/* Seconda scheda - Crea Annuncio (per recruiter) o Trova Candidati (per altri) */}
          <div className="dashboard-card with-background" onClick={() => {
            if (currentUser?.roleType === 'recruiter') {
              navigate('/recruiter-crea-annuncio');
            } else {
              // Per utenti non-recruiter, porta al login recruiter
              navigate('/recruiter-login');
            }
          }}>
            <div className="card-icon-image">
              <img src={currentUser?.roleType === 'recruiter' ? WriteAnnounceImage : RecruiterUserImage} 
                   alt={currentUser?.roleType === 'recruiter' ? 'Crea Annuncio' : 'Trova Candidati'} 
                   className="card-icon-img" />
            </div>
            <h3 className="card-title">{currentUser?.roleType === 'recruiter' ? 'Crea Annuncio' : 'Trova Candidati'}</h3>
            <p className="card-description">
              {currentUser?.roleType === 'recruiter' 
                ? 'Scrivi un annuncio e pubblicalo!'
                : 'Sei un recruiter? Pubblica la tua offerta e cerca i migliori candidati!'
              }
            </p>
          </div>{/* Terza scheda - Contatta i Recruiter */}
          <div className="dashboard-card with-background">
            <div className="card-icon-image">
              <img src={ConsulenceImage} alt="Contatta i Recruiter" className="card-icon-img" />
            </div>            <h3 className="card-title">Contatta i Recruiter</h3>
            <p className="card-description">
              Mettiti in diretto contatto con i recruiter e le nostre aziende partner!
            </p>
          </div></div>
      </div>
    </div>
  );
}

export default Welcome;