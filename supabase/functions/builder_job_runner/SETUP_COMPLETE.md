# Setup Completo - Builder Job Runner

## Passo 1: Executar SQL no Supabase

Acesse **Supabase Dashboard > SQL Editor** e execute:

```sql
ALTER TABLE public.prd_instances
  ADD COLUMN IF NOT EXISTS delivered_url text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS build_started_at timestamptz;

-- Índice para acelerar polling por state
CREATE INDEX IF NOT EXISTS prd_instances_state_idx ON public.prd_instances(state);
```

**Arquivo:** `supabase/migrations/add_build_deliver_columns.sql`

## Passo 2: Atualizar Edge Function

A Edge Function `builder_job_runner` já foi atualizada com o código real.

**Verificar no Supabase Dashboard:**
1. Acesse **Edge Functions > builder_job_runner**
2. Verifique se o código está atualizado
3. Clique em **"Deploy updates"** se necessário

## Passo 3: Configurar Secrets

No **Supabase Dashboard > Settings > Edge Functions > Secrets**, verifique:

- ✅ `SUPABASE_URL` (automático)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (automático)
- ✅ `BUILDER_RUNNER_SECRET` (você precisa criar)

## Passo 4: Teste Manual (PowerShell)

```powershell
$projectUrl = "https://SEU-PROJECT-REF.supabase.co"
$secret = "COLE_AQUI_O_VALOR_DO_BUILDER_RUNNER_SECRET"
$headers = @{
  "Content-Type" = "application/json"
  "x-mindsaas-secret" = $secret
}
$body = @{ limit = 3; delivered_url_base = "http://localhost:3000/done" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$projectUrl/functions/v1/builder_job_runner" -Headers $headers -Body $body
```

**Resultado esperado:**
```json
{
  "ok": true,
  "processed": 3,
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

## Passo 5: Configurar Vercel Cron (Opcional)

### 5.1. Adicionar Variáveis de Ambiente na Vercel

1. Acesse **Vercel Dashboard > Seu Projeto > Settings > Environment Variables**
2. Adicione:
   - `BUILDER_RUNNER_SECRET` = (mesmo valor do Supabase)
   - `DELIVERED_URL_BASE` = (opcional, ex: `https://seu-dominio.com/done`)

### 5.2. Verificar vercel.json

O arquivo `vercel.json` na raiz do projeto já está configurado:

```json
{
  "crons": [
    {
      "path": "/api/cron/builder",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

Isso executa o cron a cada 2 minutos.

### 5.3. Deploy na Vercel

Após adicionar as variáveis de ambiente, faça o deploy:

```bash
# Se usar Vercel CLI
vercel --prod

# Ou faça push para o repositório conectado
git push origin main
```

## Validação Final

1. ✅ **Criar PRD em BUILD:**
   - Via fluxo `/pay` → `/building` (após pagamento)
   - Ou manualmente no Supabase: `UPDATE prd_instances SET state = 'BUILD' WHERE id = 'uuid'`

2. ✅ **Executar builder_job_runner:**
   - Manualmente via PowerShell (Passo 4)
   - Ou aguardar o cron da Vercel (a cada 2 minutos)

3. ✅ **Verificar no Supabase:**
   - `state` deve ser `DELIVERED`
   - `delivered_url` deve estar preenchido
   - `delivered_at` deve estar preenchido

4. ✅ **Testar redirecionamento:**
   - Acesse `/building?prd=<id>` no navegador
   - O polling deve detectar `DELIVERED` e redirecionar para `/done?prd=<id>`

## Troubleshooting

### Erro: "unauthorized"
- Verifique se `BUILDER_RUNNER_SECRET` está configurado no Supabase
- Verifique se o header `x-mindsaas-secret` está sendo enviado (não `x-mindsaas-admin`)

### Erro: "select_failed"
- Verifique se a tabela `prd_instances` existe
- Verifique se há PRDs com `state = 'BUILD'`

### Cron não executa
- Verifique se as variáveis de ambiente estão configuradas na Vercel
- Verifique se o `vercel.json` está na raiz do projeto
- Verifique os logs da Vercel: **Deployments > [deployment] > Functions > /api/cron/builder**

### Colunas não existem
- Execute o SQL do Passo 1 novamente
- Verifique se não há erros no SQL Editor

