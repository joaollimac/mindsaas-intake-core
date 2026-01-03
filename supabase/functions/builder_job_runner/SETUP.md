# Setup - Builder Job Runner

## Variáveis de Ambiente Necessárias

Configure no Supabase Dashboard (Settings > Edge Functions > Secrets):

### 1. BUILDER_RUNNER_SECRET
- **Descrição:** Secret para autenticação da função `builder_job_runner`
- **Uso:** Header `x-mindsaas-admin` nas requisições
- **Exemplo:** `my-super-secret-builder-key-12345`

### 2. CORE_JOB_UPDATE_SECRET
- **Descrição:** Secret usado para chamar `core_job_update` internamente
- **Uso:** Header `x-mindsaas-secret` ao chamar `core_job_update`
- **Importante:** Deve ser o **mesmo valor** configurado na função `core_job_update`
- **Exemplo:** `my-super-secret-core-update-key-67890`

### 3. Variáveis Automáticas
Estas são configuradas automaticamente pelo Supabase:
- `SUPABASE_URL`: URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key

## Passos de Configuração

1. **Acesse o Supabase Dashboard:**
   - Vá para Settings > Edge Functions > Secrets

2. **Adicione as variáveis:**
   - Clique em "Add new secret"
   - Nome: `BUILDER_RUNNER_SECRET`
   - Valor: (escolha um secret forte)
   - Repita para `CORE_JOB_UPDATE_SECRET`

3. **Atualize `core_job_update` (se necessário):**
   - Verifique se `core_job_update` está usando `CORE_JOB_UPDATE_SECRET`
   - Se ainda estiver usando `MINDSAAS_JOB_SECRET`, atualize o código

4. **Faça deploy:**
   ```bash
   supabase functions deploy core_job_update
   supabase functions deploy builder_job_runner
   ```

## Verificação

Após configurar, teste com:

```powershell
$supabaseUrl = "https://seu-projeto.supabase.co"
$secret = "seu-builder-runner-secret"

$headers = @{
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/builder_job_runner" `
    -Method POST `
    -Headers $headers
```

Se retornar JSON com `processed`, `successful`, `failed`, está funcionando!

