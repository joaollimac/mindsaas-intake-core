# Exemplos de Teste - Builder Job Runner

## Variáveis de Ambiente Necessárias

Antes de testar, configure no Supabase Dashboard:
- `BUILDER_RUNNER_SECRET`: Secret para autenticação
- `CORE_JOB_UPDATE_SECRET`: Secret para chamar `core_job_update`

## Teste Local (Supabase CLI)

```bash
# Defina as variáveis de ambiente
export BUILDER_RUNNER_SECRET="seu-secret-aqui"
export CORE_JOB_UPDATE_SECRET="seu-secret-aqui"

# Execute a função localmente
supabase functions serve builder_job_runner

# Em outro terminal, teste com curl
curl -X POST http://localhost:54321/functions/v1/builder_job_runner \
  -H "x-mindsaas-admin: seu-secret-aqui" \
  -H "Content-Type: application/json"
```

## Teste Remoto (PowerShell)

### Exemplo 1: Teste Básico

```powershell
$supabaseUrl = "https://seu-projeto.supabase.co"
$secret = "seu-builder-runner-secret"

$headers = @{
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/builder_job_runner" `
    -Method POST `
    -Headers $headers

$response | ConvertTo-Json -Depth 10
```

### Exemplo 2: Com Tratamento de Erros

```powershell
$supabaseUrl = "https://seu-projeto.supabase.co"
$secret = "seu-builder-runner-secret"

$headers = @{
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/builder_job_runner" `
        -Method POST `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "Processados: $($response.processed)" -ForegroundColor Green
    Write-Host "Sucessos: $($response.successful)" -ForegroundColor Green
    Write-Host "Falhas: $($response.failed)" -ForegroundColor $(if ($response.failed -gt 0) { "Red" } else { "Green" })
    
    if ($response.results) {
        Write-Host "`nDetalhes:" -ForegroundColor Cyan
        $response.results | ForEach-Object {
            $status = if ($_.success) { "✓" } else { "✗" }
            $color = if ($_.success) { "Green" } else { "Red" }
            Write-Host "  $status $($_.id)" -ForegroundColor $color
            if ($_.error) {
                Write-Host "    Erro: $($_.error)" -ForegroundColor Yellow
            }
        }
    }
    
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro ao chamar builder_job_runner:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
```

### Exemplo 3: Teste com Autenticação Inválida

```powershell
$supabaseUrl = "https://seu-projeto.supabase.co"

$headers = @{
    "x-mindsaas-admin" = "secret-invalido"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/builder_job_runner" `
        -Method POST `
        -Headers $headers `
        -ErrorAction Stop
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Mensagem: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    # Deve retornar 401 Unauthorized
}
```

## Teste com cURL (Alternativa)

### Windows (Git Bash ou WSL)

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/builder_job_runner \
  -H "x-mindsaas-admin: seu-secret-aqui" \
  -H "Content-Type: application/json"
```

## Checklist de Teste

1. **Criar PRD em BUILD:**
   - Via fluxo `/pay` -> `/building` (após pagamento)
   - Ou manualmente no Supabase Table Editor:
     ```sql
     UPDATE prd_instances 
     SET state = 'BUILD' 
     WHERE id = 'seu-prd-id';
     ```

2. **Executar builder_job_runner:**
   - Use um dos exemplos acima

3. **Verificar resultado:**
   - No Supabase Table Editor, verifique se `state` mudou para `DELIVERED`
   - Se a coluna `delivered_url` existir, verifique se foi preenchida com `https://example.com/prd/<id>`

4. **Testar redirecionamento:**
   - Acesse `/building?prd=<id>` no navegador
   - O polling deve detectar `DELIVERED` e redirecionar para `/done?prd=<id>`

5. **Testar múltiplos PRDs:**
   - Crie 2-3 PRDs em BUILD
   - Execute o runner
   - Verifique que todos foram processados (sucessos e falhas reportados)

## Troubleshooting

### Erro 401 Unauthorized
- Verifique se `BUILDER_RUNNER_SECRET` está configurado corretamente
- Verifique se o header `x-mindsaas-admin` está sendo enviado

### Erro 500 Internal Server Error
- Verifique se `CORE_JOB_UPDATE_SECRET` está configurado
- Verifique os logs da Edge Function no Supabase Dashboard

### PRDs não são atualizados
- Verifique se `core_job_update` está deployado e funcionando
- Verifique se `CORE_JOB_UPDATE_SECRET` é o mesmo em ambas as funções
- Verifique os logs de `builder_job_runner` para ver erros específicos

