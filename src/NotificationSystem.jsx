import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import './NotificationSystem.css';

function NotificationSystem({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);  const [isLoading, setIsLoading] = useState(false);

  // Carica le notifiche quando il componente viene montato
  useEffect(() => {
    if (currentUser && currentUser.roleType === 'recruiter') {
      fetchNotifications();
    }
  }, [currentUser]);
  // Polling separato per evitare loop infiniti
  useEffect(() => {
    if (currentUser && currentUser.roleType === 'recruiter') {
      const interval = setInterval(() => {
        // Solo se non ci sono notifiche non lette, controlla per nuove notifiche
        if (unreadCount === 0) {
          fetchNotifications();
        }
      }, 30000); // Polling ogni 30 secondi
      return () => clearInterval(interval);
    }
  }, [currentUser, unreadCount]); // Aggiungi unreadCount come dipendenza  // Recupera le notifiche dal backend
  const fetchNotifications = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt || !currentUser) return;      console.log('🔄 Fetching notifiche non lette per utente:', currentUser.id);

      // Carica SOLO le notifiche non lette per il dropdown (ora con read come TEXT)
      const response = await fetch(
        `http://localhost:1337/api/notifications?filters[recipient][id][$eq]=${currentUser.id}&filters[read][$eq]=false&sort=createdAt:desc&pagination[limit]=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const notificationList = data.data || [];
        
        console.log(`📨 ${notificationList.length} notifiche totali trovate per utente ${currentUser.id}`);
        console.log('📋 Notifiche dettagli:', notificationList);        // DEBUG: Mostra i dettagli completi delle notifiche
        notificationList.forEach((notif, index) => {
          console.log(`📨 Notifica ${index + 1}:`, {
            'REAL_ID_FROM_DB': notif.id,
            'INDEX_POSITION': index,
            'ID_TYPE': typeof notif.id,
            'STRUTTURA_COMPLETA': notif,
            'ATTRIBUTES': notif.attributes,
            'DIRECT_ACCESS': {
              title: notif.title,
              message: notif.message,
              type: notif.type
            },
            'ATTRIBUTES_ACCESS': {
              title: notif.attributes?.title,
              message: notif.attributes?.message,
              type: notif.attributes?.type
            }
          });
        });
        
        // DEBUG EXTRA: Verifica mapping degli ID
        console.log('🆔 MAPPING ID DELLE NOTIFICHE:');
        notificationList.forEach((notif, index) => {
          console.log(`   Posizione ${index} → ID Database: ${notif.id} (tipo: ${typeof notif.id})`);
        });
        
        // Aggiungi timestamp per evitare che la data cambi ad ogni refresh
        const notificationsWithTimestamp = notificationList.map(notif => ({
          ...notif,
          displayTime: notif.displayTime || notif.createdAt // Mantieni il timestamp originale
        }));
        
        setNotifications(notificationsWithTimestamp);
        setUnreadCount(notificationsWithTimestamp.length);
      } else {
        console.error('❌ Errore response notifiche:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento notifiche:', error);
    }
  };  // TEST SEMPLICE: Marca una notifica come letta
  const markAsRead = async (notificationId) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return;

      console.log(`🧪 TEST: Marcando notifica come letta...`);
      console.log(`🆔 ID ricevuto:`, notificationId, `(tipo: ${typeof notificationId})`);
        // DEBUG: Trova la notifica nell'array per verificare l'ID
      const targetNotification = notifications.find(n => n.id === notificationId);
      console.log(`🎯 Notifica trovata nell'array:`, targetNotification);
      console.log(`📋 Tutte le notifiche nell'array:`, notifications.map(n => ({id: n.id, documentId: n.documentId, type: typeof n.id})));

      // IMPORTANTE: Usa documentId per Strapi v5, non l'id numerico!
      const documentId = targetNotification?.documentId;
      if (!documentId) {
        console.error('❌ DocumentId non trovato per la notifica:', notificationId);
        return;
      }
      
      console.log(`🔑 Usando documentId: ${documentId} invece di id: ${notificationId}`);

      const response = await fetch(`http://localhost:1337/api/notifications/${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { read: 'true' } // CAMBIATO: ora è text invece di boolean
        })
      });

      console.log(`🔍 Response Status: ${response.status}`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ Notifica ${notificationId} marcata come letta. Response:`, responseData);        // Rimuovi immediatamente la notifica dal dropdown
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        console.log(`📱 Notifica ${notificationId} rimossa dal dropdown`);
        
      } else {
        const errorText = await response.text();
        console.error(`❌ Errore ${response.status}:`, errorText);
      }
    } catch (error) {
      console.error('❌ Errore nel marcare notifica come letta:', error);
    }
  };// Marca tutte le notifiche come lette
  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return;

      console.log(`📖 Marcando ${notifications.length} notifiche come lette...`);      // Marca tutte le notifiche correnti come lette
      const markPromises = notifications.map(notif =>
        fetch(`http://localhost:1337/api/notifications/${notif.documentId}`, { // USA documentId!
          method: 'PUT', // MARCA COME LETTA invece di eliminare
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },          body: JSON.stringify({
            data: { read: 'true' } // CAMBIATO: ora è text invece di boolean
          })
        }).then(response => {
          if (response.ok) {
            console.log(`✅ Notifica ${notif.id} marcata come letta`);
            return { success: true, id: notif.id };
          } else if (response.status === 404) {
            console.warn(`⚠️ Notifica ${notif.id} non trovata (404)`);
            return { success: true, id: notif.id, notFound: true };
          } else {
            console.error(`❌ Errore nel marcare notifica ${notif.id} come letta:`, response.status);
            return { success: false, id: notif.id };
          }
        }).catch(error => {
          console.error(`❌ Errore di rete per notifica ${notif.id}:`, error);
          return { success: false, id: notif.id };
        })      );

      const results = await Promise.all(markPromises);
      
      // Conta successi e fallimenti
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const notFound = results.filter(r => r.notFound).length;
      
      console.log(`📊 Risultati: ${successful} marcate come lette, ${failed} fallimenti, ${notFound} non trovate`);

      // Svuota il dropdown e azzera il conteggio
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false); // Chiudi il dropdown
      
      console.log('✅ Tutte le notifiche marcate come lette e rimosse dal dropdown');
      
    } catch (error) {
      console.error('❌ Errore nel marcare tutte le notifiche come lette:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Formatta la data della notifica
  const formatNotificationDate = (notification) => {
    // Usa displayTime per mantenere il timestamp originale
    const dateString = notification.displayTime || notification.createdAt;
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Ora';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} min fa`;
    } else if (diffInMinutes < 1440) { // 24 ore
      return `${Math.floor(diffInMinutes / 60)}h fa`;
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Non mostrare per i candidati
  if (!currentUser || currentUser.roleType !== 'recruiter') {
    return null;
  }

  return (
    <div className="notification-system">
      {/* Icona notifiche */}      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifiche"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Dropdown notifiche */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifiche</h3>
            {unreadCount > 0 && (              <button 
                onClick={markAllAsRead}
                disabled={isLoading}                className="mark-all-read-btn"
              >
                {isLoading ? 'Marcando...' : 'Segna tutte come lette'}
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>Nessuna notifica al momento</p>
              </div>
            ) : (              notifications.map((notification) => {
                // Se read è undefined o 'false', lo consideriamo come non letta
                const isRead = (notification.attributes?.read || notification.read) === 'true';
                
                // Gestione flessibile dei dati - prova sia accesso diretto che tramite attributes
                const notificationData = {
                  title: notification.title || notification.attributes?.title || 'Notifica',
                  message: notification.message || notification.attributes?.message || 'Messaggio notifica',
                  type: notification.type || notification.attributes?.type || 'default'
                };
                
                console.log(`🔍 RENDERING Notifica ${notification.id}:`, {
                  originalNotification: notification,
                  extractedData: notificationData,
                  isRead
                });
                
                return (
                  <div 
                    key={notification.id}
                    className={`notification-item ${isRead ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-title">
                        {notificationData.title}
                      </div>
                      <div className="notification-message">
                        {notificationData.message}
                      </div>
                      <div className="notification-time">
                        {formatNotificationDate(notification)}
                      </div>
                    </div>
                    <div className="notification-dot" style={{
                      backgroundColor: isRead ? 'green' : 'red'
                    }}></div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <p className="notification-count">
                {notifications.length} notifiche totali
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay per chiudere il dropdown */}
      {isOpen && (
        <div 
          className="notification-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default NotificationSystem;
