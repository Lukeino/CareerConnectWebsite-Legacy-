# Test per verificare che il campo recipient sia configurato correttamente

Write-Host "🔍 Test configurazione campo recipient..." -ForegroundColor Cyan

# 1. Prima trova un utente recruiter per testare
Write-Host "`n1. Cerca utenti recruiter..." -ForegroundColor Yellow
$usersResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/users" -Method GET -Headers @{
    "Content-Type" = "application/json"
}

$recruiterUser = $usersResponse | Where-Object { $_.roleType -eq "recruiter" } | Select-Object -First 1

if ($recruiterUser) {
    Write-Host "✅ Recruiter trovato: ID=$($recruiterUser.id), Email=$($recruiterUser.email)" -ForegroundColor Green
    
    # 2. Prova a creare una notifica di test
    Write-Host "`n2. Crea notifica di test..." -ForegroundColor Yellow
    
    $notificationData = @{
        data = @{
            recipient = $recruiterUser.id
            type = "test"
            title = "Test configurazione recipient"
            message = "Questa è una notifica di test per verificare la configurazione"
            read = $false
            publishedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    } | ConvertTo-Json -Depth 3
    
    try {
        Write-Host "📤 Invio notifica..." -ForegroundColor Blue
        Write-Host "Dati: $notificationData" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method POST -Body $notificationData -Headers @{
            "Content-Type" = "application/json"
        }
        
        Write-Host "✅ SUCCESSO! Notifica creata con ID: $($response.data.id)" -ForegroundColor Green
        Write-Host "📋 Recipient ID: $($response.data.recipient)" -ForegroundColor Green
        Write-Host "📋 Title: $($response.data.title)" -ForegroundColor Green
        
        # 3. Verifica che la notifica sia stata creata correttamente
        Write-Host "`n3. Verifica notifica creata..." -ForegroundColor Yellow
        $checkResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$($response.data.id)?populate=recipient" -Method GET -Headers @{
            "Content-Type" = "application/json"
        }
        
        Write-Host "✅ Notifica verificata:" -ForegroundColor Green
        Write-Host "   - ID: $($checkResponse.data.id)" -ForegroundColor White
        Write-Host "   - Recipient User ID: $($checkResponse.data.recipient.id)" -ForegroundColor White
        Write-Host "   - Recipient Email: $($checkResponse.data.recipient.email)" -ForegroundColor White
        
    } catch {
        Write-Host "❌ ERRORE nella creazione della notifica!" -ForegroundColor Red
        Write-Host "Dettagli errore: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Corpo dell'errore: $errorBody" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "❌ Nessun utente recruiter trovato!" -ForegroundColor Red
    Write-Host "Utenti disponibili:" -ForegroundColor Yellow
    $usersResponse | ForEach-Object { 
        Write-Host "  - ID: $($_.id), Email: $($_.email), Role: $($_.roleType)" -ForegroundColor White
    }
}

Write-Host "`n🏁 Test completato!" -ForegroundColor Cyan
