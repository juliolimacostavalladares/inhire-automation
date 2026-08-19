# InHire Jobs API

Backend NestJS para descobrir tenants da InHire, sincronizar todas as vagas publicadas e expor o histórico por API REST.

## Stack

- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ
- pnpm
- Swagger/OpenAPI
- Docker Compose

## Início rápido

```bash
cp .env.example .env
# Troque API_KEY e JWT_SECRET por valores aleatórios diferentes, com pelo menos 32 caracteres.
pnpm install
docker compose up --build
```

A API fica em `http://localhost:3000`, a documentação em `http://localhost:3000/docs` e o health check em `http://localhost:3000/health`.

As rotas administrativas continuam exigindo o header:

```text
X-API-Key: valor-configurado-em-API_KEY
```

O portal pode listar vagas sem login, mas a listagem pública é limitada a 10 vagas, sem paginação ou filtros. O acesso por `X-API-Key` permite até 25 vagas por página, 10 páginas e dois filtros por consulta, com limite de 5 consultas por segundo. Usuários autenticados usam JWT em cookie `HttpOnly` e podem consultar os detalhes e os limites completos.

## Serviços

- `api`: REST, Swagger e agendas.
- `worker`: processadores de coleta e descoberta.
- `postgres`: persistência principal.
- `redis`: filas e coordenação.

A coleta roda a cada hora. A descoberta via Wayback, urlscan e Common Crawl roda diariamente às 03h, sempre no fuso `America/Sao_Paulo`.

## Endpoints

- `GET/POST /tenants`
- `GET/PATCH/DELETE /tenants/:id`
- `GET /jobs`, `GET /jobs/:id` e `GET /jobs/:id/application-form`
- `POST /runs/collection` e `POST /runs/discovery`
- `GET /runs` e `GET /runs/:id`
- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` e `GET /auth/me`

`DELETE /tenants/:id` desativa o tenant sem apagar histórico. Disparos manuais retornam `202` e devem ser acompanhados por `GET /runs/:id`.

`GET /jobs` retorna somente o resumo necessário para a listagem: identificação, título, empresa, modalidade, localização, status, URL e datas de publicação/monitoramento. Campos pesados ou específicos (`descriptionHtml`, `applicationForm`, `lastPublishedAt`, `detailFetchedAt`, `createdAt` e `updatedAt`) ficam em `GET /jobs/:id`. O HTML é sanitizado no backend, mas consumidores ainda devem tratá-lo como conteúdo externo. Use `publishedFrom` e `publishedTo` em `GET /jobs` para filtrar pela data real de publicação da InHire.

`GET /jobs/:id/application-form` retorna os campos visíveis e obrigatórios da candidatura, opções de contrato, política de privacidade e perguntas condicionais de diversidade. O backend apenas descreve o formulário; ele não envia candidaturas.

## Desenvolvimento

```bash
pnpm exec prisma generate
pnpm run build
pnpm run lint
pnpm test
```

Para executar fora do Docker, configure PostgreSQL e Redis locais no `.env`, rode `pnpm exec prisma migrate deploy` e inicie API e worker em terminais separados:

```bash
pnpm start:dev
pnpm start:worker:dev
```

## Garantias de sincronização

- A chave externa da vaga é única por tenant.
- Vagas reaparecidas voltam para `PUBLISHED`.
- Os detalhes de vagas novas, incompletas ou não atualizadas nas últimas 24 horas são sincronizados pelo endpoint público de detalhe da InHire.
- Uma vaga ausente é encerrada apenas após resposta válida e completa da InHire.
- Falhas de rede não alteram o estado das vagas.
- Vagas e tenants não são removidos fisicamente pelos endpoints.
