# InHire Frontend

Frontend do candidato construído com React, TypeScript, Vite, Tailwind CSS v4 e shadcn/ui customizado.

## Desenvolvimento

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Acesse `http://127.0.0.1:5173/login`.

## Verificações

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Estrutura

- `src/components/ui`: primitivos shadcn customizados.
- `src/components/brand`: identidade InHire.
- `src/components/theme`: temas claro e escuro.
- `src/features`: módulos de produto por domínio.
- `src/pages`: composição das rotas.
- `src/styles/globals.css`: tokens e integração Tailwind.
- `DESIGN_SYSTEM.md`: regras obrigatórias do design system.

## Regra de autenticação

O frontend envia credenciais com `credentials: 'include'`. O backend deve criar a sessão em cookie `httpOnly`, `Secure` e `SameSite`; tokens não devem ser retornados para armazenamento no navegador.
