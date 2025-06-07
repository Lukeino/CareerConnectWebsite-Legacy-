# Test per verificare la funzionalità di ritiro candidatura

Write-Host "🔍 Test ritiro candidatura..." -ForegroundColor Cyan

try {
    # 1. Verifica candidature esistenti
    Write-Host "`n1. Verifica candidature esistenti..." -ForegroundColor Yellow
    $candidaturesResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/candidatures?populate=*" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    
    if ($candidaturesResponse.data -and $candidaturesResponse.data.Count -gt 0) {
        Write-Host "✅ Trovate $($candidaturesResponse.data.Count) candidature esistenti:" -ForegroundColor Green
        
        foreach ($candidatura in $candidaturesResponse.data) {
            Write-Host "  - ID: $($candidatura.id)" -ForegroundColor White
            Write-Host "    Candidato: $($candidatura.candidato?.nome) $($candidatura.candidato?.cognome)" -ForegroundColor White
            Write-Host "    Annuncio: $($candidatura.annuncio?.titolo)" -ForegroundColor White
            Write-Host "    Stato: $($candidatura.stato)" -ForegroundColor White
            Write-Host "    Data: $($candidatura.data_candidatura)" -ForegroundColor White
            Write-Host "" -ForegroundColor White
        }
        
        # 2. Simula il ritiro della prima candidatura
        if ($candidaturesResponse.data.Count -gt 0) {
            $candidaturaToDelete = $candidaturesResponse.data[0]
            Write-Host "2. Test ritiro candidatura ID: $($candidaturaToDelete.id)..." -ForegroundColor Yellow
            
            # Simula il processo che fa il frontend
            Write-Host "   📋 Candidatura da ritirare:" -ForegroundColor Blue
            Write-Host "     - ID Candidatura: $($candidaturaToDelete.id)" -ForegroundColor White
            Write-Host "     - Candidato: $($candidaturaToDelete.candidato?.nome) $($candidaturaToDelete.candidato?.cognome)" -ForegroundColor White
            Write-Host "     - Annuncio: $($candidaturaToDelete.annuncio?.titolo)" -ForegroundColor White
            
            # Test: prova a eliminare la candidatura
            Write-Host "   🗑️ Tentativo di eliminazione..." -ForegroundColor Blue
            
            $deleteResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/candidatures/$($candidaturaToDelete.id)" -Method DELETE -Headers @{
                "Content-Type" = "application/json"
            }
            
            Write-Host "✅ Candidatura eliminata con successo!" -ForegroundColor Green
            Write-Host "   Risposta server: $($deleteResponse | ConvertTo-Json -Depth 2)" -ForegroundColor White
            
            # 3. Verifica che sia stata davvero eliminata
            Write-Host "`n3. Verifica eliminazione..." -ForegroundColor Yellow
            
            try {
                $checkResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/candidatures/$($candidaturaToDelete.id)" -Method GET -Headers @{
                    "Content-Type" = "application/json"
                }
                Write-Host "❌ ERRORE: La candidatura esiste ancora!" -ForegroundColor Red
            } catch {
                Write-Host "✅ Confermato: candidatura eliminata dal database" -ForegroundColor Green
            }
            
            # 4. Verifica nuovo conteggio candidature
            Write-Host "`n4. Verifica nuovo conteggio..." -ForegroundColor Yellow
            $newCandidaturesResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/candidatures?populate=*" -Method GET -Headers @{
                "Content-Type" = "application/json"
            }
            
            $newCount = if ($newCandidaturesResponse.data) { $newCandidaturesResponse.data.Count } else { 0 }
            $oldCount = $candidaturesResponse.data.Count
            
            Write-Host "   Candidature prima: $oldCount" -ForegroundColor White
            Write-Host "   Candidature dopo: $newCount" -ForegroundColor White
            
            if ($newCount -eq ($oldCount - 1)) {
                Write-Host "✅ Test ritiro candidatura: SUCCESSO!" -ForegroundColor Green
            } else {
                Write-Host "❌ Test ritiro candidatura: FALLITO!" -ForegroundColor Red
            }
            
        } else {
            Write-Host "⚠️ Nessuna candidatura da testare" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "⚠️ Nessuna candidatura esistente per testare il ritiro" -ForegroundColor Yellow
        Write-Host "   Suggerimento: crea prima una candidatura usando il frontend" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ ERRORE durante il test!" -ForegroundColor Red
    Write-Host "Dettagli errore: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Corpo dell'errore: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Test ritiro candidatura completato!" -ForegroundColor Cyan
