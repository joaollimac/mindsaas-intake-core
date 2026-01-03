# Configuração do Supabase

## Passo 1: Criar arquivo .env.local

Crie o arquivo `apps/core/.env.local` com o seguinte conteúdo:

```
NEXT_PUBLIC_SUPABASE_URL=https://snvkcfjoayexovgvwsmp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_sua_anon_key_aqui
```

Substitua `cole_sua_anon_key_aqui` pela sua chave ANON_KEY do Supabase.

## Passo 2: Reiniciar o servidor de desenvolvimento

**IMPORTANTE:** Após criar ou modificar o arquivo `.env.local`, você DEVE:

1. Parar o servidor de desenvolvimento (Ctrl+C no terminal)
2. Iniciar novamente com `npm run dev`

As variáveis de ambiente só são carregadas quando o servidor Next.js inicia.

## Verificação

Acesse http://localhost:3000/start para ver o status da conexão com o Supabase.

