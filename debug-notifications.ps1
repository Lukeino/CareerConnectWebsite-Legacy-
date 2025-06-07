# Test per diagnosticare i problemi delle notifiche

Write-Host "🔍 Diagnosi problemi notifiche..." -ForegroundColor Cyan

try {
    # 1. Verifica utenti nel sistema
    Write-Host "`n1. Verifica utenti recruiters..." -ForegroundColor Yellow
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/users" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    
    $recruiters = $usersResponse | Where-Object { $_.roleType -eq "recruiter" }
    
    if ($recruiters) {
        Write-Host "✅ Recruiters trovati:" -ForegroundColor Green
        foreach ($recruiter in $recruiters) {
            Write-Host "  - ID: $($recruiter.id), Email: $($recruiter.email)" -ForegroundColor White
        }
        
        $testRecruiter = $recruiters[0]
        Write-Host "`nUsando recruiter di test: ID=$($testRecruiter.id), Email=$($testRecruiter.email)" -ForegroundColor Cyan
        
        # 2. Verifica notifiche esistenti per questo recruiter
        Write-Host "`n2. Verifica notifiche esistenti per il recruiter..." -ForegroundColor Yellow
        $notificationsUrl = "http://localhost:1337/api/notifications?filters[recipient][id][$eq]=$($testRecruiter.id)&populate=recipient"
        Write-Host "URL: $notificationsUrl" -ForegroundColor Gray
        
        $notificationsResponse = Invoke-RestMethod -Uri $notificationsUrl -Method GET -Headers @{
            "Content-Type" = "application/json"
        }
        
        if ($notificationsResponse.data -and $notificationsResponse.data.Count -gt 0) {
            Write-Host "✅ Trovate $($notificationsResponse.data.Count) notifiche totali:" -ForegroundColor Green
            
            foreach ($notif in $notificationsResponse.data) {
                Write-Host "  - ID: $($notif.id)" -ForegroundColor White
                Write-Host "    Title: $($notif.title)" -ForegroundColor White
                Write-Host "    Read: $($notif.read)" -ForegroundColor $(if($notif.read) {"Green"} else {"Red"})
                Write-Host "    Recipient ID: $($notif.recipient?.id)" -ForegroundColor White
                Write-Host "    Created: $($notif.createdAt)" -ForegroundColor White
                Write-Host "" -ForegroundColor White
            }
            
            # 3. Test solo notifiche non lette
            Write-Host "3. Test query solo notifiche NON LETTE..." -ForegroundColor Yellow
            $unreadUrl = "http://localhost:1337/api/notifications?filters[recipient][id][$eq]=$($testRecruiter.id)&filters[read][$eq]=false&sort=createdAt:desc"
            Write-Host "URL non lette: $unreadUrl" -ForegroundColor Gray
            
            $unreadResponse = Invoke-RestMethod -Uri $unreadUrl -Method GET -Headers @{
                "Content-Type" = "application/json"
            }
            
            Write-Host "✅ Notifiche non lette: $($unreadResponse.data.Count)" -ForegroundColor Green
            
            if ($unreadResponse.data.Count -gt 0) {
                # 4. Test marcatura come letta di una notifica
                Write-Host "`n4. Test marcatura come letta..." -ForegroundColor Yellow
                $notifToMark = $unreadResponse.data[0]
                Write-Host "Segnando notifica ID $($notifToMark.id) come letta..." -ForegroundColor Blue
                
                $markReadData = @{
                    data = @{
                        read = $true
                    }
                } | ConvertTo-Json -Depth 3
                
                $markResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$($notifToMark.id)" -Method PUT -Body $markReadData -Headers @{
                    "Content-Type" = "application/json"
                }
                
                Write-Host "✅ Notifica segnata come letta" -ForegroundColor Green
                
                # 5. Verifica che ora sia letta
                Write-Host "`n5. Verifica che sia stata marcata come letta..." -ForegroundColor Yellow
                $verifyResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications/$($notifToMark.id)" -Method GET -Headers @{
                    "Content-Type" = "application/json"
                }
                
                Write-Host "Stato read dopo update: $($verifyResponse.data.read)" -ForegroundColor $(if($verifyResponse.data.read) {"Green"} else {"Red"})
                
                # 6. Verifica nuovo conteggio notifiche non lette
                Write-Host "`n6. Nuovo conteggio notifiche non lette..." -ForegroundColor Yellow
                $newUnreadResponse = Invoke-RestMethod -Uri $unreadUrl -Method GET -Headers @{
                    "Content-Type" = "application/json"
                }
                
                Write-Host "Notifiche non lette ora: $($newUnreadResponse.data.Count)" -ForegroundColor Green
            }
            
        } else {
            Write-Host "⚠️ Nessuna notifica trovata per questo recruiter" -ForegroundColor Yellow
            
            # Creiamo una notifica di test
            Write-Host "`n🔧 Creando notifica di test..." -ForegroundColor Blue
            $testNotificationData = @{
                data = @{
                    recipient = $testRecruiter.id
                    type = "test"
                    title = "Test notifica debug"
                    message = "Questa è una notifica di test per il debug"
                    read = $false
                    publishedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                }
            } | ConvertTo-Json -Depth 3
            
            $createResponse = Invoke-RestMethod -Uri "http://localhost:1337/api/notifications" -Method POST -Body $testNotificationData -Headers @{
                "Content-Type" = "application/json"
            }
            
            Write-Host "✅ Notifica di test creata con ID: $($createResponse.data.id)" -ForegroundColor Green
        }
        
    } else {
        Write-Host "❌ Nessun recruiter trovato!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ ERRORE durante la diagnosi!" -ForegroundColor Red
    Write-Host "Dettagli errore: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Corpo dell'errore: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Diagnosi completata!" -ForegroundColor Cyan
