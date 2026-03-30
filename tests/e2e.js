import { compose } from '../src/core/composer.js';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const OUT = 'C:/Projects/forge-cli/test-output';
const MVN = 'C:/tools/apache-maven-3.9.14/bin/mvn.cmd';

const buildJava = (dir) => {
  console.log('    mvn compile...');
  execSync(`"${MVN}" compile -q`, { cwd: dir, stdio: 'pipe', timeout: 300000 });
  return true;
};

const buildNode = (dir) => {
  console.log('    npm install...');
  execSync('npm install', { cwd: dir, stdio: 'pipe', timeout: 120000 });
  console.log('    tsc build...');
  execSync('npx tsc --noEmit', { cwd: dir, stdio: 'pipe', timeout: 30000 });
  return true;
};

// Clean slate
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });

const configs = [
  {
    name: 'Spring Boot Backend (OAuth2)',
    config: {
      templateId: 'backend-springboot',
      variables: {
        projectName: 'order-service',
        className: 'OrderService',
        groupId: 'com.bank.orders',
        packageName: 'com.bank.orders.orderservice',
        packagePath: 'com/bank/orders/orderservice',
        artifactName: 'orderservice',
        javaVersion: '21',
        springBootVersion: '4.0.5',
        authPattern: 'OAuth2 + Azure AD',
        messaging: 'Azure Service Bus',
        runtime: 'java',
      },
      layers: ['azure-sql', 'ci-pipeline'],
    },
    verify: (dir) => {
      assertFile(dir, 'pom.xml');
      assertFile(dir, 'Dockerfile');
      assertFile(dir, 'src/main/java/com/bank/orders/orderservice/OrderServiceApplication.java');
      assertFile(dir, 'src/main/java/com/bank/orders/orderservice/config/SecurityConfig.java');
      assertFile(dir, 'src/main/resources/db/migration/V1__init.sql');
      assertFile(dir, '.github/workflows/ci.yml');
      assertContains(dir, 'pom.xml', 'spring-boot-starter-security');
      assertContains(dir, 'pom.xml', 'spring-boot-starter-data-jpa');
      assertContains(dir, 'pom.xml', 'msal4j');
      assertContains(dir, 'pom.xml', 'spring-cloud-azure-starter-servicebus-jms');
      assertContains(dir, '.github/workflows/ci.yml', 'setup-java');
      assertNoAiTrace(dir);
    },
    build: buildJava,
  },
  {
    name: 'Spring Boot Backend (No Auth, No Messaging)',
    config: {
      templateId: 'backend-springboot',
      variables: {
        projectName: 'catalog-service',
        className: 'CatalogService',
        groupId: 'com.bank.catalog',
        packageName: 'com.bank.catalog.catalogservice',
        packagePath: 'com/bank/catalog/catalogservice',
        artifactName: 'catalogservice',
        javaVersion: '17',
        springBootVersion: '4.0.5',
        authPattern: 'None',
        messaging: 'None',
        runtime: 'java',
      },
      layers: [],
    },
    verify: (dir) => {
      assertFile(dir, 'pom.xml');
      assertFile(dir, 'Dockerfile');
      assertNotContains(dir, 'pom.xml', 'spring-boot-starter-security');
      assertNotContains(dir, 'pom.xml', 'servicebus');
      assertNoFile(dir, 'src/main/java/com/bank/catalog/catalogservice/config/SecurityConfig.java');
      assertContains(dir, 'Dockerfile', 'temurin:17');
      assertNoAiTrace(dir);
    },
    build: buildJava,
  },
  {
    name: 'Spring Boot BFF',
    config: {
      templateId: 'bff-springboot',
      variables: {
        projectName: 'api-gateway',
        className: 'ApiGateway',
        groupId: 'com.bank.gateway',
        packageName: 'com.bank.gateway.apigateway',
        packagePath: 'com/bank/gateway/apigateway',
        artifactName: 'apigateway',
        javaVersion: '21',
        springBootVersion: '4.0.5',
        authPattern: 'JWT',
        runtime: 'java',
      },
      layers: [],
    },
    verify: (dir) => {
      assertFile(dir, 'pom.xml');
      assertContains(dir, 'pom.xml', 'resilience4j');
      assertContains(dir, 'pom.xml', 'spring-boot-starter-webflux');
      assertFile(dir, 'src/main/java/com/bank/gateway/apigateway/gateway/DownstreamClient.java');
      assertFile(dir, 'src/main/java/com/bank/gateway/apigateway/config/ResilienceConfig.java');
      assertNoAiTrace(dir);
    },
    build: buildJava,
  },
  {
    name: 'Express BFF',
    config: {
      templateId: 'bff-express',
      variables: {
        projectName: 'web-bff',
        className: 'WebBff',
        packageName: '',
        packagePath: '',
        artifactName: 'webbff',
        authPattern: 'Azure AD Token Validation',
        runtime: 'node',
      },
      layers: [],
    },
    verify: (dir) => {
      assertFile(dir, 'package.json');
      assertFile(dir, 'tsconfig.json');
      assertFile(dir, 'src/index.ts');
      assertContains(dir, 'package.json', '@azure/msal-node');
      assertContains(dir, 'package.json', 'express');
      assertNoAiTrace(dir);
    },
    build: buildNode,
  },
  {
    name: 'Next.js BFF',
    config: {
      templateId: 'bff-nextjs',
      variables: {
        projectName: 'mobile-bff',
        className: 'MobileBff',
        packageName: '',
        packagePath: '',
        artifactName: 'mobilebff',
        authPattern: 'None',
        runtime: 'node',
      },
      layers: [],
    },
    verify: (dir) => {
      assertFile(dir, 'package.json');
      assertFile(dir, 'app/api/health/route.ts');
      assertFile(dir, 'proxy.ts');
      assertNotContains(dir, 'package.json', 'react');
      assertNoAiTrace(dir);
    },
    build: buildNode,
  },
  {
    name: 'React + Vite SPA (Tailwind + MSAL)',
    config: {
      templateId: 'frontend-vite',
      variables: {
        projectName: 'admin-portal',
        className: 'AdminPortal',
        packageName: '',
        packagePath: '',
        artifactName: 'adminportal',
        authPattern: 'Azure AD (MSAL)',
        uiLibrary: 'Tailwind CSS',
        runtime: 'node',
      },
      layers: ['ci-pipeline'],
    },
    verify: (dir) => {
      assertFile(dir, 'package.json');
      assertFile(dir, 'vite.config.ts');
      assertFile(dir, 'src/app/App.tsx');
      assertContains(dir, 'package.json', '@azure/msal-browser');
      assertContains(dir, 'package.json', 'tailwindcss');
      assertContains(dir, 'vite.config.ts', 'tailwindcss');
      assertFile(dir, '.github/workflows/ci.yml');
      assertContains(dir, '.github/workflows/ci.yml', 'setup-node');
      assertNoAiTrace(dir);
    },
    build: buildNode,
  },
  {
    name: 'React + Vite SPA (No Auth, No Tailwind)',
    config: {
      templateId: 'frontend-vite',
      variables: {
        projectName: 'public-site',
        className: 'PublicSite',
        packageName: '',
        packagePath: '',
        artifactName: 'publicsite',
        authPattern: 'None',
        uiLibrary: 'None',
        runtime: 'node',
      },
      layers: [],
    },
    verify: (dir) => {
      assertNotContains(dir, 'package.json', 'msal');
      assertNotContains(dir, 'package.json', 'tailwindcss');
      assertNotContains(dir, 'vite.config.ts', 'tailwindcss');
      assertContains(dir, 'src/styles/globals.css', 'box-sizing');
      assertNoAiTrace(dir);
    },
    build: buildNode,
  },
  {
    name: 'React + Next.js Frontend',
    config: {
      templateId: 'frontend-nextjs',
      variables: {
        projectName: 'customer-portal',
        className: 'CustomerPortal',
        packageName: '',
        packagePath: '',
        artifactName: 'customerportal',
        authPattern: 'Azure AD (NextAuth + MSAL)',
        uiLibrary: 'Tailwind CSS',
        runtime: 'node',
      },
      layers: [],
    },
    verify: (dir) => {
      assertFile(dir, 'package.json');
      assertFile(dir, 'app/layout.tsx');
      assertFile(dir, 'app/page.tsx');
      assertContains(dir, 'package.json', 'next-auth');
      assertContains(dir, 'package.json', '@azure/msal-node');
      assertContains(dir, 'package.json', 'tailwindcss');
      assertNoAiTrace(dir);
    },
    build: buildNode,
  },
];

