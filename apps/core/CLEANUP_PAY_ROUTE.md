# Limpeza da Rota /pay

## Problema
Pasta duplicada vazia em `apps/core/app/pay/apps/core/` que pode estar causando confusão no Next.js.

## Solução
A pasta `apps/core/app/pay/apps` está vazia e precisa ser removida manualmente.

## Comando para remover
```powershell
Remove-Item -Path "apps\core\app\pay\apps" -Recurse -Force
```

Ou feche o editor/IDE e delete manualmente a pasta.

## Rota Correta
A rota `/pay` está corretamente configurada em:
- `apps/core/app/pay/page.tsx` ✅

## Após Remover
1. Limpe o cache do Next.js: `rm -rf .next` (ou delete a pasta `.next`)
2. Reinicie o servidor: `npm run dev`
3. Teste: `http://localhost:3000/pay?prd=<uuid>`

