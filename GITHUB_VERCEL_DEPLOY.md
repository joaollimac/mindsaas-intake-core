# Deploy para GitHub + Vercel

## Pré-requisitos

### Verificar Git instalado
```powershell
git --version
```

Se não estiver instalado:
1. Baixe em: https://git-scm.com/download/win
2. Execute o instalador (aceite as opções padrão)
3. Reinicie o PowerShell após a instalação

### Verificar autenticação GitHub
```powershell
# Testar conexão com GitHub
git ls-remote https://github.com/SEU-USUARIO/qualquer-repo.git
```

---

## Parte 1: Subir para GitHub

### Passo 1: Criar repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name:** `mindsaas-intake` (ou nome de sua preferência)
3. **Description:** (opcional)
4. **Visibility:** Private ou Public
5. ⚠️ **IMPORTANTE:** NÃO marque "Add a README file"
6. ⚠️ **IMPORTANTE:** NÃO adicione .gitignore ou license
7. Clique em **"Create repository"**
8. Copie a URL HTTPS do repositório (ex: `https://github.com/SEU-USUARIO/mindsaas-intake.git`)

### Passo 2: Inicializar Git local (PowerShell)

```powershell
# Navegue até a raiz do projeto (onde está a pasta apps/)
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor"

# Verificar se já tem .git (se tiver, pule para o Passo 4)
Test-Path .git

# Inicializar repositório Git
git init

# Verificar status
git status
```

### Passo 3: Configurar Git (se nunca configurou)

```powershell
# Configurar nome e email (use os mesmos do GitHub)
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"

# Verificar configuração
git config --list
```

### Passo 4: Primeiro commit

```powershell
# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status

# Fazer o commit inicial
git commit -m "chore: initial commit - MindSaaS Intake + PRD"
```

### Passo 5: Configurar branch main

```powershell
# Renomear branch para main (se necessário)
git branch -M main

# Verificar branch atual
git branch
```

### Passo 6: Adicionar remote e push

```powershell
# Adicionar remote origin (substitua pela sua URL)
git remote add origin https://github.com/SEU-USUARIO/mindsaas-intake.git

# Verificar remote
git remote -v

# Push para GitHub
git push -u origin main
```

---

## Parte 2: Deploy na Vercel

### Passo 1: Importar repositório

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Se necessário, conecte sua conta GitHub
4. Selecione o repositório `mindsaas-intake`
5. Clique em **"Import"**

### Passo 2: Configurar projeto

Na tela de configuração:

| Campo | Valor |
|-------|-------|
| **Project Name** | mindsaas-intake (ou preferência) |
| **Framework Preset** | Next.js (deve detectar automaticamente) |
| **Root Directory** | `apps/core` ⚠️ **IMPORTANTE** |
| **Build Command** | `npm run build` (padrão) |
| **Output Directory** | `.next` (padrão) |
| **Install Command** | `npm install` (padrão) |

### Passo 3: Configurar variáveis de ambiente

Clique em **"Environment Variables"** e adicione:

| Variável | Valor | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://snvkcfjoayexovgvwsmp.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (sua anon key) | All |
| `BUILDER_RUNNER_SECRET` | (mesmo valor do Supabase) | All |
| `CRON_SECRET` | (gere um secret forte) | All |
| `DELIVERED_URL_BASE` | (deixe vazio ou `https://seu-dominio.vercel.app/done`) | All |

**Dica:** Copie os valores do seu `apps/core/.env.local`

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 1-3 minutos)
3. Quando concluir, você terá uma URL como: `https://mindsaas-intake.vercel.app`

### Passo 5: Verificar Cron

1. Acesse: **Vercel Dashboard > Seu Projeto > Settings > Crons**
2. Verifique se o cron `/api/cron/builder` está listado
3. O cron só funciona em produção (não em preview)

---

## Troubleshooting

### Erro: "git não é reconhecido como comando"

**Causa:** Git não está instalado ou não está no PATH.