// Run all tests
let passed = 0;
let failed = 0;
let buildsPassed = 0;
let buildsFailed = 0;

for (const test of configs) {
  console.log(`\n=== ${test.name} ===`);
  const dir = join(OUT, test.config.variables.projectName);

  try {
    const files = compose(test.config);
    writeToDisk(files, dir);
    console.log(`  Generated ${files.length} files to ${dir}`);

    test.verify(dir);
    console.log('  VERIFY: PASS');
    passed++;

    if (test.build) {
      try {
        test.build(dir);
        console.log('  BUILD: PASS');
        buildsPassed++;
      } catch (err) {
        console.log(`  BUILD: FAIL — ${err.message}`);
        buildsFailed++;
      }
    }
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    failed++;
  }
}

console.log(`\n========== RESULTS ==========`);
console.log(`Verification: ${passed} passed, ${failed} failed out of ${configs.length}`);
if (buildsPassed + buildsFailed > 0) {
  console.log(`Build: ${buildsPassed} passed, ${buildsFailed} failed`);
}

// Helpers
function writeToDisk(files, dir) {
  for (const file of files) {
    const full = join(dir, file.path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, file.content, 'utf-8');
  }
}

function assertFile(dir, path) {
  if (!existsSync(join(dir, path))) throw new Error(`Missing file: ${path}`);
}

function assertNoFile(dir, path) {
  if (existsSync(join(dir, path))) throw new Error(`File should not exist: ${path}`);
}

function assertContains(dir, path, str) {
  const content = readFileSync(join(dir, path), 'utf-8');
  if (!content.includes(str)) throw new Error(`${path} should contain "${str}"`);
}

function assertNotContains(dir, path, str) {
  const content = readFileSync(join(dir, path), 'utf-8');
  if (content.includes(str)) throw new Error(`${path} should NOT contain "${str}"`);
}

function assertNoAiTrace(dir) {
  const patterns = ['Co-authored-by', 'Claude', 'Anthropic', 'ChatGPT', 'generated by', 'auto-generated', 'Copilot'];
  const filesToCheck = ['package.json', 'pom.xml', 'README.md', 'tsconfig.json', '.gitignore'].filter(f => existsSync(join(dir, f)));

  for (const f of filesToCheck) {
    const content = readFileSync(join(dir, f), 'utf-8');
    for (const pat of patterns) {
      if (content.toLowerCase().includes(pat.toLowerCase())) {
        throw new Error(`AI trace found in ${f}: "${pat}"`);
      }
    }
  }
}
