# Script per debuggare le collection e verificare gli ID
Write-Host "🔍 Debug delle Collection Strapi" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$baseUrl = "http://localhost:1337/api"

# Testa la collezione candidatoes
Write-Host "`n📋 Testando collection candidatoes..." -ForegroundColor Yellow
try {
    $candidatoesResponse = Invoke-RestMethod -Uri "$baseUrl/candidatoes" -Method Get
    Write-Host "✅ Collection candidatoes trovata!" -ForegroundColor Green
    Write-Host "📊 Numero di candidati: $($candidatoesResponse.data.Count)" -ForegroundColor Cyan
    
    if ($candidatoesResponse.data.Count -gt 0) {
        Write-Host "`n👤 Primi candidati nella collection:" -ForegroundColor Cyan
        $candidatoesResponse.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "  ID: $($_.id) - Nome: $($_.nome) $($_.cognome) - Username: $($_.username)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Errore nel testare candidatoes: $($_.Exception.Message)" -ForegroundColor Red
}

# Testa la collezione users (users-permissions)
Write-Host "`n📋 Testando collection users (users-permissions)..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get
    Write-Host "✅ Collection users trovata!" -ForegroundColor Green
    Write-Host "📊 Numero di utenti: $($usersResponse.Count)" -ForegroundColor Cyan
    
    if ($usersResponse.Count -gt 0) {
        Write-Host "`n👤 Primi utenti nella collection:" -ForegroundColor Cyan
        $usersResponse | Select-Object -First 3 | ForEach-Object {
            Write-Host "  ID: $($_.id) - Username: $($_.username) - Email: $($_.email) - Role: $($_.roleType)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Errore nel testare users: $($_.Exception.Message)" -ForegroundColor Red
}

# Testa la collezione annuncios
Write-Host "`n📋 Testando collection annuncios..." -ForegroundColor Yellow
try {
    $annunciosResponse = Invoke-RestMethod -Uri "$baseUrl/annuncios" -Method Get
    Write-Host "✅ Collection annuncios trovata!" -ForegroundColor Green
    Write-Host "📊 Numero di annunci: $($annunciosResponse.data.Count)" -ForegroundColor Cyan
    
    if ($annunciosResponse.data.Count -gt 0) {
        Write-Host "`n📝 Primi annunci nella collection:" -ForegroundColor Cyan
        $annunciosResponse.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "  ID: $($_.id) - Titolo: $($_.titolo) - Stato: $($_.stato)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Errore nel testare annuncios: $($_.Exception.Message)" -ForegroundColor Red
}

# Testa la collezione candidatures
Write-Host "`n📋 Testando collection candidatures..." -ForegroundColor Yellow
try {
    $candidaturesResponse = Invoke-RestMethod -Uri "$baseUrl/candidatures" -Method Get
    Write-Host "✅ Collection candidatures trovata!" -ForegroundColor Green
    Write-Host "📊 Numero di candidature: $($candidaturesResponse.data.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Errore nel testare candidatures: $($_.Exception.Message)" -ForegroundColor Red
}

# Testa la collezione recruiter-details
Write-Host "`n📋 Testando collection recruiter-details..." -ForegroundColor Yellow
try {
    $recruiterDetailsResponse = Invoke-RestMethod -Uri "$baseUrl/recruiter-details" -Method Get
    Write-Host "✅ Collection recruiter-details trovata!" -ForegroundColor Green
    Write-Host "📊 Numero di recruiter: $($recruiterDetailsResponse.data.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Errore nel testare recruiter-details: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Debug completato!" -ForegroundColor Green
Write-Host "💡 Usa queste informazioni per verificare gli ID corretti da usare nelle candidature." -ForegroundColor Yellow
