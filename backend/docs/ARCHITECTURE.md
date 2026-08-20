# Clean Architecture Standards — InHire Backend

Este documento estabelece o padrão arquitetural oficial do backend da aplicação, baseado nos princípios de **Clean Architecture (Robert C. Martin)** adaptados para TypeScript e NestJS.

---

## 1. Princípios Fundamentais

1. **Separação de Preocupações (Separation of Concerns)**:
   - O núcleo do sistema (Domain) não conhece banco de dados, HTTP, decorators de framework ou bibliotecas externas.
   - Mudanças na UI, no banco (ex: migrar de Prisma para outro ORM) ou em integrações externas não afetam as entidades nem os casos de uso.

2. **Independência de Frameworks (Dependency Inversion)**:
   - As dependências fluem estritamente de fora para dentro:
     `Presentation` ➔ `App (Use Cases)` ➔ `Domain (Entities & Value Objects)`
     `Infra (DB/API)` ➔ `App (Ports/Interfaces)` ➔ `Domain`
   - O núcleo define contratos (interfaces/tokens) e a camada de infraestrutura fornece as implementações concretas.

3. **Arquitetura Testável e Escalável**:
   - Casos de uso e entidades podem ser testados com mocks de repositórios e provedores sem subir servidores, banco ou serviços externos.

---

## 2. Visão Geral da Estrutura de Diretórios

```
backend/src/
│
├── domain/                      # CAMADA 1: NÚCLEO DE DOMÍNIO (Sem dependências externas)
│   ├── dtos/                    # DTOs de dados entre camadas
│   │   ├── user.dtos.ts
│   │   ├── candidate-profile.dtos.ts
│   │   ├── tenant.dtos.ts
│   │   ├── job.dtos.ts
│   │   └── pagination.dto.ts
│   ├── entities/                # Entidades com regras de negócio e validação
│   │   ├── user.entity.ts
│   │   ├── candidate-profile.entity.ts
│   │   ├── tenant.entity.ts
│   │   ├── job.entity.ts
│   │   └── crawl-run.entity.ts
│   ├── enums/                   # Enums do domínio
│   │   └── index.ts
│   └── valueObjects/            # Objetos de valor com autovalidação
│       ├── email.vo.ts
│       └── slug.vo.ts
│
├── app/                         # CAMADA 2: APLICAÇÃO (Regras de negócio da aplicação)
│   ├── providers/               # Interfaces/Portas para serviços externos
│   │   ├── password-hasher.provider.interface.ts
│   │   ├── token-service.provider.interface.ts
│   │   └── inhire-client.provider.interface.ts
│   ├── repositories/            # Interfaces/Portas para acesso a dados
│   │   ├── users.repository.interface.ts
│   │   ├── candidate-profiles.repository.interface.ts
│   │   ├── tenants.repository.interface.ts
│   │   ├── jobs.repository.interface.ts
│   │   └── crawl-runs.repository.interface.ts
│   └── useCases/                # Casos de uso que orquestram entidades e portas
│       ├── auth/
│       │   ├── register-user.usecase.ts
│       │   ├── login-user.usecase.ts
│       │   └── get-user-profile.usecase.ts
│       ├── jobs/
│       │   ├── list-jobs.usecase.ts
│       │   ├── get-job-detail.usecase.ts
│       │   └── get-job-application-form.usecase.ts
│       ├── tenants/
│       │   ├── list-tenants.usecase.ts
│       │   ├── get-tenant.usecase.ts
│       │   ├── create-tenant.usecase.ts
│       │   ├── update-tenant.usecase.ts
│       │   └── deactivate-tenant.usecase.ts
│       └── candidateProfile/
│
├── infra/                       # CAMADA 3: INFRAESTRUTURA (Adaptadores e ferramentas externas)
│   ├── databases/
│   │   └── prisma/              # PrismaService e conexões
│   ├── providers/               # Implementações concretas de serviços externos
│   │   ├── auth/                # BcryptPasswordHasher, JwtTokenService
│   │   ├── inhire/              # InhireClientService
│   │   └── ai/                  # 9Router Provider, OpenAI Provider, etc.
│   ├── repositories/            # Implementações concretas com Prisma
│   │   ├── prisma-users.repository.ts
│   │   ├── prisma-tenants.repository.ts
│   │   └── prisma-jobs.repository.ts
│   ├── logging/                 # AppLoggerService estruturado
│   └── utils/                   # Utilitários de sanitização, slugs, etc.
│
├── ai/                          # HUB DE IA AGNÓSTICO
│   ├── ai-provider.interface.ts # Contrato AiProvider
│   ├── ai.service.ts            # Fachada agnóstica para as features
│   ├── ai.types.ts              # Tipos de mensagens e JSON estruturado
│   └── providers/
│       └── 9router.provider.ts  # Implementação do 9Router
│
└── presentation/                # CAMADA 4: APRESENTAÇÃO (NestJS HTTP, Controllers, Guards)
    ├── http/
    │   ├── controllers/         # Recebem a requisição e chamam os Use Cases
    │   ├── dto/                 # DTOs de validação de payload (class-validator)
    │   ├── guards/              # ApiKeyGuard, AuthGuard, ThrottlerGuard
    │   ├── interceptors/        # HttpLoggingInterceptor
    │   └── filters/             # AllExceptionsFilter
    └── nest/
        └── modules/             # Módulos de injeção de dependência do NestJS
```

---

## 3. Como Implementar Novas Funcionalidades

Ao criar uma nova feature (ex: `MatchJobWithCandidate`):

1. **Defina ou estenda o Domínio** (`src/domain/`):
   - Crie a entidade ou objeto de valor com as regras invariantes.
   - Defina os DTOs de entrada e saída.

2. **Crie a Porta (Interface)** (`src/app/repositories/` ou `src/app/providers/`):
   - Defina a interface do repositório ou serviço externo e seu respectivo `Symbol` token para injeção.

3. **Implemente o Caso de Uso** (`src/app/useCases/`):
   - Crie a classe `ExecuteMatchJobUseCase` que recebe as interfaces injetadas no construtor.
   - O caso de uso deve apenas orquestrar a lógica e não conter acoplamentos com HTTP ou ORM.

4. **Implemente a Infraestrutura** (`src/infra/`):
   - Implemente o repositório concreto usando o Prisma/DB.
   - Implemente qualquer cliente HTTP ou provedor externo necessário.

5. **Exponha na Apresentação** (`src/presentation/`):
   - Crie o Controller NestJS com DTOs validados via `class-validator`.
   - Amarre as interfaces às implementações no módulo NestJS correspondente (`providers: [{ provide: TOKEN, useClass: Impl }]`).

---

## 4. Regras Obrigatórias para Agentes e Desenvolvedores

- **TypeScript Estrito**: Nunca use `any`. Utilize `unknown`, `never` ou interfaces bem definidas.
- **Isolamento de Negócio**: Não injete o `PrismaService` diretamente em controllers ou use cases; utilize sempre o `I...Repository` via `Symbol` de injeção.
- **Agnosticismo de IA**: Qualquer funcionalidade de inteligência artificial deve utilizar o `AiService`, mantendo o código desacoplado de provedores específicos (9Router, OpenAI, Gemini).
- **Testabilidade**: Todo novo Caso de Uso (`UseCase`) deve vir acompanhado do seu arquivo de teste unitário `.spec.ts` com mock das portas.
