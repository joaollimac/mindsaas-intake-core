# Quick Start - Builder Job Runner

## Resumo Rápido

Esta função processa PRDs em estado `BUILD` e marca como `DELIVERED` automaticamente.

## Passos Rápidos

### 1. Instalar Supabase CLI (se ainda não tiver)

```powershell
# Via npm (recomendado)
npm install -g supabase

# Verificar
supabase --version
```

### 2. Login no Supabase

```powershell
supabase login
```

### 3. Linkar Projeto

```powershell
# Substitua <project-ref> pelo seu Reference ID
# Encontre em: Dashboard > Settings > General > Reference ID
supabase link --project-ref <project-ref>
```

**Exemplo:**
```powershell
supabase link --project-ref snvkcfjoayexovgvwsmp
```

### 4. Configurar Secrets no Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings > Edge Functions > Secrets**
4. Adicione:
   - **Nome:** `BUILDER_RUNNER_SECRET`
   - **Valor:** (escolha um secret forte)

### 5. Deploy

```powershell
supabase functions deploy builder_job_runner
```

### 6. Testar

Edite o arquivo `test.ps1` com suas credenciais e execute:

```powershell
.\supabase\functions\builder_job_runner\test.ps1
```

Ou use o comando direto:

```powershell
$supabaseUrl = "https://<project-ref>.supabase.co"
$anonKey = "<sua-anon-key>"
$secret = "<seu-BUILDER_RUNNER_SECRET>"

$headers = @{
    "apikey" = $anonKey
    "x-mindsaas-admin" = $secret
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/builder_job_runner" `
    -Method POST `
    -Headers $headers
```

## Onde Encontrar as Credenciais

### Project URL e Anon Key
1. Dashboard > Settings > API
2. Copie:
   - **Project URL** → `$supabaseUrl`
   - **anon public** → `$anonKey`

### Project Reference ID
1. Dashboard > Settings > General
2. Copie o **Reference ID** → use no `supabase link`

### Secrets
1. Dashboard > Settings > Edge Functions > Secrets
2. O valor que você configurou → `$secret`

## Estrutura de Arquivos

```
supabase/
  functions/
    builder_job_runner/
      index.ts          # Código da função
      DEPLOY.md         # Guia completo de deploy
      QUICK_START.md    # Este arquivo
      test.ps1          # Script de teste PowerShell
```

## Próximos Passos

Após deploy bem-sucedido:
1. Crie PRDs em estado `BUILD` (via fluxo `/pay` → `/building`)
2. Execute a função `builder_job_runner`
3. Verifique no Supabase que os PRDs foram marcados como `DELIVERED`
4. Acesse `/building?prd=<id>` e veja o redirecionamento automático para `/done`

