# Supabase Edge Functions

## Funções Disponíveis

### 1. create_payment_intent

Cria uma intenção de pagamento Pix via SyncPay.

**Endpoint:** `POST /functions/v1/create_payment_intent`

**Headers:**
- `Authorization: Bearer <supabase_access_token>`

**Body:**
```json
{
  "session_id": "<uuid>"
}
```

**Response:**
```json
{
  "qr_code": "<base64_image_or_url>",
  "qr_code_payload": "<pix_copy_paste>",
  "payment_id": "<uuid>",
  "status": "PENDING"
}
```

### 2. syncpay_webhook

Webhook para receber notificações de pagamento do SyncPay.

**Endpoint:** `POST /functions/v1/syncpay_webhook?token=<webhook_token>`

**Query Params:**
- `token`: Token de validação do webhook

**Body:** Payload do SyncPay com informações do pagamento

### 3. core_job_update

Atualiza o estado de uma instância de PRD após o processamento (deploy finalizado).

**Endpoint:** `POST /functions/v1/core_job_update`

**Headers:**
- `x-mindsaas-secret`: Secret para autenticação (deve corresponder a `CORE_JOB_UPDATE_SECRET`)

**Body:**
```json
{
  "prd_id": "<uuid>",
  "state": "DELIVERED" | "FAILED",
  "delivered_url": "<url>" // opcional, apenas quando state === "DELIVERED"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Comportamento:**
- Atualiza `public.prd_instances` onde `id = prd_id` setando `state` e `updated_at = now()`
- Se `state === 'DELIVERED'` e `delivered_url` for fornecido, cria/atualiza registro em `public.deliveries` (se a tabela existir, caso contrário ignora)

### 4. builder_job_runner

Processa PRDs em estado `BUILD` e marca como `DELIVERED` chamando `core_job_update`.

**Endpoint:** `POST /functions/v1/builder_job_runner`

**Headers:**
- `x-mindsaas-admin`: Secret para autenticação (deve corresponder a `BUILDER_RUNNER_SECRET`)

**Body:** Nenhum (processa PRDs automaticamente)

**Response:**
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
      "success": false,
      "error": "core_job_update failed: 404 - PRD instance not found"
    }
  ]
}
```

**Comportamento:**
- Lista até 10 PRDs com `state = 'BUILD'`
- Para cada PRD, gera `delivered_url` mock e chama `core_job_update`
- Retorna estatísticas de processamento (processados, sucessos, falhas)

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no Supabase Dashboard (Settings > Edge Functions > Secrets):

### Para create_payment_intent:
- `SYNCPAY_BASE_URL`: URL base da API do SyncPay
- `SYNCPAY_CLIENT_ID`: Client ID do SyncPay
- `SYNCPAY_CLIENT_SECRET`: Client Secret do SyncPay
- `SUPABASE_URL`: URL do seu projeto Supabase (já configurado automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase (já configurado automaticamente)

### Para syncpay_webhook:
- `SYNC_PAY_WEBHOOK_TOKEN`: Token secreto para validar webhooks
- `SUPABASE_URL`: URL do seu projeto Supabase (já configurado automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase (já configurado automaticamente)

### Para core_job_update:
- `CORE_JOB_UPDATE_SECRET`: Secret para autenticação via header `x-mindsaas-secret`
- `SUPABASE_URL`: URL do seu projeto Supabase (já configurado automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase (já configurado automaticamente)

### Para builder_job_runner:
- `BUILDER_RUNNER_SECRET`: Secret para autenticação via header `x-mindsaas-admin`
- `CORE_JOB_UPDATE_SECRET`: Secret usado para chamar `core_job_update` (deve ser o mesmo valor configurado em `core_job_update`)
- `SUPABASE_URL`: URL do seu projeto Supabase (já configurado automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase (já configurado automaticamente)

## Deploy

Para fazer deploy das Edge Functions:

```bash
supabase functions deploy create_payment_intent
supabase functions deploy syncpay_webhook
supabase functions deploy core_job_update
supabase functions deploy builder_job_runner
```

## Estrutura do Banco de Dados

### Tabela: payments

```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id),
  session_id uuid,
  provider_transaction_id text,
  qr_code text,
  qr_code_payload text,
  status text DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
```

