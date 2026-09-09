# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Angular CLI (`ng`) via npm scripts — Node 22+ required (Angular 19 CLI).

```bash
npm install                 # install dependencies
npm start                   # ng serve — dev server on http://localhost:4200, proxies /api to api-gateway
npm run build                # production build -> dist/front-end
npm run watch                # development build, rebuilds on file change
npm test                    # ng test — Karma + Jasmine, runs in Chrome (interactive/watch by default)
npx ng test --watch=false --browsers=ChromeHeadless   # run the full suite once, headless (CI-style)
npx ng test --watch=false --browsers=ChromeHeadless --include='**/auth.interceptor.spec.ts'  # run a single spec file
npx ng generate component features/<name>/<component>   # scaffold a new standalone component
npx ng generate interceptor core/interceptors/<name> --functional   # scaffold a functional HTTP interceptor
```

There is no separate lint command configured yet (no ESLint schematic installed).

## Architecture

This is the Angular 19 frontend for the `back-end` sibling repo (`../back-end`), a Spring Boot microservices AI-assisted exam platform. The frontend talks to the **api-gateway** service only — it must never call `auth-service` or `exam-service` directly, since the gateway is the single entry point in the backend architecture.

### Standalone components, no NgModules

This project uses Angular's standalone API (no `AppModule`/`NgModule`). Bootstrapping and app-wide providers live in:
- `src/main.ts` — bootstraps `AppComponent` with `appConfig`.
- `src/app/app.config.ts` — the single place where app-wide providers are registered (router, HttpClient + interceptors, zone change detection). New global providers (e.g. auth state, error handling) belong here, not in a module.
- `src/app/app.routes.ts` — top-level route table, currently empty. Feature routes should be added here, lazy-loaded via `loadComponent`/`loadChildren` where practical.

New components should be generated as standalone (`ng generate component` defaults to standalone in v19) and placed under `src/app/features/<feature>/` as feature areas are added; there is no `features/` directory yet since none exist.

### API access — proxy + environments, not hardcoded URLs

- `src/environments/environment.ts` (production) and `environment.development.ts` (dev) both expose `apiUrl: '/api'` — always read the gateway base URL from `environment.apiUrl`, never hardcode `http://localhost:8080` in a service.
- `proxy.conf.json` forwards `/api/*` unchanged to `http://localhost:8080/api/*` (the api-gateway's local port per the backend's `docker-compose.yml`/`.env.example`) during `ng serve`, avoiding CORS in dev — the gateway's own route predicates (`api-gateway/src/main/resources/application.yml`) match on the full `/api/v1/...` path with no rewrite, so the proxy must not strip the `/api` prefix. It is wired into the `serve` target in `angular.json` (`architect.serve.options.proxyConfig`).
- In production the same `/api` prefix is expected to be reverse-proxied to the gateway by whatever serves the built static files — this repo does not itself define that infra.

### HTTP interceptors

`src/app/core/interceptors/` holds functional `HttpInterceptorFn`s (Angular 19 functional interceptor style, not class-based `HttpInterceptor`), registered via `provideHttpClient(withInterceptors([...]))` in `app.config.ts`. `auth.interceptor.ts` is currently a passthrough stub — this is the intended place to attach the JWT issued by the backend's `auth-service` (via api-gateway) to outgoing requests once auth state exists.

### Relationship to the backend repo

The backend (`../back-end/CLAUDE.md`) documents the service contracts this app integrates with:
- Auth is JWT-based, issued by `auth-service` behind the gateway.
- Exam/question generation is asynchronous: creating an exam returns `PENDING` immediately (202), and the UI must poll or otherwise observe a status transition to `READY` rather than expecting a synchronous response.
- Swagger/OpenAPI docs are generated per backend service (`springdoc-openapi`) — check there for current request/response DTO shapes rather than assuming REST conventions.

## Commit Messages

- Every commit message must start with a conventional prefix describing the change, followed by a colon and a short description: `feat:`, `fix:`, `ref:` (refactor), `chore:`, `docs:`, `test:`, `style:`, `perf:`.
- Keep the subject line short and to the point. A short body below it is fine for extra context, but keep it brief (a few short lines) — avoid long, multi-paragraph commit bodies.
- Do not add attribution/co-authored-by lines (including Claude session links) to commits or PR descriptions.

## Important Rules

- Do not call backend microservices directly.
- Do not hardcode API URLs.
- Do not introduce NgModules.
- Do not use class-based HTTP interceptors.
- Do not bypass the API gateway.
- Do not assume exam generation is synchronous.
- Do not invent API DTOs when backend OpenAPI documentation is available.
- Do not put co authored by in the commits
- Use git prefixes to each commit: Example: fix, feat, ref (see Commit Messages above for the full convention)