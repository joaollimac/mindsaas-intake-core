# Deploy - Builder Job Runner

## Pré-requisitos

### 1. Instalar Supabase CLI

**Windows (PowerShell):**
```powershell
# Via Scoop (recomendado)
scoop install supabase

# Ou via npm
npm install -g supabase
```

**Verificar instalação:**
```powershell
supabase --version
```

### 2. Login no Supabase

```powershell
supabase login
```

Isso abrirá o navegador para autenticação. Após login, você estará autenticado.

### 3. Linkar o projeto

```powershell
# Navegue até a pasta do projeto
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor"

# Linke o projeto (substitua <project-ref> pelo seu project reference)
supabase link --project-ref <project-ref>
```

**Onde encontrar o Project Reference:**
- Acesse: https://supabase.com/dashboard
- Selecione seu projeto
- Vá em **Settings > General**
- Copie o **Reference ID** (ex: `snvkcfjoayexovgvwsmp`)

## Configurar Secrets no Dashboard

### Passo 1: Acessar Edge Functions Secrets

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings > Edge Functions**
4. Role até a seção **Secrets**

### Passo 2: Adicionar Secrets

Clique em **"Add new secret"** e adicione:

#### Secret 1: `BUILDER_RUNNER_SECRET`
- **Nome:** `BUILDER_RUNNER_SECRET`
- **Valor:** Escolha um secret forte (ex: `my-super-secret-builder-key-2024`)
- **Descrição:** Secret para autenticação do builder_job_runner

#### Secret 2: `CORE_JOB_UPDATE_SECRET` (opcional, se for usar core_job_update)
- **Nome:** `CORE_JOB_UPDATE_SECRET`
- **Valor:** Escolha um secret forte (ex: `my-super-secret-core-update-key-2024`)
- **Descrição:** Secret para chamar core_job_update (se necessário)

**Nota:** Os secrets `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são configurados automaticamente pelo Supabase.

## Deploy da Função

### Deploy via CLI (PowerShell)

```powershell
# Navegue até a pasta do projeto
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor"

# Faça o deploy
supabase functions deploy builder_job_runner
```

**Nota:** Se você ainda não linkou o projeto, faça primeiro:
```powershell
supabase link --project-ref <seu-project-ref>
```

**Saída esperada:**
```
Deploying builder_job_runner...
Deployed Function builder_job_runner (https://<project-ref>.supabase.co/functions/v1/builder_job_runner)
```

### Verificar Deploy

```powershell
# Listar funções deployadas
supabase functions list
```

## Testar a Função

### Obter Credenciais

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings > API**
4. Copie:
   - **Project URL** (ex: `https://snvkcfjoayexovgvwsmp.supabase.co`)
   - **anon public** key (para o header `apikey`)

### Comando de Teste (PowerShell)

**Opção 1: Usando o script TEST.ps1**

Edite o arquivo `supabase/functions/builder_job_runner/TEST.ps1` com suas credenciais e execute:

```powershell
.\supabase\functions\builder_job_runner\TEST.ps1
```

**Opção 2: Comando direto**

```powershell
# Defina as variáveis
$projectUrl = "https://<project-ref>.supabase.co"
$secret = "<seu-BUILDER_RUNNER_SECRET>"
$uri = "$projectUrl/functions/v1/builder_job_runner"
$headers = @{ 
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json" 
}
$body = @{ limit = 3 } | ConvertTo-Json

# Chamar a função
Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body $body
```

**Exemplo com valores:**
```powershell
$projectUrl = "https://snvkcfjoayexovgvwsmp.supabase.co"
$secret = "my-super-secret-builder-key-2024"
$uri = "$projectUrl/functions/v1/builder_job_runner"
$headers = @{ 
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json" 
}
$body = @{ limit = 3 } | ConvertTo-Json

$response = Invoke-RestMethod -Method POST -Uri $uri -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
```

### Exemplo Completo com Valores

```powershell
$supabaseUrl = "https://snvkcfjoayexovgvwsmp.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$secret = "my-super-secret-builder-key-2024"

$headers = @{
    "apikey" = $anonKey
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/builder_job_runner" `
    -Method POST `
    -Headers $headers
```

## Resposta Esperada

**Sucesso:**
```json
{
  "ok": true,
  "processed": 3,
  "ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "failures": []
}
```

**Com falhas:**
```json
{
  "ok": true,
  "processed": 2,
  "ids": [
    "uuid-1",
    "uuid-2"
  ],
  "failures": [
    {
      "id": "uuid-3",
      "error": "core_job_update_failed:404:{\"error\":\"PRD instance not found\"}"
    }
  ]
}
```

**Nenhum PRD encontrado:**
```json
{
  "ok": true,
  "processed": 0,
  "ids": [],
  "failures": []
}
```

**Erro de autenticação:**
```json
{
  "error": "Unauthorized"
}
```

## Troubleshooting

### Erro: "Function not found"
- Verifique se o deploy foi concluído: `supabase functions list`
- Verifique se está usando o project-ref correto

### Erro: "Unauthorized"
- Verifique se o secret `BUILDER_RUNNER_SECRET` está configurado no dashboard
- Verifique se o header `x-mindsaas-admin` está sendo enviado corretamente
- Verifique se o valor do secret no código corresponde ao do dashboard

### Erro: "Failed to fetch PRD instances"
- Verifique se a tabela `prd_instances` existe
- Verifique se há PRDs com `state = 'BUILD'`
- Verifique os logs da função no dashboard: **Edge Functions > builder_job_runner > Logs**

### Ver Logs da Função

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Edge Functions**
4. Clique em **builder_job_runner**
5. Vá na aba **Logs**

