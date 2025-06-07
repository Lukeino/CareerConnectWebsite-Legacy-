# Script per verificare lo stato del backend Strapi
Write-Host "🔍 Verificando lo stato del backend Strapi..." -ForegroundColor Yellow

# Test connessione al backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/annuncios" -Method GET
    Write-Host "✅ Backend raggiungibile!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend non raggiungibile. Assicurati che Strapi sia avviato su localhost:1337" -ForegroundColor Red
    Write-Host "Per avviare il backend, vai in C:\Users\LucaI\Desktop\CareerConnectStrapi\CareerConnectStrapi e esegui 'npm run develop'" -ForegroundColor Yellow
    exit 1
}

# Test collection candidatures
Write-Host "🔍 Verificando collection 'candidatures'..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/candidatures" -Method GET
    Write-Host "✅ Collection 'candidatures' trovata!" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "❌ Collection 'candidatures' NON trovata!" -ForegroundColor Red
        Write-Host "📝 Devi creare la collection 'candidatures' nel backend Strapi" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ Errore nella verifica: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test collection notifications
Write-Host "🔍 Verificando collection 'notifications'..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method GET
    Write-Host "✅ Collection 'notifications' trovata!" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "❌ Collection 'notifications' NON trovata!" -ForegroundColor Red
        Write-Host "📝 Devi creare la collection 'notifications' nel backend Strapi" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ Errore nella verifica: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 Riepilogo:" -ForegroundColor Cyan
Write-Host "1. Se il backend non è raggiungibile, avvialo con 'npm run develop'" -ForegroundColor White
Write-Host "2. Se le collection non esistono, segui le istruzioni in BACKEND_SETUP_INSTRUCTIONS.md" -ForegroundColor White
Write-Host "3. Una volta create le collection, riprova la candidatura" -ForegroundColor White
