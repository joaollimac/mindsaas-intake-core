# Intake + Mini PRD

Projeto de treino para Intake + Mini PRD usando Next.js com App Router e TypeScript.

## Estrutura do Projeto

```
/apps/core
  /app
    /components
      Layout.tsx
    /start
      page.tsx
    /quiz
      page.tsx
    /done
      page.tsx
    layout.tsx
    page.tsx
    globals.css
  package.json
  tsconfig.json
  next.config.js
  .eslintrc.json
```

## Como Rodar o Projeto Localmente

1. Navegue até a pasta do app:
```bash
cd apps/core
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Rotas Disponíveis

- `/` - Página inicial
- `/start` - Página de início do processo
- `/quiz` - Página do quiz
- `/done` - Página de conclusão

## Tecnologias

- Next.js 14 (App Router)
- TypeScript
- ESLint
- React 18

