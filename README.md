# Forge CLI

Project scaffolding tool that generates production-grade, org-standard starter projects. One command, fully working code — compiles, passes type checks, includes a working CRUD example, and follows enterprise patterns out of the box.

## Prerequisites

- **Node.js** >= 18
- **Java 21** (LTS — for Spring Boot templates)
- **Maven 3.9+** (for Spring Boot templates)
- **Docker** (for running tests — TestContainers uses SQL Server containers)

## Installation

```bash
# Clone the repo
git clone https://github.com/M4rkB4d/forge-cli.git
cd forge-cli
npm install

# Make the CLI available globally
npm link
```

After linking, the `forge` command is available anywhere in your terminal.

## Quick Start

```bash
# Create a new project (interactive)
forge create

# Create with a pre-set name
forge create my-service

# Preview what would be generated (no files written)
forge create --dry-run

# Scaffold into an existing directory (e.g., a cloned empty repo)
forge init

# Remove leftover files from an old scaffold before re-scaffolding
forge clean

# List all available templates and add-ons
forge list
```

## What Happens When You Run `forge create`

The CLI walks you through a series of prompts:

```
1. What are you building?
   > Backend Service / BFF (Backend-for-Frontend) / Frontend Application

2. Which stack?
   > (depends on category — e.g., Spring Boot, Express, Next.js, Vite)

3. Project name
   > my-service (lowercase, hyphens only, starts with a letter)

4. Stack-specific options
   > Auth pattern, messaging, UI library, etc.

5. Add-ons
   > Azure SQL, Azure Infrastructure (Bicep), CI/CD Pipeline
```

Once you confirm, Forge generates the project, initializes git, and installs dependencies.

## Templates

### Backend

| Template | Stack | Auth Options | Messaging Options |
|----------|-------|-------------|-------------------|
| `backend-springboot` | Spring Boot 4.0.5 + Java 21 | OAuth2 + Azure AD, JWT, None | Kafka, Azure Service Bus, None |

### BFF (Backend-for-Frontend)

| Template | Stack | Auth Options |
|----------|-------|-------------|
| `bff-springboot` | Spring Boot 4.0 + WebFlux + Resilience4j | OAuth2 + Azure AD, JWT, None |
| `bff-express` | Express 5 + TypeScript | Azure AD Token Validation, JWT, None |
| `bff-nextjs` | Next.js 16 (Standalone API, no React) | Azure AD Token Validation, JWT, None |

### Frontend

| Template | Stack | Auth Options | UI Options |
|----------|-------|-------------|------------|
| `frontend-vite` | React 19 + Vite 8 + TypeScript | Azure AD (MSAL), None | Tailwind CSS, None |
| `frontend-nextjs` | React 19 + Next.js 16 (SSR) | Azure AD (NextAuth + MSAL), None | Tailwind CSS, None |

## Version Matrix

### Spring Boot Stack

| Dependency | Version |
|-----------|---------|
| Spring Boot | 4.0.5 |
| Java | 21 (LTS, hardcoded) |
| Spring Cloud Azure | 7.1.0 |
| Resilience4j | 2.4.0 |
| springdoc-openapi | 3.0.2 |
| Flyway | via `spring-boot-starter-flyway` |
| logstash-logback-encoder | 9.0 |
| TestContainers | 2.0.4 |
| JaCoCo | 0.8.14 |

### Node.js Stack

| Dependency | Version |
|-----------|---------|
| React | 19.2.4 |
| Next.js | 16.2.1 |
| Vite | 8.0.3 |
| Express | 5.2.1 |
| TypeScript | 6.0.2 |
| Tailwind CSS | 4.2.2 (optional) |
| MSAL Browser | 5.6.2 (Vite auth) |
| MSAL Node | 5.1.1 (Next.js / Express auth) |
| Axios | 1.14.1 |
| Vitest | 4.1.2 |
| ESLint | 9.x |

## Add-on Layers

Layers are optional features that get merged into your generated project:

| Layer | What It Adds |
|-------|-------------|
| `azure-sql` | Azure Key Vault config for managed identity database access (Spring Boot only) |
| `azure-infra` | Bicep infrastructure-as-code files for Azure deployment |
| `ci-pipeline` | CI/CD workflow — GitHub Actions (`.github/workflows/ci.yml`) or Azure DevOps (`azure-pipelines.yml`) |
| `observability` | OpenTelemetry tracing — adds `@opentelemetry/*` packages and wires up `instrumentation.ts` with OTLP export |

