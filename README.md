# Forge CLI

Project scaffolding tool that generates production-grade, org-standard starter projects. One command, fully working code — compiles, passes type checks, and follows enterprise patterns out of the box.

## Prerequisites

- **Node.js** >= 18
- **Java 17, 21, or 25** (for Spring Boot templates only)
- **Maven** (for Spring Boot templates only)

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
   > Java version, auth pattern, messaging, UI library, etc.

5. Add-ons
   > Azure SQL, Azure Infrastructure (Bicep), CI/CD Pipeline
```

Once you confirm, Forge generates the project, initializes git, and installs dependencies.

## Templates

### Backend

| Template | Stack | Auth Options | Messaging Options |
|----------|-------|-------------|-------------------|
| `backend-springboot` | Spring Boot 4.0 + Java | OAuth2 + Azure AD, JWT, None | Azure Service Bus, None |

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
| Java | 17, 21, 25 (selectable) |
| Spring Cloud Azure | 7.1.0 |
| Resilience4j | 2.4.0 (BFF only) |
| springdoc-openapi | 3.0.2 |
| Flyway | via `spring-boot-starter-flyway` (azure-sql layer) |
| logstash-logback-encoder | 9.0 |
| Testcontainers | 2.0.4 |
| MSAL4J | 1.24.0 (OAuth2 auth) |

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
| `azure-sql` | Azure SQL datasource config, Flyway migrations, JPA dependencies (Spring Boot only) |
| `azure-infra` | Bicep infrastructure-as-code files for Azure deployment |
| `ci-pipeline` | CI/CD workflow — GitHub Actions (`.github/workflows/ci.yml`) or Azure DevOps (`azure-pipelines.yml`) |

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

## Generated Project Structure

### Spring Boot Backend (example: `order-service`)

```
order-service/
  pom.xml
  Dockerfile
  .dockerignore
  .gitignore
  src/
    main/
      java/com/company/orderservice/
        OrderServiceApplication.java
        controller/
          HealthController.java
        config/
          SecurityConfig.java        # only if auth != None
        service/
        model/
      resources/
        application.yml
        db/migration/
          V1__init.sql               # only with azure-sql layer
    test/
      java/com/company/orderservice/
        controller/
          HealthControllerTest.java
  .github/
    workflows/
      ci.yml                         # only with ci-pipeline layer
  infra/
    main.bicep                       # only with azure-infra layer
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

## After Generation

```bash
cd my-service

# Spring Boot
mvn spring-boot:run              # starts on :8080
mvn test                         # run tests

# Node.js (Express, Vite, Next.js)
npm run dev                      # starts dev server
npm run build                    # production build
npm test                         # run tests
npm run lint                     # lint check
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
# Quick smoke test
node tests/smoke.js

# Unit + integration tests (154 tests)
node tests/unit.js

# Full generation + build verification (requires Java + Maven)
node tests/e2e.js

# Comprehensive matrix (129 tests across all template variants)
node tests/comprehensive.js
```

## Troubleshooting

**`forge` command not found**
Run `npm link` from the forge-cli directory.

**Maven build fails with "version missing"**
Spring Boot 4.0 has some starters not managed by the BOM. The templates handle this — make sure you're using `springBootVersion: 4.0.5` (the default).

**npm install fails on Next.js templates**
Ensure you're on Node.js >= 18. Next.js 16 requires it.

**"Directory already exists" warning**
Forge prompts before overwriting. Choose a different name or confirm the overwrite.
