# Test semplice per notifiche con campo read TEXT
Write-Host "🧪 TEST: Notifiche con read come TEXT" -ForegroundColor Cyan

# 1. Crea notifica di test con read: 'false'
Write-Host "`n1. Creazione notifica di test..." -ForegroundColor Yellow
$testNotification = @{
    data = @{
        recipient = 25
        type = 'test'
        title = 'Test Notifica TEXT'
        message = 'Test notifica con read come stringa'
        read = 'false'
        publishedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method POST -Body $testNotification -ContentType "application/json"
    Write-Host "✅ Notifica creata con ID: $($response.data.id)" -ForegroundColor Green
    $testNotificationId = $response.data.id
    
    Write-Host "📋 Dettagli:" -ForegroundColor White
    Write-Host "   Read: '$($response.data.attributes.read)'" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Errore: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Test marcatura come letta
Write-Host "`n2. Marcatura come letta..." -ForegroundColor Yellow
$updateData = @{
    data = @{
        read = 'true'
    }
} | ConvertTo-Json -Depth 2

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Method PUT -Body $updateData -ContentType "application/json"
    Write-Host "✅ Marcata come letta" -ForegroundColor Green
    
    # Verifica
    $updated = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$testNotificationId" -Method GET
    Write-Host "📋 Aggiornata:" -ForegroundColor White
    Write-Host "   Read: '$($updated.data.attributes.read)'" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Errore: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Test completato! Ora testa il frontend." -ForegroundColor Cyan
