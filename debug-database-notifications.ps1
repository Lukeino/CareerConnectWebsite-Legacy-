# Script per verificare le notifiche nel database

Write-Host "=== DEBUG DATABASE NOTIFICHE ===" -ForegroundColor Cyan

# Login
Write-Host "`nStep 1: Login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/auth/local" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"identifier":"luca.iacovazzi@example.com","password":"password123"}'
    $jwt = $loginResponse.jwt
    Write-Host "✅ Login effettuato" -ForegroundColor Green
} catch {
    Write-Host "❌ Errore login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $jwt"
    "Content-Type" = "application/json"
}

Write-Host "`nStep 2: Query TUTTE le notifiche per utente 25..." -ForegroundColor Yellow
try {
    $allNotifs = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?filters[recipient][id][$eq]=25&pagination[limit]=50" -Method GET -Headers $headers
    Write-Host "✅ Trovate $($allNotifs.data.Count) notifiche totali" -ForegroundColor Green
    
    foreach ($notif in $allNotifs.data) {
        $readStatus = if ($notif.attributes.read) { "LETTA" } else { "NON LETTA" }
        Write-Host "  ID: $($notif.id) | $readStatus | $($notif.attributes.message.Substring(0,40))..." -ForegroundColor White
    }
} catch {
    Write-Host "❌ Errore nel recuperare tutte le notifiche: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nStep 3: Query SOLO notifiche NON LETTE..." -ForegroundColor Yellow
try {
    $unreadNotifs = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?filters[recipient][id][$eq]=25&filters[read][$eq]=false&pagination[limit]=50" -Method GET -Headers $headers
    Write-Host "✅ Trovate $($unreadNotifs.data.Count) notifiche NON LETTE" -ForegroundColor Green
    
    foreach ($notif in $unreadNotifs.data) {
        Write-Host "  ID: $($notif.id) | $($notif.attributes.message.Substring(0,40))..." -ForegroundColor White
    }
} catch {
    Write-Host "❌ Errore nel recuperare notifiche non lette: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nStep 4: Test accesso diretto alle notifiche non lette..." -ForegroundColor Yellow
if ($unreadNotifs -and $unreadNotifs.data) {
    foreach ($notif in $unreadNotifs.data) {
        $id = $notif.id
        Write-Host "`nTesting notifica ID: $id" -ForegroundColor Cyan
        
        try {
            $singleNotif = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$id" -Method GET -Headers $headers
            Write-Host "  ✅ Notifica $id ACCESSIBILE" -ForegroundColor Green
            Write-Host "    Read: $($singleNotif.data.attributes.read)" -ForegroundColor White
            Write-Host "    Message: $($singleNotif.data.attributes.message.Substring(0,50))..." -ForegroundColor White
        } catch {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "  ❌ Notifica $id NON ACCESSIBILE (Status: $statusCode)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️  Nessuna notifica non letta da testare" -ForegroundColor Yellow
}

Write-Host "`nStep 5: Controlla struttura database..." -ForegroundColor Yellow
try {
    $dbStructure = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications?pagination[limit]=1" -Method GET -Headers $headers
    if ($dbStructure.data -and $dbStructure.data.Count -gt 0) {
        Write-Host "✅ Struttura notifica campione:" -ForegroundColor Green
        $sample = $dbStructure.data[0]
        Write-Host "  ID: $($sample.id)" -ForegroundColor White
        Write-Host "  Attributes: $($sample.attributes | ConvertTo-Json -Depth 2)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Errore nel controllare struttura: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== FINE DEBUG ===" -ForegroundColor Cyan
