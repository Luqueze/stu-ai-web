# AI Exam Platform — Front-end

> Criei esse projeto para estudar e praticar Angular moderno (standalone components, interceptors
> funcionais, arquitetura por features) consumindo uma API assíncrona baseada em eventos. Não é um
> produto em produção, não passou por hardening de segurança completo e decisões aqui priorizam
> valor didático sobre robustez de negócio. A ideia é aprendizado, não eficiência.

Front-end de uma plataforma de provas assistida por IA: um admin pede a geração de uma prova sobre
um tema, a IA gera as questões de forma assíncrona, e os alunos respondem e recebem correção
automática. Consome o [back-end](../back-end) (repositório irmão), um monorepo de microsserviços
Spring Boot, exclusivamente através do `api-gateway`.

## Stack

- **Angular 19** (standalone components, sem `NgModule`)
- **TypeScript 5.7**
- **RxJS**
- **Angular CLI** (`ng`) para build, serve e scaffolding
- **Karma + Jasmine** para testes unitários
- Interceptors HTTP **funcionais** (`HttpInterceptorFn`), não a API baseada em classe

## Arquitetura

Sem `AppModule` — bootstrapping e providers globais ficam centralizados:

| Arquivo | Papel |
|---|---|
| `src/main.ts` | Bootstrap do `AppComponent` com `appConfig` |
| `src/app/app.config.ts` | Único lugar onde providers globais são registrados (router, `HttpClient` + interceptors, zone change detection) |
| `src/app/app.routes.ts` | Tabela de rotas, com lazy-loading via `loadComponent` |

Organização de código em duas camadas:

| Diretório | Papel |
|---|---|
| `src/app/core/` | Serviços de domínio (`auth`, `exam`, `profile`), guards de rota e interceptors — lógica sem UI |
| `src/app/features/` | Componentes standalone por tela (`auth/login`, `auth/register`, `exams/*`, `profile`), carregados via lazy-loading |

### Comunicação com o backend — proxy + environments, nunca URL hardcoded

- `src/environments/environment.ts` (produção) e `environment.development.ts` (dev) expõem
  `apiUrl: '/api'` — os serviços sempre leem a URL base do gateway a partir daí, nunca hardcodeiam
  `http://localhost:8086`.
- `proxy.conf.json` encaminha `/api/*` sem rewrite para `http://localhost:8086/api/*` (porta local
  do `api-gateway`) durante `ng serve`, evitando CORS em dev — as rotas do gateway casam com o path
  completo `/api/v1/...`, então o proxy não pode remover o prefixo `/api`. Está plugado no target
  `serve` via `angular.json` (`architect.serve.options.proxyConfig`).
- Em produção, o mesmo prefixo `/api` é esperado como reverse proxy para o gateway feito por quem
  hospeda os arquivos estáticos — esse repositório não define essa infra.
- O front-end nunca chama `auth-service` ou `exam-service` diretamente, nem contorna o
  `api-gateway`.

### Autenticação e sessão

JWT emitido pelo `auth-service` (via gateway). `auth.interceptor.ts` anexa o token às requisições
saindo; `auth.guard.ts` e `admin.guard.ts` protegem rotas que exigem sessão autenticada ou papel
`ADMIN`, respectivamente. Existem apenas dois papéis na plataforma: **ADMIN** e **STUDENT**.

### Geração de prova é assíncrona

Criar uma prova retorna `PENDING` imediatamente (`202 Accepted`); a UI precisa fazer polling ou
observar a transição de status para `READY` em vez de esperar uma resposta síncrona com as
questões prontas.

## Rodando localmente

### Pré-requisitos

- Node 22+
- O [back-end](../back-end) rodando localmente (ao menos o `api-gateway` e os serviços dos quais
  ele depende) — ver o README daquele repositório

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o servidor de desenvolvimento

```bash
npm start
```

Abre em `http://localhost:4200`, com hot-reload e proxy de `/api` para `http://localhost:8086`
(porta padrão do `api-gateway` no back-end).

## Build e testes

```bash
npm run build                                                          # build de produção -> dist/front-end
npm run watch                                                          # build de desenvolvimento, rebuilda a cada mudança
npm test                                                               # Karma + Jasmine, modo watch/interativo no Chrome
npx ng test --watch=false --browsers=ChromeHeadless                    # suíte completa, headless (estilo CI)
npx ng test --watch=false --browsers=ChromeHeadless --include='**/auth.interceptor.spec.ts'  # um spec específico
```

Não há lint configurado ainda (sem schematic de ESLint instalado).

## Scaffolding

```bash
npx ng generate component features/<feature>/<component>          # componente standalone
npx ng generate interceptor core/interceptors/<nome> --functional  # interceptor funcional
```

## Convenções de código

O projeto segue um conjunto de convenções documentadas em [`CLAUDE.md`](./CLAUDE.md), entre elas:

- Sem `NgModule` — tudo standalone
- Interceptors HTTP só no estilo funcional (`HttpInterceptorFn`), nunca baseados em classe
- URL do gateway sempre via `environment.apiUrl`, nunca hardcoded
- Nunca chamar `auth-service`/`exam-service` diretamente, sempre pelo `api-gateway`
- Nunca assumir que a geração de prova é síncrona
- DTOs seguem a documentação OpenAPI do backend, nunca são inventados

## Estrutura do repositório

```
.
├── angular.json              # configuração do Angular CLI (build, serve, proxy)
├── proxy.conf.json           # proxy de /api para o api-gateway em dev
├── src/
│   ├── main.ts
│   ├── styles.scss
│   ├── environments/
│   │   ├── environment.ts            # produção
│   │   └── environment.development.ts
│   └── app/
│       ├── app.config.ts     # providers globais (router, HttpClient + interceptors)
│       ├── app.routes.ts     # tabela de rotas com lazy-loading
│       ├── core/
│       │   ├── auth/         # AuthService, modelos
│       │   ├── exam/         # ExamService, modelos
│       │   ├── profile/      # ProfileService, modelos (API keys de IA)
│       │   ├── guards/       # authGuard, adminGuard
│       │   └── interceptors/ # auth.interceptor (JWT)
│       └── features/
│           ├── auth/         # login, register
│           ├── exams/        # exam-list, exam-create, exam-detail, exam-take, exam-results
│           └── profile/      # tela de perfil / API key de IA
└── ../back-end/              # repositório irmão com os microsserviços Spring Boot
```

## Status / limitações conhecidas

Projeto em desenvolvimento contínuo para fins de estudo. Áreas propositalmente simplificadas ou
ainda não cobertas incluem: testes e2e (não há framework configurado), tratamento de erro mais
refinado na UI, acessibilidade completa e políticas de segurança de produção (ex.: refresh token,
CSP).