Not all layers are compatible with all templates. The CLI only shows layers that work with your chosen template.

## CLI Options

```
forge create [name]

Options:
  -t, --template <id>   Skip the template selection prompt
  -o, --output <dir>    Output directory (default: current directory)
  --no-git              Skip git init and initial commit
  --no-install          Skip npm install / mvn validate
  --dry-run             Show what files would be created without writing anything
```

```
forge init

Options:
  -t, --template <id>   Skip the template selection prompt
  -o, --output <dir>    Target directory (default: current directory)
  --no-git              Skip git commit
  --no-install          Skip dependency installation
  --dry-run             Preview files without writing
```

Use `forge init` when you've already cloned an empty repo and want to scaffold into it. It detects `.git/` and commits the scaffold into the existing repository instead of running `git init`.

```
forge clean

Options:
  -o, --output <dir>    Target directory (default: current directory)
  --dry-run             Preview deletions without removing files
```

Use `forge clean` when re-scaffolding a project that was generated with an older version of the template. It asks the same prompts as `forge init`, then compares what the current template would generate against what's on disk. Files that no longer exist in the template (e.g., renamed or removed configs) are deleted. Protected directories (`.git`, `target`, `.idea`, `node_modules`) are never touched.

**Typical re-scaffold workflow:**
```bash
cd my-project
forge clean          # remove orphan files from old template
forge init           # re-scaffold with latest template
```

## Generated Project Structure

### Spring Boot Backend (example: `order-service`)

```
order-service/
  pom.xml
  Dockerfile
  .dockerignore
  .gitignore
  README.md
  docs/
    adr/
      001-initial-architecture.md
  src/
    main/
      java/com/company/orderservice/
        OrderServiceApplication.java
        config/
          SecurityConfig.java            # always present (security headers, CORS)
          JpaConfig.java                 # auditing
          OpenApiConfig.java             # Swagger/OpenAPI
          WebMvcConfig.java              # Jackson 3 settings
          KafkaHealthIndicator.java      # only if messaging = Kafka
        controller/
          SampleController.java          # CRUD example at /api/v1/samples
        service/
          SampleService.java             # service interface
          impl/
            SampleServiceImpl.java       # @Transactional, Resilience4j
        repository/
          SampleRepository.java          # Spring Data JPA + Specifications
        domain/entity/
          BaseEntity.java                # UUID PK, audit fields, optimistic locking
          SampleEntity.java              # example entity with business methods
        dto/
          request/
            SampleRequest.java           # validated input DTO (Java record)
          response/
            SampleResponse.java          # output DTO (Java record)
        mapper/
          SampleMapper.java              # entity <-> DTO conversion
        specification/
          SampleSpecification.java       # dynamic query composition
        messaging/
          producer/
            SampleEventProducer.java     # only if messaging != None
          consumer/
            SampleEventConsumer.java     # only if messaging != None
        exception/
          BaseException.java
          BusinessException.java
          ResourceNotFoundException.java
          DuplicateResourceException.java
          AuthorizationException.java
          ExternalServiceException.java
          GlobalExceptionHandler.java    # RFC 7807 Problem Detail responses
        util/
          CorrelationIdFilter.java
          MaskingUtil.java
      resources/
        application.yml
        application-local.yml
        application-dev.yml
        application-sit.yml
        application-uat.yml
        application-prod.yml
        logback-spring.xml
        db/migration/
          V1__create_sample_table.sql
    test/
      java/com/company/orderservice/
        OrderServiceApplicationTests.java
        config/
          TestContainersConfig.java      # SQL Server via Docker
        controller/
          ActuatorHealthTest.java
          SampleControllerTest.java      # @WebMvcTest — HTTP layer only
        service/
          SampleServiceImplTest.java     # Mockito unit tests
        repository/
          SampleRepositoryTest.java      # integration test with real DB
        integration/
          BaseIntegrationTest.java
          SampleIntegrationTest.java     # full CRUD lifecycle test
        fixture/
          TestDataFactory.java           # centralized test data builders
      resources/
        application-test.yml
```

### React + Vite SPA (example: `admin-portal`)

