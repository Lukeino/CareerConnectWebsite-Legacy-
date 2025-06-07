# Script per testare la creazione di candidature con la struttura corretta
Write-Host "🧪 Test Creazione Candidatura - CareerConnect" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:1337/api"

# Test 1: Verifica struttura collection candidatures
Write-Host "`n📋 Test 1: Verifica struttura collection candidatures" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/candidatures" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Collection candidatures accessibile" -ForegroundColor Green
    Write-Host "📊 Numero candidature esistenti: $($response.data.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Errore accesso collection candidatures: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Verifica collection candidato
Write-Host "`n👤 Test 2: Verifica collection candidato" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/candidatos" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Collection candidatos accessibile" -ForegroundColor Green
    Write-Host "📊 Numero candidati: $($response.data.Count)" -ForegroundColor Cyan
    
    if ($response.data.Count -gt 0) {
        Write-Host "👤 Primo candidato - ID: $($response.data[0].id)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Errore accesso collection candidatos: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verifica collection recruiter-details
Write-Host "`n👔 Test 3: Verifica collection recruiter-details" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/recruiter-details" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Collection recruiter-details accessibile" -ForegroundColor Green
    Write-Host "📊 Numero recruiter: $($response.data.Count)" -ForegroundColor Cyan
    
    if ($response.data.Count -gt 0) {
        Write-Host "👔 Primo recruiter - ID: $($response.data[0].id)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Errore accesso collection recruiter-details: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Verifica collection annuncios
Write-Host "`n📢 Test 4: Verifica collection annuncios" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/annuncios" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Collection annuncios accessibile" -ForegroundColor Green
    Write-Host "📊 Numero annunci: $($response.data.Count)" -ForegroundColor Cyan
    
    if ($response.data.Count -gt 0) {
        Write-Host "📢 Primo annuncio - ID: $($response.data[0].id), Titolo: $($response.data[0].titolo)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Errore accesso collection annuncios: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Simulazione creazione candidatura (senza effettivo invio)
Write-Host "`n🧪 Test 5: Simulazione struttura candidatura" -ForegroundColor Yellow

$candidaturaSimulata = @{
    data = @{
        candidato = 1
        annuncio = 1  
        recruiter = 1
        stato = "inviata"
        data_candidatura = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        note = "Candidatura di test"
    }
} | ConvertTo-Json -Depth 3

Write-Host "📝 Struttura candidatura simulata:" -ForegroundColor Cyan
Write-Host $candidaturaSimulata -ForegroundColor Gray

Write-Host "`n✅ Test completato! Verifica i risultati sopra prima di testare la candidatura reale." -ForegroundColor Green
Write-Host "💡 Suggerimento: Se tutti i test sono verdi, prova a candidarti nell'applicazione." -ForegroundColor Blue
