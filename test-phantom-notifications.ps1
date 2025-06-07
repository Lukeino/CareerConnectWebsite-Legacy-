# Script per testare la nuova gestione delle notifiche fantasma

Write-Host "=== TEST SISTEMA NOTIFICHE MIGLIORATO ===" -ForegroundColor Cyan

# Login
Write-Host "`nStep 1: Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/auth/local" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"identifier":"luca.iacovazzi@example.com","password":"password123"}'
    $jwt = $loginResponse.jwt
    Write-Host "✅ Login completato" -ForegroundColor Green
} catch {
    Write-Host "❌ Errore login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

Write-Host "`nStep 2: Fetch notifiche attuali..." -ForegroundColor Yellow
try {
    $notifications = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?filters[recipient][id][`$eq]=25&filters[read][`$eq]=false" -Headers $headers
    Write-Host "📨 Notifiche non lette trovate: $($notifications.data.Count)" -ForegroundColor Green
    
    if ($notifications.data.Count -gt 0) {
        Write-Host "`nNotifiche nel sistema:" -ForegroundColor White
        foreach ($notif in $notifications.data) {
            Write-Host "  ID: $($notif.id) | Messaggio: $($notif.attributes.message.Substring(0,50))..." -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Errore nel fetch: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nStep 3: Test di validazione individuale..." -ForegroundColor Yellow
if ($notifications.data.Count -gt 0) {
    $testNotificationId = $notifications.data[0].id
    Write-Host "Testando notifica ID: $testNotificationId" -ForegroundColor Cyan
    
    try {
        $singleNotif = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Headers $headers
        Write-Host "✅ Notifica $testNotificationId VALIDA" -ForegroundColor Green
        
        # Prova a marcarla come letta
        Write-Host "`nStep 4: Test mark as read..." -ForegroundColor Yellow
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Method PUT -Headers $headers -Body '{"data":{"read":true}}'
        Write-Host "✅ Notifica $testNotificationId marcata come letta" -ForegroundColor Green
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "⚠️  Notifica $testNotificationId è FANTASMA (Status: $statusCode)" -ForegroundColor Yellow
        Write-Host "   Il sistema dovrebbe filtrarla automaticamente" -ForegroundColor Yellow
    }
} else {
    Write-Host "Nessuna notifica da testare" -ForegroundColor Gray
}

Write-Host "`nStep 5: Verifica stato finale..." -ForegroundColor Yellow
try {
    $finalNotifications = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?filters[recipient][id][`$eq]=25&filters[read][`$eq]=false" -Headers $headers
    Write-Host "📨 Notifiche non lette finali: $($finalNotifications.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Errore nella verifica finale: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETATO ===" -ForegroundColor Cyan
Write-Host "`nIstruzioni:" -ForegroundColor White
Write-Host "1. Ricarica la pagina frontend e apri il dropdown notifiche" -ForegroundColor White
Write-Host "2. Controlla la console del browser per i log di validazione" -ForegroundColor White
Write-Host "3. Prova a cliccare su una notifica e verifica che scompaia" -ForegroundColor White
Write-Host "4. Prova 'Segna tutte come lette' e verifica che il dropdown si svuoti" -ForegroundColor White
Write-Host "5. Ricarica la pagina e verifica che le notifiche non riappaiano" -ForegroundColor White
