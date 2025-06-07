# Script per diagnosticare il problema delle notifiche fantasma

Write-Host "=== DIAGNOSI NOTIFICHE FANTASMA ===" -ForegroundColor Cyan

# Prima ottieni un nuovo JWT
Write-Host "`nStep 1: Login per ottenere JWT..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/auth/local" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"identifier":"luca.iacovazzi@example.com","password":"password123"}'
$jwt = $loginResponse.jwt
Write-Host "JWT ottenuto: $($jwt.Substring(0,20))..." -ForegroundColor Green

# Headers per le richieste autenticate
$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

Write-Host "`nStep 2: Fetch tutte le notifiche non lette..." -ForegroundColor Yellow
try {
    $notifications = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?filters[recipient][id][$eq]=25&filters[read][$eq]=false&sort=createdAt:desc&pagination[limit]=20" -Method GET -Headers $headers
    Write-Host "Notifiche trovate: $($notifications.data.Count)" -ForegroundColor Green
    
    foreach ($notif in $notifications.data) {
        Write-Host "  ID: $($notif.id) | Messaggio: $($notif.attributes.message.Substring(0,50))..." -ForegroundColor White
    }
} catch {
    Write-Host "Errore nel fetch notifiche: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nStep 3: Testa accesso individuale alle notifiche problematiche..." -ForegroundColor Yellow
$problematicIds = @(6, 4, 2)

foreach ($id in $problematicIds) {
    Write-Host "`nTestando notifica ID: $id" -ForegroundColor Cyan
    
    try {
        $singleNotif = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$id" -Method GET -Headers $headers
        Write-Host "  ✓ Notifica $id ESISTE" -ForegroundColor Green
        Write-Host "    Messaggio: $($singleNotif.data.attributes.message)" -ForegroundColor White
        Write-Host "    Read: $($singleNotif.data.attributes.read)" -ForegroundColor White
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "  ✗ Notifica $id NON ESISTE (Status: $statusCode)" -ForegroundColor Red
    }
}

Write-Host "`nStep 4: Prova a marcare come letta una notifica problematica..." -ForegroundColor Yellow
try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/6" -Method PUT -Headers $headers -Body '{"data":{"read":true}}'
    Write-Host "✓ Notifica 6 marcata come letta con successo" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "✗ Errore nel marcare notifica 6: Status $statusCode" -ForegroundColor Red
}

Write-Host "`nStep 5: Controlla notifiche esistenti nel database..." -ForegroundColor Yellow
try {
    $allNotifs = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?filters[recipient][id][$eq]=25&pagination[limit]=50" -Method GET -Headers $headers
    Write-Host "Tutte le notifiche per utente 25:" -ForegroundColor Green
    foreach ($notif in $allNotifs.data) {
        $readStatus = if ($notif.attributes.read) { "LETTA" } else { "NON LETTA" }
        Write-Host "  ID: $($notif.id) | $readStatus | $($notif.attributes.message.Substring(0,40))..." -ForegroundColor White
    }
} catch {
    Write-Host "Errore nel recuperare tutte le notifiche: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== FINE DIAGNOSI ===" -ForegroundColor Cyan
