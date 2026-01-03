# Builder Job Runner - Documentação Final

## Resumo

Edge Function que processa automaticamente PRDs em estado `BUILD` e marca como `DELIVERED` chamando `core_job_update`.

## Funcionalidades

- ✅ Busca até N PRDs com `state = 'BUILD'` (default: 3, máximo: 20)
- ✅ Para cada PRD, simula build e gera `delivered_url` mock
- ✅ Chama `core_job_update` para atualizar o estado
- ✅ Retorna estatísticas: processados, sucessos e falhas
- ✅ Tratamento robusto de erros (continua mesmo se um falhar)

## Secrets Necessários

Configure no **Supabase Dashboard > Settings > Edge Functions > Secrets**:

1. **BUILDER_RUNNER_SECRET** - Secret para autenticação do runner
2. **CORE_JOB_UPDATE_SECRET** - Secret para chamar `core_job_update`
3. **SUPABASE_URL** - Configurado automaticamente
4. **SUPABASE_SERVICE_ROLE_KEY** - Configurado automaticamente

## Deploy

```powershell
# 1. Login (se necessário)
supabase login

# 2. Linkar projeto (se necessário)
supabase link --project-ref <project-ref>

# 3. Deploy
supabase functions deploy builder_job_runner
```

## Teste

### Edite TEST.ps1 com suas credenciais:

```powershell
$projectUrl = "https://<project-ref>.supabase.co"
$secret = "<seu-BUILDER_RUNNER_SECRET>"
```

### Execute:

```powershell
.\supabase\functions\builder_job_runner\TEST.ps1
```

### Ou use comando direto:

```powershell
$projectUrl = "https://<project-ref>.supabase.co"
$secret = "<seu-BUILDER_RUNNER_SECRET>"
$uri = "$projectUrl/functions/v1/builder_job_runner"
$headers = @{ 
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json" 
}
$body = @{ limit = 3 } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body $body
```

## Resposta

```json
{
  "ok": true,
  "processed": 3,
  "ids": ["uuid-1", "uuid-2", "uuid-3"],
  "failures": []
}
```

## Validação

1. ✅ Crie um PRD e force `state = 'BUILD'` (ou deixe chegar em BUILD via fluxo)
2. ✅ Execute o teste acima
3. ✅ Verifique no Supabase que `state` virou `DELIVERED` e `delivered_url` foi setada
4. ✅ Acesse `/building?prd=<id>` e confirme redirecionamento automático para `/done?prd=<id>`

## Estrutura de Arquivos

```
supabase/functions/builder_job_runner/
  index.ts          # Código da função (Deno Edge Runtime)
  TEST.ps1          # Script de teste PowerShell
  DEPLOY.md         # Guia completo de deploy
  QUICK_START.md    # Guia rápido
  README_FINAL.md   # Esta documentação
```

## Troubleshooting

### Erro: "unauthorized"
- Verifique se `BUILDER_RUNNER_SECRET` está configurado no dashboard
- Verifique se o header `x-mindsaas-admin` está sendo enviado corretamente

### Erro: "missing_env"
- Verifique se todos os secrets estão configurados:
  - `BUILDER_RUNNER_SECRET`
  - `CORE_JOB_UPDATE_SECRET`
  - `SUPABASE_URL` (automático)
  - `SUPABASE_SERVICE_ROLE_KEY` (automático)

### Falhas em `failures` array
- Verifique se `core_job_update` está deployado e funcionando
- Verifique se `CORE_JOB_UPDATE_SECRET` está correto
- Verifique os logs de `core_job_update` no dashboard

### Nenhum PRD processado
- Verifique se existem PRDs com `state = 'BUILD'` na tabela
- Verifique se o limite não está muito baixo (tente aumentar `limit` no body)

