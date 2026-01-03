# Correção da Rota /pay - Instruções Finais

## Status Atual

✅ **Arquivo correto existe:** `apps/core/app/pay/page.tsx`
✅ **Rota building existe:** `apps/core/app/building/page.tsx`
✅ **Imports corretos:** Todos os imports estão funcionando
❌ **Pasta duplicada:** `apps/core/app/pay/apps/` ainda existe (bloqueada)

## Passos para Corrigir o 404

### 1. Parar o servidor de desenvolvimento
Pressione `Ctrl+C` no terminal onde o `next dev` está rodando.

### 2. Remover a pasta duplicada manualmente

**Opção A - Via PowerShell (como Administrador):**
```powershell
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor\apps\core"
Remove-Item -Path "app\pay\apps" -Recurse -Force
```

**Opção B - Manualmente:**
1. Feche o editor/IDE (Cursor, VS Code, etc.)
2. Navegue até: `apps\core\app\pay\`
3. Delete a pasta `apps` inteira

### 3. Limpar o cache do Next.js
```powershell
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor\apps\core"
Remove-Item -Path ".next" -Recurse -Force
```

### 4. Reiniciar o servidor
```powershell
cd "C:\Users\joaol\OneDrive\Desktop\Projeto Teste Cursor\apps\core"
npm run dev
```

### 5. Validar
- Acesse: `http://localhost:3000/pay?prd=<uuid>`
- Deve renderizar a tela de pagamento (não 404)

## Estrutura Correta Final

```
apps/core/
  app/
    pay/
      page.tsx  ✅ (arquivo correto)
    building/
      page.tsx  ✅ (existe)
```

## Nota
A pasta `apps/core/app/pay/apps/` está vazia mas bloqueada por algum processo. Após fechar o editor e remover manualmente, o Next.js deve reconhecer a rota corretamente.

