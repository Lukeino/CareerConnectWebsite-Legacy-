# Test delle notifiche con campo read di tipo TEXT
Write-Host "🧪 TEST: Notifiche con campo read come TEXT" -ForegroundColor Cyan

# 1. Elimina tutte le notifiche esistenti
Write-Host "`n1. Pulizia notifiche esistenti..." -ForegroundColor Yellow
try {
    $notifications = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method GET
    foreach ($notif in $notifications.data) {
        try {
            Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$($notif.id)" -Method DELETE
            Write-Host "🗑️ Eliminata notifica ID: $($notif.id)" -ForegroundColor Gray
        } catch {
            Write-Host "⚠️ Errore eliminazione notifica $($notif.id)" -ForegroundColor Yellow
        }
    }
    Write-Host "✅ Pulizia completata" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Errore durante pulizia: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Crea notifica di test con read: 'false'
Write-Host "`n2. Creazione notifica di test con read: 'false'..." -ForegroundColor Yellow
$testNotification = @{
    data = @{
        recipient = 25
        type = 'test'
        title = 'Notifica di Test'
        message = 'Questa è una notifica di test con read come TEXT'
        read = 'false'
        publishedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method POST -Body $testNotification -ContentType "application/json"
    Write-Host "✅ Notifica creata con ID: $($response.data.id)" -ForegroundColor Green
    $testNotificationId = $response.data.id
    
    # Mostra i dettagli della notifica creata
    Write-Host "📋 Dettagli notifica creata:" -ForegroundColor White
    Write-Host "   ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "   Read: $($response.data.attributes.read)" -ForegroundColor Gray
    Write-Host "   Tipo Read: $($response.data.attributes.read.GetType().Name)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Errore creazione notifica: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Verifica che la notifica sia stata creata con read='false'
Write-Host "`n3. Verifica notifica creata..." -ForegroundColor Yellow
try {
    $checkNotification = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Method GET
    Write-Host "📨 Notifica recuperata:" -ForegroundColor White
    Write-Host "   ID: $($checkNotification.data.id)" -ForegroundColor Gray
    Write-Host "   Read: '$($checkNotification.data.attributes.read)'" -ForegroundColor Gray
    Write-Host "   Tipo: $($checkNotification.data.attributes.read.GetType().Name)" -ForegroundColor Gray
    
    if ($checkNotification.data.attributes.read -eq 'false') {
        Write-Host "✅ Campo read corretto: 'false'" -ForegroundColor Green
    } else {
        Write-Host "❌ Campo read errato. Atteso: 'false', Trovato: '$($checkNotification.data.attributes.read)'" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Errore verifica notifica: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test marcatura come letta (read: 'true')
Write-Host "`n4. Test marcatura come letta..." -ForegroundColor Yellow
$updateData = @{
    data = @{
        read = 'true'
    }
} | ConvertTo-Json -Depth 2

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Method PUT -Body $updateData -ContentType "application/json"
    Write-Host "✅ Notifica marcata come letta" -ForegroundColor Green
    
    # Verifica l'aggiornamento
    $updatedNotification = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Method GET
    Write-Host "📨 Notifica aggiornata:" -ForegroundColor White
    Write-Host "   ID: $($updatedNotification.data.id)" -ForegroundColor Gray
    Write-Host "   Read: '$($updatedNotification.data.attributes.read)'" -ForegroundColor Gray
    Write-Host "   Tipo: $($updatedNotification.data.attributes.read.GetType().Name)" -ForegroundColor Gray
    
    if ($updatedNotification.data.attributes.read -eq 'true') {
        Write-Host "✅ Campo read aggiornato correttamente: 'true'" -ForegroundColor Green
    } else {
        Write-Host "❌ Campo read non aggiornato. Atteso: 'true', Trovato: '$($updatedNotification.data.attributes.read)'" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Errore aggiornamento notifica: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test filtro per notifiche non lette
Write-Host "`n5. Test filtro notifiche non lette..." -ForegroundColor Yellow
try {
    $unreadUrl = "http://localhost:1337/api/notifications?filters[recipient][id][`$eq]=25&filters[read][`$eq]=false"
    $unreadNotifications = Invoke-RestMethod -Uri $unreadUrl -Method GET
    
    Write-Host "📨 Notifiche non lette trovate: $($unreadNotifications.data.Count)" -ForegroundColor White
    
    if ($unreadNotifications.data.Count -eq 0) {
        Write-Host "✅ Filtro funziona: nessuna notifica non letta (quella di test è ora read='true')" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Filtro potrebbe non funzionare correttamente o ci sono altre notifiche non lette" -ForegroundColor Yellow
        foreach ($notif in $unreadNotifications.data) {
            Write-Host "   - ID: $($notif.id), Read: '$($notif.attributes.read)'" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Errore test filtro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Test completato!" -ForegroundColor Cyan
Write-Host "Ora puoi testare il frontend con le nuove notifiche TEXT!" -ForegroundColor White