**Solução:**
1. Baixe e instale: https://git-scm.com/download/win
2. Durante a instalação, selecione "Git from the command line and also from 3rd-party software"
3. Reinicie o PowerShell completamente
4. Teste: `git --version`

### Erro: "Authentication failed" no push

**Causa:** GitHub não aceita mais senha; precisa de token ou Git Credential Manager.

**Solução 1: Git Credential Manager (recomendado)**
```powershell
# Deve estar instalado junto com Git for Windows
# Ao fazer push, uma janela de login vai abrir automaticamente
git push -u origin main
```

**Solução 2: Personal Access Token (PAT)**
1. Acesse: https://github.com/settings/tokens/new
2. Gere um token com scope `repo`
3. Copie o token
4. Use o token como senha quando o Git pedir

```powershell
# Ao fazer push, quando pedir:
# Username: seu-usuario
# Password: (cole o token, não a senha)
```

### Erro: "remote origin already exists"

**Causa:** Já existe um remote configurado.

**Solução:**
```powershell
# Remover remote existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/SEU-USUARIO/mindsaas-intake.git

# Push
git push -u origin main
```

### Erro: "failed to push - rejected (fetch first)"

**Causa:** Você criou o repo no GitHub com README ou .gitignore.

**Solução 1: Rebase (mantém histórico)**
```powershell
# Baixar o que está no GitHub
git fetch origin

# Rebase local sobre o remote
git rebase origin/main

# Push
git push -u origin main
```

**Solução 2: Force push (sobrescreve o GitHub)**
```powershell
# ⚠️ CUIDADO: Isso apaga o que está no GitHub
git push -u origin main --force
```

**Solução 3: Recriar repo no GitHub**
1. Delete o repositório no GitHub
2. Crie novamente SEM README/gitignore
3. Tente o push novamente

### Erro: Build falha na Vercel

**Causas comuns:**

1. **Root Directory errado:**
   - Verifique se está `apps/core`
   - Na Vercel: Settings > General > Root Directory

2. **Variáveis de ambiente faltando:**
   - Verifique se todas as variáveis estão configuradas
   - Settings > Environment Variables

3. **node_modules commitado:**
   ```powershell
   # Remover node_modules do Git
   git rm -r --cached apps/core/node_modules
   git commit -m "chore: remove node_modules from tracking"
   git push
   ```

### Erro: Cron não executa

**Verificações:**
1. O cron só funciona em **Production**, não em Preview
2. Verifique se `vercel.json` está na raiz do projeto (não em apps/core)
3. Verifique se as variáveis `CRON_SECRET` e `BUILDER_RUNNER_SECRET` estão configuradas

**Logs do Cron:**
1. Vercel Dashboard > Functions
2. Procure por `/api/cron/builder`
3. Veja os logs de invocação

---

## Comandos Resumidos (Copiar e Colar)

```powershell
# 1. Navegar para o projeto
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor"

# 2. Inicializar Git
git init

# 3. Adicionar arquivos
git add .

# 4. Commit inicial
git commit -m "chore: initial commit - MindSaaS Intake + PRD"

# 5. Renomear para main
git branch -M main

# 6. Adicionar remote (substitua a URL)
git remote add origin https://github.com/SEU-USUARIO/mindsaas-intake.git

# 7. Push
git push -u origin main
```

---

## Após o Deploy

### Atualizar DELIVERED_URL_BASE

Após obter a URL da Vercel (ex: `https://mindsaas-intake.vercel.app`):

1. Na Vercel: Settings > Environment Variables
2. Atualize `DELIVERED_URL_BASE` para `https://mindsaas-intake.vercel.app/done`
3. Redeploy: Deployments > ... > Redeploy

### Testar o fluxo completo

1. Acesse: `https://sua-url.vercel.app/start`
2. Siga o fluxo: Start → Quiz → Pay → Building → Done
3. Verifique os logs no Supabase e Vercel

### Commits futuros

```powershell
# Após fazer alterações
git add .
git commit -m "feat: descrição da mudança"
git push

# A Vercel faz deploy automático a cada push
```

