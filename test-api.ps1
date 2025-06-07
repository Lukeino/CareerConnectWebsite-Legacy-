# Script PowerShell per testare le API del sistema di candidature
# Eseguire dopo aver configurato le collection nel backend Strapi

# Configurazione
$baseUrl = "http://localhost:1337/api"
$jwt = "" # Inserire qui il JWT token di un utente autenticato

# Headers comuni
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwt"
}

Write-Host "🔧 Test API CareerConnect - Sistema Candidature" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Funzione per testare una API
function Test-API {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers,
        [string]$Body = $null,
        [string]$Description
    )
    
    Write-Host "`n📡 Testing: $Description" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        
        Write-Host "✅ SUCCESS" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3 | Write-Host
        return $true
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Verifica se il JWT è stato inserito
if ([string]::IsNullOrEmpty($jwt)) {
    Write-Host "⚠️  ATTENZIONE: Inserire il JWT token nella variabile `$jwt" -ForegroundColor Red
    Write-Host "   Per ottenere un JWT, effettua il login da frontend o usa:" -ForegroundColor Yellow
    Write-Host "   POST $baseUrl/auth/local" -ForegroundColor Yellow
    Write-Host "   Body: {`"identifier`": `"your-email`", `"password`": `"your-password`"}" -ForegroundColor Yellow
    exit 1
}

# Test 1: Verifica collection candidatures
Test-API -Url "$baseUrl/candidatures" -Headers $headers -Description "Verifica collection candidatures"

# Test 2: Verifica collection notifications
Test-API -Url "$baseUrl/notifications" -Headers $headers -Description "Verifica collection notifications"

# Test 3: Verifica collection annuncios (dovrebbe già esistere)
Test-API -Url "$baseUrl/annuncios" -Headers $headers -Description "Verifica collection annuncios"

# Test 4: Verifica users (per le relazioni)
Test-API -Url "$baseUrl/users/me" -Headers $headers -Description "Verifica utente corrente"

Write-Host "`n🎯 Test completati!" -ForegroundColor Cyan

# Esempio di creazione candidatura (commentato)
<#
Write-Host "`n📝 Esempio creazione candidatura:" -ForegroundColor Yellow
$candidaturaExample = @{
    data = @{
        candidato = 1
        annuncio = 1
        cv = 1
        recruiter = 2
        stato = "inviata"
        data_candidatura = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 3

Write-Host $candidaturaExample -ForegroundColor Gray
# Test-API -Url "$baseUrl/candidatures" -Method "POST" -Headers $headers -Body $candidaturaExample -Description "Creazione candidatura di test"
#>

Write-Host "`n📋 Per usare questo script:" -ForegroundColor Cyan
Write-Host "1. Inserisci un JWT valido nella variabile `$jwt" -ForegroundColor White
Write-Host "2. Assicurati che il backend Strapi sia in esecuzione su localhost:1337" -ForegroundColor White
Write-Host "3. Esegui: .\test-api.ps1" -ForegroundColor White
