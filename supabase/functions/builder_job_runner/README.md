# Builder Job Runner

Edge Function que processa PRDs em estado `BUILD` e marca como `DELIVERED` chamando `core_job_update`.

## Funcionalidade

1. Lista até 10 PRDs com `state = 'BUILD'`
2. Para cada PRD, gera um `delivered_url` mock: `https://example.com/prd/<id>`
3. Chama `core_job_update` para atualizar o estado para `DELIVERED`
4. Retorna estatísticas de processamento (processados, sucessos, falhas)

## Autenticação

**Header obrigatório:**
- `x-mindsaas-admin`: Deve corresponder a `BUILDER_RUNNER_SECRET`

## Endpoint

```
POST /functions/v1/builder_job_runner
```

## Resposta

**Sucesso (200):**
```json
{
  "processed": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "id": "uuid-1",
      "success": true
    },
    {
      "id": "uuid-2",
      "success": true
    },
    {
      "id": "uuid-3",
      "success": false,
      "error": "core_job_update failed: 404 - PRD instance not found"
    }
  ]
}
```

**Nenhum PRD encontrado (200):**
```json
{
  "processed": 0,
  "successful": 0,
  "failed": 0,
  "results": [],
  "message": "No PRD instances with state BUILD found"
}
```

**Erro de autenticação (401):**
```json
{
  "error": "Unauthorized"
}
```

## Variáveis de Ambiente

Configure no Supabase Dashboard (Settings > Edge Functions > Secrets):

- `BUILDER_RUNNER_SECRET`: Secret para autenticação via header `x-mindsaas-admin`
- `CORE_JOB_UPDATE_SECRET`: Secret usado para chamar `core_job_update` (deve ser o mesmo valor configurado em `core_job_update`)
- `SUPABASE_URL`: URL do projeto (já configurado automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (já configurado automaticamente)

## Deploy

```bash
supabase functions deploy builder_job_runner
```

## Uso

Esta função deve ser chamada manualmente (por enquanto) para processar PRDs em estado `BUILD`. Pode ser integrada com:
- Cron jobs
- Webhooks
- Schedulers externos
- Chamadas manuais via API

