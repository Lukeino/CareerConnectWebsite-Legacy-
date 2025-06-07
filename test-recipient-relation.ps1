# Test per verificare che il campo recipient sia configurato correttamente

Write-Host "🧪 Test configurazione campo recipient..." -ForegroundColor Yellow

# 1. Verifica che la collection notifications esista e abbia il campo recipient
Write-Host "`n1. Verifica struttura collection notifications:" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method GET
    Write-Host "✅ Collection notifications trovata" -ForegroundColor Green
} catch {
    Write-Host "❌ Errore accesso collection notifications: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Prova a creare una notifica di test
Write-Host "`n2. Test creazione notifica con recipient..." -ForegroundColor Cyan

# Usa l'ID di un utente esistente (puoi modificare questo valore)
$testUserId = 1  # Cambia con un ID utente valido

$testNotification = @{
    data = @{
        recipient = $testUserId
        type = "test"
        title = "Test notifica"
        message = "Questa è una notifica di test"
        read = $false
        publishedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method POST -Body $testNotification -ContentType "application/json"
    Write-Host "✅ Notifica creata con successo!" -ForegroundColor Green
    Write-Host "📋 ID notifica: $($response.data.id)" -ForegroundColor White
    Write-Host "👤 Recipient ID: $($response.data.recipient)" -ForegroundColor White
} catch {
    $errorDetails = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorDetails)
    $responseBody = $reader.ReadToEnd()
    
    Write-Host "❌ Errore creazione notifica:" -ForegroundColor Red
    Write-Host $responseBody -ForegroundColor Red
    
    if ($responseBody -like "*recipient*") {
        Write-Host "`n💡 SOLUZIONE: Il campo 'recipient' non è configurato correttamente!" -ForegroundColor Yellow
        Write-Host "   - Vai in Strapi Admin → Content-Types Builder → notifications" -ForegroundColor Yellow
        Write-Host "   - Aggiungi campo 'recipient' di tipo 'Relation'" -ForegroundColor Yellow
        Write-Host "   - Target collection: 'user'" -ForegroundColor Yellow
        Write-Host "   - Relation type: 'Many to One'" -ForegroundColor Yellow
    }
}

Write-Host "`n🏁 Test completato!" -ForegroundColor Yellow