```
admin-portal/
  package.json
  tsconfig.json
  vite.config.ts
  Dockerfile
  .dockerignore
  .gitignore
  src/
    app/
      App.tsx
    auth/
      msalConfig.ts                  # only if auth = Azure AD (MSAL)
      AuthProvider.tsx               # only if auth = Azure AD (MSAL)
    styles/
      globals.css
    vite-env.d.ts
```

### Next.js BFF (example: `payment-gateway`)

```
payment-gateway/
  package.json
  tsconfig.json
  next.config.ts
  Dockerfile
  .dockerignore
  .gitignore
  .env.example
  proxy.ts                             # Runs before every request (auth, CSP, correlation IDs)
  instrumentation.ts                   # Graceful shutdown handler
  app/api/
    health/
      route.ts                         # GET /api/health (liveness)
      ready/
        route.ts                       # GET /api/health/ready (readiness)
    sample/
      route.ts                         # GET (list), POST (create) — working example
      [id]/
        route.ts                       # GET, PUT, DELETE — working example
    example/
      route.ts                         # Minimal route showing the basics
  clients/
    base-client.ts                     # Shared Axios config (retry, logging, correlation IDs)
    sample-client.ts                   # Example backend service client
  mappers/
    sample-mapper.ts                   # Backend → frontend response transformation
  lib/
    auth/
      token-validator.ts               # Token validation (varies by auth pattern)
      rbac.ts                          # Role-based access control helpers
    config/
      env.ts                           # Zod-validated environment variables
    errors/
      api-error.ts                     # Custom error classes
      error-response.ts                # Standardized error responses
    logging/
      logger.ts                        # Pino structured logger
      correlation.ts                   # Correlation ID utilities
    validation/
      schemas.ts                       # Shared Zod schemas
      sample-schema.ts                 # Example request validation schemas
  types/
    api/
      sample.ts                        # Types for what the BFF exposes
    backend/
      sample.ts                        # Types for what backend services return
  mocks/
    server.ts                          # MSW mock server setup
    handlers/
      sample-handlers.ts              # Mock backend responses for testing
    data/
      sample-data.ts                   # Test data factories
  tests/
    health.test.ts                     # Health endpoint tests
    sample-route.test.ts               # Route handler tests
    sample-client.test.ts              # Client tests with MSW
    sample-mapper.test.ts              # Mapper tests
    setup.ts                           # Test setup (MSW server lifecycle)
```

## After Generation

```
cd my-service

# Spring Boot — requires Docker for SQL Server
docker run -d --name my-service-sqlserver -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=LocalDev123!" -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
docker exec my-service-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "LocalDev123!" -Q "CREATE DATABASE [my-service]" -C
mvn spring-boot:run -Dspring-boot.run.profiles=local
mvn test                           # runs with TestContainers (Docker required)

# Node.js (Express, Vite, Next.js)
npm run dev                        # starts dev server
npm run build                      # production build
npm test                           # run tests
npm run lint                       # lint check
```

## Naming Conventions

When you provide a project name like `order-service`, Forge derives:

| Field | Value | Used For |
|-------|-------|----------|
| `projectName` | `order-service` | Directory name, package.json name |
| `className` | `OrderService` | Java class names, component names |
| `artifactName` | `orderservice` | Maven artifact, Java package segment |
| `packageName` | `com.company.orderservice` | Java package declaration |
| `packagePath` | `com/company/orderservice` | Java source directory structure |

The `groupId` (e.g., `com.company`) is set during the prompts for Java templates.

## Running Tests

```bash
# Quick smoke test (6 tests)
node tests/smoke.js

# Unit + integration tests (~210 tests)
node tests/unit.js

# Full generation + build verification (requires Java + Maven + Docker)
node tests/e2e.js

# Comprehensive matrix (~130 tests across all template variants)
node tests/comprehensive.js
```

## Troubleshooting

**`forge` command not found**
Run `npm link` from the forge-cli directory.

**Maven build fails**
Ensure you're on Java 21+ and Maven 3.9+. The template enforces these via maven-enforcer-plugin.

**Tests fail with "container" errors**
Docker must be running. TestContainers uses it for SQL Server.

**npm install fails on Next.js templates**
Ensure you're on Node.js >= 18. Next.js 16 requires it.

**"Directory already exists" warning**
Forge prompts before overwriting. Choose a different name or confirm the overwrite.
