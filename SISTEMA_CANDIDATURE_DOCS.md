# Sistema di Candidature CareerConnect - Documentazione Completa

## 📋 Overview

Sistema completo di candidature per la piattaforma CareerConnect che permette ai candidati di candidarsi per le offerte di lavoro e ai recruiter di ricevere notifiche in tempo reale.

## ✅ Funzionalità Implementate

### 1. **Sistema di Candidature** (Frontend)
- ✅ Bottone "Candidati" nelle offerte di lavoro
- ✅ Gestione candidature duplicate (impedisce candidature multiple)
- ✅ Verifica CV obbligatorio prima della candidatura
- ✅ Validazioni complete (login, ruolo candidato, CV presente)
- ✅ Feedback visivo con messaggi di stato
- ✅ Integrazione completa con backend Strapi

### 2. **Sistema di Notifiche** (Frontend)
- ✅ Componente NotificationSystem per recruiter
- ✅ Polling automatico ogni 30 secondi
- ✅ Contatore notifiche non lette con badge animato
- ✅ Dropdown con lista notifiche
- ✅ Funzioni per marcare come lette
- ✅ Formattazione date intelligente
- ✅ Integrazione nell'header

### 3. **UI/UX Design**
- ✅ CSS completo per sistema candidature
- ✅ CSS completo per sistema notifiche
- ✅ Design responsive
- ✅ Animazioni e transizioni
- ✅ Stati visivi (loading, success, error)

## 📁 File Modificati/Creati

### File Principali:
1. **`src/ListaOfferte.jsx`** - Sistema candidature completo
2. **`src/ListaOfferte.css`** - Stili per sistema candidature
3. **`src/NotificationSystem.jsx`** - Sistema notifiche real-time
4. **`src/NotificationSystem.css`** - Stili per notifiche
5. **`src/App.jsx`** - Integrazione NotificationSystem
6. **`src/Header.jsx`** - Header con notifiche (componente separato)

### File di Documentazione:
7. **`BACKEND_SETUP_INSTRUCTIONS.md`** - Istruzioni backend
8. **`test-api.ps1`** - Script test API
9. **`SISTEMA_CANDIDATURE_DOCS.md`** - Questa documentazione

## 🔧 Configurazione Backend Richiesta

### Collection da Creare in Strapi:

#### 1. **candidatures**
```javascript
{
  candidato: Relation(User),      // Many to One
  annuncio: Relation(Annuncio),   // Many to One  
  cv: Relation(File),             // Many to One
  recruiter: Relation(User),      // Many to One
  stato: Enum(['inviata', 'in_revisione', 'accettata', 'rifiutata']),
  data_candidatura: DateTime,
  note: LongText
}
```

#### 2. **notifications**
```javascript
{
  recipient: Relation(User),      // Many to One
  type: Text,                     // 'new_application', 'application_update', etc.
  title: Text,
  message: LongText,
  read: Boolean,
  data: JSON                      // Dati aggiuntivi (job_id, candidate_id, etc.)
}
```

## 🚀 Flusso di Funzionamento

### Candidatura Utente:
1. **Candidato** visualizza offerta in ListaOfferte
2. Clicca "Candidati per questa posizione"
3. **Validazioni:**
   - Utente autenticato
   - Ruolo = candidato
   - CV caricato nel profilo
   - Non già candidato per questa offerta
4. **Invio candidatura** al backend
5. **Notifica automatica** al recruiter
6. **Aggiornamento stato** locale (bottone diventa "Candidatura inviata")

### Notifiche Recruiter:
1. **Polling automatico** ogni 30 secondi
2. **Badge animato** mostra numero notifiche non lette
3. **Dropdown notifiche** con lista completa
4. **Click notifica** → segna come letta
5. **"Segna tutte come lette"** → bulk update

## 📡 Endpoint API Utilizzati

### Candidature:
- `GET /api/candidatures?filters[candidato][id][$eq]={userId}` - Lista candidature utente
- `POST /api/candidatures` - Crea nuova candidatura

### Notifiche:
- `GET /api/notifications?filters[recipient][id][$eq]={userId}&sort=createdAt:desc` - Lista notifiche
- `POST /api/notifications` - Crea notifica
- `PUT /api/notifications/{id}` - Aggiorna notifica (segna come letta)
- `PUT /api/notifications` (bulk) - Segna tutte come lette

## 🎨 Stati UI Implementati

### Bottone Candidatura:
- **Default:** "📝 Candidati per questa posizione"
- **Loading:** "⏳ Invio candidatura..."
- **Applied:** "✅ Candidatura inviata" (disabilitato)

### Messaggi di Stato:
- **Success:** ✅ Verde per candidatura inviata
- **Warning:** ⚠️ Arancione per CV mancante/già candidato
- **Error:** ❌ Rosso per errori di rete/validazione

### Badge Notifiche:
- **Numero:** Contatore notifiche non lette
- **Animazione:** Pulse per nuove notifiche
- **Colori:** Rosso per non lette, grigio per lette

## 🔐 Sicurezza e Validazioni

### Frontend:
- ✅ Validazione ruolo utente
- ✅ Verifica autenticazione
- ✅ Controllo CV obbligatorio
- ✅ Prevenzione candidature duplicate
- ✅ JWT token nelle richieste

### Backend (da implementare):
- ✅ Permissions configurate per collection
- ✅ Filtri per recipient nelle notifiche
- ✅ Relazioni Many-to-One corrette
- ✅ Validazione schema Strapi

## 🧪 Testing

### Test Frontend:
1. Login come candidato
2. Visualizza offerte in ListaOfferte
3. Prova candidatura senza CV → errore
4. Carica CV nel profilo
5. Candidati per offerta → successo
6. Prova seconda candidatura → impedita

### Test Notifiche:
1. Login come recruiter
2. Verifica polling notifiche
3. Candidatura da altro utente
4. Verifica nuova notifica
5. Click su notifica → segna come letta

### Test API:
Usare script `test-api.ps1` dopo configurazione backend.

## 🐛 Troubleshooting

### Errori Comuni:

1. **"Collection candidatures not found"**
   - Verificare che la collection sia creata in Strapi
   - Controllare permessi API

2. **"CV obbligatorio"**
   - Utente deve caricare CV in candidate-dashboard
   - Verificare campo `currentUser.cv`

3. **"Notifiche non arrivano"**
   - Verificare polling NotificationSystem
   - Controllare console per errori API
   - Verificare JWT token

4. **"Candidatura duplicata"**
   - Normale comportamento preventivo
   - Verificare stato locale `candidature` Set

## 📈 Prossimi Sviluppi

### Funzionalità Aggiuntive:
- 📊 Dashboard recruiter per gestire candidature
- 📝 Sistema di messaggi tra candidato e recruiter  
- 📧 Notifiche email per candidature
- 📱 Notifiche push browser
- 📋 Stati candidatura avanzati (colloquio, offerta, etc.)
- 🔍 Filtri avanzati per candidature
- 📊 Analytics e statistiche

### Miglioramenti Tecnici:
- 🔄 WebSocket per notifiche real-time
- 💾 Cache notifiche lato client
- 🎯 Ottimizzazione polling
- 📱 Responsive design mobile
- ♿ Accessibilità WCAG

## 📞 Supporto

Per problemi o domande:
1. Verificare console browser per errori
2. Controllare backend Strapi logs
3. Usare script test-api.ps1 per debug
4. Consultare questa documentazione

---

**Data ultima modifica:** 30 Maggio 2025
**Versione:** 1.0.0
**Autore:** GitHub Copilot + LucaI
