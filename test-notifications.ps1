# Script per testare il sistema di notifiche
Write-Host "🔔 TEST SISTEMA NOTIFICHE" -ForegroundColor Yellow
Write-Host ""

# Test se la collection notifications esiste
Write-Host "1. Test esistenza collection notifications..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:1337/api/notifications" -Method GET
    Write-Host "✅ Collection notifications esiste" -ForegroundColor Green
    $content = $response.Content | ConvertFrom-Json
    Write-Host "📋 Notifiche trovate: $($content.data.Count)" -ForegroundColor White
    
    if ($content.data.Count -gt 0) {
        Write-Host "📄 Prima notifica:" -ForegroundColor White
        $content.data[0] | ConvertTo-Json -Depth 3
    }
} catch {
    Write-Host "❌ Errore accesso notifications: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Probabilmente la collection non esiste o non ha permessi pubblici" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Test esistenza candidatures..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:1337/api/candidatures?populate=*" -Method GET
    $content = $response.Content | ConvertFrom-Json
    Write-Host "✅ Candidature trovate: $($content.data.Count)" -ForegroundColor Green
    
    if ($content.data.Count -gt 0) {
        Write-Host "📄 Ultima candidatura:" -ForegroundColor White
        $lastApplication = $content.data[-1]
        Write-Host "ID: $($lastApplication.id)" -ForegroundColor White
        Write-Host "Stato: $($lastApplication.stato)" -ForegroundColor White
        Write-Host "Data: $($lastApplication.data_candidatura)" -ForegroundColor White
        Write-Host "Candidato ID: $($lastApplication.candidato)" -ForegroundColor White
        Write-Host "Annuncio ID: $($lastApplication.annuncio)" -ForegroundColor White
        Write-Host "Recruiter ID: $($lastApplication.recruiter)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Errore accesso candidatures: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 PASSI SUCCESSIVI:" -ForegroundColor Yellow
Write-Host "1. Se collection notifications non esiste, creala in Strapi admin" -ForegroundColor White
Write-Host "2. Fai login come recruiter per testare il NotificationSystem" -ForegroundColor White
Write-Host "3. Invia un'altra candidatura da candidato per testare il flusso completo" -ForegroundColor White
