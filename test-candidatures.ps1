# Test per verificare la collection candidatures
Write-Host "🔍 Testando la collection candidatures nel backend Strapi..." -ForegroundColor Yellow

# Test 1: Verifica se la collection candidatures esiste
Write-Host "`n1. Verificando se la collection candidatures esiste..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/candidatures" -Method GET -ContentType "application/json"
    Write-Host "✅ Collection candidatures esiste!" -ForegroundColor Green
    Write-Host "Struttura risposta: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Errore nel contattare candidatures: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "💡 La collection candidatures non esiste ancora. Deve essere creata nel backend Strapi." -ForegroundColor Yellow
    }
}

# Test 2: Verifica se la collection notifications esiste
Write-Host "`n2. Verificando se la collection notifications esiste..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method GET -ContentType "application/json"
    Write-Host "✅ Collection notifications esiste!" -ForegroundColor Green
    Write-Host "Struttura risposta: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Errore nel contattare notifications: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "💡 La collection notifications non esiste ancora. Deve essere creata nel backend Strapi." -ForegroundColor Yellow
    }
}

# Test 3: Verifica collection users-permissions (dovrebbe esistere)
Write-Host "`n3. Verificando se la collection users-permissions esiste..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/users" -Method GET -ContentType "application/json"
    Write-Host "✅ Collection users-permissions esiste!" -ForegroundColor Green
    Write-Host "Numero utenti trovati: $($response.length)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Errore nel contattare users: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Verifica collection annuncios
Write-Host "`n4. Verificando se la collection annuncios esiste..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/annuncios" -Method GET -ContentType "application/json"
    Write-Host "✅ Collection annuncios esiste!" -ForegroundColor Green
    Write-Host "Numero annunci trovati: $($response.data.length)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Errore nel contattare annuncios: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test completati. Controlla i risultati sopra per vedere quali collection esistono." -ForegroundColor Yellow
