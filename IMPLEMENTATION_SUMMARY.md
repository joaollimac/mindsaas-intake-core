# Resumo da Implementação - Builder Job Runner

## ✅ Arquivos Criados/Atualizados

### 1. Schema do Banco
- **Arquivo:** `supabase/migrations/add_build_deliver_columns.sql`
- **Ação:** Execute no Supabase Dashboard > SQL Editor
- **Adiciona colunas:**
  - `delivered_url` (text)
  - `error_message` (text)
  - `delivered_at` (timestamptz)
  - `build_started_at` (timestamptz)
- **Cria índice:** `prd_instances_state_idx` para otimizar queries por `state`

### 2. Edge Function Builder Job Runner
- **Arquivo:** `supabase/functions/builder_job_runner/index.ts`
- **Atualizado com código real:**
  - Autenticação via `x-mindsaas-secret` header
  - Busca PRDs em `state = 'BUILD'`
  - Atualiza diretamente na tabela (não chama `core_job_update`)
  - Suporta `limit` e `delivered_url_base` no body
  - Retorna `{ ok: true, processed: N, ids: [...] }`

### 3. Endpoint Cron Next.js
- **Arquivo:** `apps/core/app/api/cron/builder/route.ts`
- **Função:** Chama `builder_job_runner` automaticamente
- **Método:** GET (para Vercel Cron)

### 4. Configuração Vercel
- **Arquivo:** `vercel.json` (raiz do projeto)
- **Configuração:** Cron executa a cada 2 minutos (`*/2 * * * *`)

### 5. Documentação
- **Arquivo:** `supabase/functions/builder_job_runner/SETUP_COMPLETE.md`
- **Conteúdo:** Guia completo passo a passo

## 📋 Checklist de Implementação

### Passo 1: Executar SQL
- [ ] Acessar Supabase Dashboard > SQL Editor
- [ ] Executar `supabase/migrations/add_build_deliver_columns.sql`
- [ ] Verificar se as colunas foram criadas

### Passo 2: Atualizar Edge Function
- [ ] Acessar Supabase Dashboard > Edge Functions > builder_job_runner
- [ ] Verificar se o código está atualizado
- [ ] Clicar em "Deploy updates" se necessário

### Passo 3: Configurar Secrets
- [ ] Acessar Supabase Dashboard > Settings > Edge Functions > Secrets
- [ ] Verificar/criar `BUILDER_RUNNER_SECRET`
- [ ] Verificar `SUPABASE_URL` (automático)
- [ ] Verificar `SUPABASE_SERVICE_ROLE_KEY` (automático)

### Passo 4: Teste Manual
- [ ] Editar `supabase/functions/builder_job_runner/TEST.ps1` com credenciais
- [ ] Executar o script PowerShell
- [ ] Verificar resposta: `{ ok: true, processed: N, ids: [...] }`
- [ ] Verificar no Supabase que PRDs foram marcados como `DELIVERED`

### Passo 5: Configurar Vercel Cron (Opcional)
- [ ] Adicionar variáveis de ambiente na Vercel:
  - `BUILDER_RUNNER_SECRET`
  - `DELIVERED_URL_BASE` (opcional)
- [ ] Fazer deploy na Vercel
- [ ] Verificar logs do cron em Vercel Dashboard

## 🔧 Comandos Úteis

### Teste Manual (PowerShell)
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

### Deploy Edge Function
```powershell
supabase functions deploy builder_job_runner
```

### Deploy Vercel
```powershell
vercel --prod
# ou
git push origin main
```

## 📊 Fluxo Completo

1. **Usuário paga** → `/pay` → Webhook marca `state = 'BUILD'`
2. **Builder Job Runner** (manual ou cron) busca PRDs em `BUILD`
3. **Atualiza diretamente** na tabela:
   - `state = 'DELIVERED'`
   - `delivered_at = now()`
   - `delivered_url = <base>?prd=<id>`
4. **Polling em `/building`** detecta `DELIVERED`
5. **Redireciona** para `/done?prd=<id>`

## 🐛 Troubleshooting

### Erro: "unauthorized"
- Verificar se `BUILDER_RUNNER_SECRET` está configurado
- Verificar se header é `x-mindsaas-secret` (não `x-mindsaas-admin`)

### Erro: "select_failed"
- Verificar se tabela `prd_instances` existe
- Verificar se há PRDs com `state = 'BUILD'`

### Cron não executa
- Verificar variáveis de ambiente na Vercel
- Verificar se `vercel.json` está na raiz
- Verificar logs em Vercel Dashboard

### Colunas não existem
- Executar SQL novamente
- Verificar erros no SQL Editor

## 📝 Notas Importantes

- O header mudou de `x-mindsaas-admin` para `x-mindsaas-secret`
- A função agora atualiza diretamente na tabela (não chama `core_job_update`)
- O cron da Vercel executa a cada 2 minutos
- O `delivered_url_base` é opcional no body

