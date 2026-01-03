# Teste Builder Job Runner - PowerShell
# Substitua os valores abaixo pelas suas credenciais

$projectUrl = "<SUPABASE_URL>"
$secret = "<BUILDER_RUNNER_SECRET>"
$uri = "$projectUrl/functions/v1/builder_job_runner"
$headers = @{ 
    "x-mindsaas-secret" = $secret
    "Content-Type" = "application/json" 
}
$body = @{ limit = 3; delivered_url_base = "http://localhost:3000/done" } | ConvertTo-Json

Write-Host "=== Teste Builder Job Runner ===" -ForegroundColor Cyan
Write-Host "URL: $uri" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body $body
    
    Write-Host "✓ Sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resultado:" -ForegroundColor Cyan
    Write-Host "  OK: $($response.ok)" -ForegroundColor $(if ($response.ok) { "Green" } else { "Red" })
    Write-Host "  Processados: $($response.processed)" -ForegroundColor Cyan
    Write-Host "  IDs processados: $($response.ids.Count)" -ForegroundColor Cyan
    
    if ($response.ids.Count -gt 0) {
        Write-Host ""
        Write-Host "IDs processados com sucesso:" -ForegroundColor Green
        foreach ($id in $response.ids) {
            Write-Host "  - $id" -ForegroundColor Gray
        }
    }
    
    if ($response.failures -and $response.failures.Count -gt 0) {
        Write-Host ""
        Write-Host "Falhas:" -ForegroundColor Red
        foreach ($failure in $response.failures) {
            Write-Host "  ID: $($failure.id)" -ForegroundColor Yellow
            Write-Host "    Erro: $($failure.error)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "JSON completo:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "✗ Erro!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalhes do erro:" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status Code: $statusCode" -ForegroundColor Red
    }
    
    Write-Host "  Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "  Resposta do servidor:" -ForegroundColor Yellow
        Write-Host "  $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Fim do Teste ===" -ForegroundColor Cyan
