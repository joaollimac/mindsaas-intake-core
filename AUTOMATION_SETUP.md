# Automação PAY→BUILD→DELIVERED (sem n8n)

## Visão Geral

Este setup automatiza o fluxo completo:
1. **PAY → BUILD**: Quando o webhook de pagamento confirma o pagamento
2. **BUILD → DELIVERED**: Via cron que executa a cada 1 minuto
3. **Redirecionamentos**: Polling automático no front-end

## Parte A: PAY → BUILD (syncpay_webhook)

### O que foi implementado

O `syncpay_webhook` agora:
- Verifica o estado atual do PRD antes de atualizar (idempotência)
- Só atualiza para `BUILD` se o estado atual for `PAY` (não regride estado)
- Seta `build_started_at` com a data/hora atual
- Loga a transição de estado com `prd_instance_id`

### Arquivo atualizado
- `supabase/functions/syncpay_webhook/index.ts`

### Deploy
```bash
supabase functions deploy syncpay_webhook
```

## Parte B: BUILD → DELIVERED (Vercel Cron)

### O que foi implementado

1. **Endpoint de cron**: `apps/core/app/api/cron/builder/route.ts`
   - Protegido por `CRON_SECRET` via header `Authorization: Bearer <token>`
   - Chama `builder_job_runner` com headers corretos
   - Loga execuções e resultados

2. **Configuração Vercel**: `vercel.json`
   - Executa a cada 1 minuto (`*/1 * * * *`)

### Variáveis de Ambiente na Vercel

Configure em **Vercel Dashboard > Project Settings > Environment Variables**:

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `CRON_SECRET` | Secret para proteger o endpoint cron | Sim |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do Supabase | Sim |
| `BUILDER_RUNNER_SECRET` | Mesmo valor configurado no Supabase | Sim |
| `DELIVERED_URL_BASE` | Base URL para delivered_url (ex: `https://seu-dominio.com/done`) | Não |

### Deploy na Vercel
```bash
# Via Vercel CLI
vercel --prod

# Ou push para o repositório
git push origin main
```

## Parte C: Polling do Front-end

### Já implementado e funcionando

1. **`/pay`**: 
   - Polling a cada 3 segundos
   - Quando `state === 'BUILD'` → redireciona para `/building?prd=<id>`
   - Quando `state === 'DELIVERED'` → redireciona para `/done?prd=<id>`

2. **`/building`**:
   - Polling a cada 2.5 segundos
   - Quando `state === 'DELIVERED'` → redireciona para `/done?prd=<id>`

## Checklist de Validação

### Pré-requisitos
- [ ] SQL de migration executado (colunas `delivered_url`, `delivered_at`, `build_started_at`, `error_message`)
- [ ] `syncpay_webhook` deployado no Supabase
- [ ] `builder_job_runner` deployado no Supabase
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy na Vercel com `vercel.json`

### Teste do Fluxo Completo

1. **Criar PRD via fluxo normal**:
   - Acesse `/start` → preencha o quiz → chegue em `/pay`
   - O PRD deve estar em estado `PAY`

2. **Simular confirmação de pagamento**:
   ```powershell
   # Ou use o webhook real do SyncPay
   # O estado deve mudar para BUILD automaticamente
   ```

3. **Verificar transição PAY → BUILD**:
   - No Supabase, verifique que `state = 'BUILD'` e `build_started_at` está preenchido
   - `/pay` deve redirecionar automaticamente para `/building`

4. **Aguardar cron executar**:
   - O cron executa a cada 1 minuto
   - Verifique logs na Vercel: **Deployments > [deployment] > Functions > /api/cron/builder**

5. **Verificar transição BUILD → DELIVERED**:
   - No Supabase, verifique que `state = 'DELIVERED'` e `delivered_at` está preenchido
   - `/building` deve redirecionar automaticamente para `/done`

### Teste Manual do Cron

```powershell
# Se quiser testar o cron manualmente
$cronSecret = "SEU_CRON_SECRET"
$appUrl = "https://seu-app.vercel.app"

$headers = @{
    "Authorization" = "Bearer $cronSecret"
}

Invoke-RestMethod -Uri "$appUrl/api/cron/builder" -Method GET -Headers $headers
```

## Logs e Debugging

### Logs do syncpay_webhook
- Supabase Dashboard > Edge Functions > syncpay_webhook > Logs
- Procure por: `[syncpay_webhook] PRD xxx transitioned from PAY to BUILD`

### Logs do builder_job_runner
- Supabase Dashboard > Edge Functions > builder_job_runner > Logs

### Logs do Cron
- Vercel Dashboard > Deployments > [deployment] > Functions > /api/cron/builder

## Troubleshooting

### Webhook não muda estado para BUILD
- Verifique se o pagamento está sendo confirmado com status `paid` ou `PAID`
- Verifique se `session_id` ou `metadata.session_id` está presente no payload
- Verifique os logs do webhook no Supabase

### Cron não executa
- Verifique se `vercel.json` está na raiz do projeto deployado
- Verifique se as variáveis de ambiente estão configuradas
- Verifique os logs de cron na Vercel

### PRD não muda de BUILD para DELIVERED
- Verifique se `BUILDER_RUNNER_SECRET` está igual no Supabase e na Vercel
- Execute o builder_job_runner manualmente para testar
- Verifique os logs

### Redirecionamento não funciona
- Verifique se o polling está rodando (console.log no DevTools)
- Verifique se há erros de RLS no Supabase
- Verifique se a sessão anônima está ativa

