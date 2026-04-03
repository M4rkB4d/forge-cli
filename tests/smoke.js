import { compose } from '../src/core/composer.js';

// Test 1: Spring Boot backend with no layers (OAuth2 + Azure AD)
console.log('=== Test 1: Spring Boot Backend (no layers) ===');
try {
  const files = compose({
    templateId: 'backend-springboot',
    variables: {
      projectName: 'order-service',
      className: 'OrderService',
      groupId: 'com.bank.orders',
      packageName: 'com.bank.orders.orderservice',
      packagePath: 'com/bank/orders/orderservice',
      artifactName: 'orderservice',
      authPattern: 'OAuth2 + Azure AD',
      messaging: 'None',
    },
    layers: [],
  });

  console.log(`  Generated ${files.length} files:`);
  files.forEach(f => console.log(`    ${f.path}`));

  // Verify key files exist
  const paths = files.map(f => f.path);
  const checks = [
    'pom.xml',
    'Dockerfile',
    '.gitignore',
    'README.md',
    'src/main/java/com/bank/orders/orderservice/OrderServiceApplication.java',
    'src/main/java/com/bank/orders/orderservice/config/SecurityConfig.java',
    'src/main/java/com/bank/orders/orderservice/config/OpenApiConfig.java',
    'src/main/java/com/bank/orders/orderservice/config/WebMvcConfig.java',
    'src/main/java/com/bank/orders/orderservice/config/JpaConfig.java',
    'src/main/java/com/bank/orders/orderservice/exception/GlobalExceptionHandler.java',
    'src/main/java/com/bank/orders/orderservice/exception/DuplicateResourceException.java',
    'src/main/java/com/bank/orders/orderservice/exception/AuthorizationException.java',
    'src/main/java/com/bank/orders/orderservice/util/CorrelationIdFilter.java',
    'src/main/java/com/bank/orders/orderservice/util/MaskingUtil.java',
    'src/main/resources/application.yml',
    'src/main/resources/application-sit.yml',
    'src/main/resources/application-uat.yml',
    'src/test/java/com/bank/orders/orderservice/config/TestContainersConfig.java',
    'src/test/java/com/bank/orders/orderservice/controller/ActuatorHealthTest.java',
    'src/test/java/com/bank/orders/orderservice/OrderServiceApplicationTests.java',
    'docs/adr/001-initial-architecture.md',
  ];

  let pass = true;
  for (const check of checks) {
    if (!paths.includes(check)) {
      console.log(`  FAIL: Missing ${check}`);
      pass = false;
    }
  }

  // Verify old files are NOT generated
  const mustNotExist = [
    'src/main/java/com/bank/orders/orderservice/controller/HealthController.java',
    'src/main/java/com/bank/orders/orderservice/filter/CorrelationIdFilter.java',
    'src/main/java/com/bank/orders/orderservice/config/CorsConfig.java',
    'src/main/java/com/bank/orders/orderservice/config/SwaggerConfig.java',
  ];
  for (const check of mustNotExist) {
    if (paths.includes(check)) {
      console.log(`  FAIL: Should NOT exist: ${check}`);
      pass = false;
    }
  }

  // Verify pom.xml content
  const pom = files.find(f => f.path === 'pom.xml');
  if (!pom.content.includes('com.bank.orders')) {
    console.log('  FAIL: pom.xml not rendered');
    pass = false;
  }
  if (!pom.content.includes('spring-boot-starter-webmvc')) {
    console.log('  FAIL: pom.xml should use spring-boot-starter-webmvc (Boot 4)');
    pass = false;
  }
  if (!pom.content.includes('spring-boot-starter-security-oauth2-resource-server')) {
    console.log('  FAIL: OAuth2 resource server not in pom.xml');
    pass = false;
  }
  if (!pom.content.includes('resilience4j-spring-boot4')) {
    console.log('  FAIL: Resilience4j not in pom.xml');
    pass = false;
  }
  if (pom.content.includes('h2database') || pom.content.includes('com.h2database')) {
    console.log('  FAIL: H2 should not be in pom.xml');
    pass = false;
  }
  if (!pom.content.includes('<java.version>21</java.version>')) {
    console.log('  FAIL: Java version should be hardcoded to 21');
    pass = false;
  }
  if (!pom.content.includes('4.0.5')) {
    console.log('  FAIL: Spring Boot version should be 4.0.5');
    pass = false;
  }

  // Verify Dockerfile uses Java 21 hardcoded
  const dockerfile = files.find(f => f.path === 'Dockerfile');
  if (!dockerfile.content.includes('temurin:21')) {
    console.log('  FAIL: Dockerfile should use Java 21');
    pass = false;
  }
  if (!dockerfile.content.includes('appuser')) {
    console.log('  FAIL: Dockerfile should have non-root user');
    pass = false;
  }

  // Verify SecurityConfig has JWT converter for OAuth2
  const secConfig = files.find(f => f.path.includes('SecurityConfig'));
  if (!secConfig.content.includes('jwtAuthConverter')) {
    console.log('  FAIL: SecurityConfig missing JWT auth converter');
    pass = false;
  }
  if (!secConfig.content.includes('@EnableMethodSecurity')) {
    console.log('  FAIL: SecurityConfig missing @EnableMethodSecurity');
    pass = false;
  }

  if (pass) console.log('  PASS');
} catch (err) {
  console.log(`  ERROR: ${err.message}`);
  console.log(err.stack);
}

// Test 2: Express BFF
console.log('\n=== Test 2: Express BFF ===');
try {
  const files = compose({
    templateId: 'bff-express',
    variables: {
      projectName: 'api-gateway',
      className: 'ApiGateway',
      packageName: '',
      packagePath: '',
      artifactName: 'apigateway',
      authPattern: 'None',
    },
    layers: [],
  });

  console.log(`  Generated ${files.length} files:`);
  files.forEach(f => console.log(`    ${f.path}`));

  const pkg = files.find(f => f.path === 'package.json');
  if (pkg && pkg.content.includes('api-gateway')) {
    console.log('  PASS');
  } else {
    console.log('  FAIL: package.json not rendered correctly');
  }
} catch (err) {
  console.log(`  ERROR: ${err.message}`);
  console.log(err.stack);
}

// Test 3: Vite SPA
console.log('\n=== Test 3: React + Vite SPA ===');
try {
  const files = compose({
    templateId: 'frontend-vite',
    variables: {
      projectName: 'admin-portal',
      className: 'AdminPortal',
      packageName: '',
      packagePath: '',
      artifactName: 'adminportal',
      authPattern: 'Azure AD (MSAL)',
      uiLibrary: 'Tailwind CSS',
    },
    layers: [],
  });

  console.log(`  Generated ${files.length} files:`);
  files.forEach(f => console.log(`    ${f.path}`));

  const pkg = files.find(f => f.path === 'package.json');
  if (pkg && pkg.content.includes('@azure/msal-browser') && pkg.content.includes('tailwindcss')) {
    console.log('  PASS');
  } else {
    console.log('  FAIL: Conditional deps not rendered');
  }
} catch (err) {
  console.log(`  ERROR: ${err.message}`);
  console.log(err.stack);
}

// Test 4: Spring Boot backend WITH azure-sql layer
console.log('\n=== Test 4: Spring Boot + Azure SQL Layer ===');
try {
  const files = compose({
    templateId: 'backend-springboot',
    variables: {
      projectName: 'user-service',
      className: 'UserService',
      groupId: 'com.bank.users',
      packageName: 'com.bank.users.userservice',
      packagePath: 'com/bank/users/userservice',
      artifactName: 'userservice',
      authPattern: 'None',
      messaging: 'None',
      dbName: 'userdb',
    },
    layers: ['azure-sql'],
  });

  console.log(`  Generated ${files.length} files:`);
  files.forEach(f => console.log(`    ${f.path}`));

  // Check that the migration file was added
  const migration = files.find(f => f.path.includes('V1__init.sql'));
  if (!migration) {
    console.log('  FAIL: Migration file not added from layer');
  }

  // Check pom.xml was merged with Key Vault dep from azure-sql layer
  const pom = files.find(f => f.path === 'pom.xml');
  if (pom && pom.content.includes('spring-boot-starter-data-jpa')) {
    console.log('  PASS');
  } else {
    console.log('  FAIL: pom.xml missing JPA dep');
  }
} catch (err) {
  console.log(`  ERROR: ${err.message}`);
  console.log(err.stack);
}

// Test 5: authPattern=None — SecurityConfig still renders, Dockerfile uses Java 21
console.log('\n=== Test 5: authPattern=None ===');
try {
  const files = compose({
    templateId: 'backend-springboot',
    variables: {
      projectName: 'internal-svc',
      className: 'InternalSvc',
      groupId: 'com.bank.internal',
      packageName: 'com.bank.internal.internalsvc',
      packagePath: 'com/bank/internal/internalsvc',
      artifactName: 'internalsvc',
      authPattern: 'None',
      messaging: 'None',
    },
    layers: [],
  });

  let pass = true;

  // SecurityConfig should ALWAYS exist now (security is non-negotiable)
  const secConfig = files.find(f => f.path.includes('SecurityConfig'));
  if (!secConfig) {
    console.log('  FAIL: SecurityConfig should always exist');
    pass = false;
  } else if (secConfig.content.includes('jwtAuthConverter')) {
    console.log('  FAIL: SecurityConfig should NOT have JWT converter when auth=None');
    pass = false;
  }

  // Dockerfile should always use Java 21 (hardcoded)
  const dockerfile = files.find(f => f.path === 'Dockerfile');
  if (!dockerfile || !dockerfile.content.includes('temurin:21')) {
    console.log('  FAIL: Dockerfile should use Java 21');
    pass = false;
  }

  // No H2 anywhere
  const allContent = files.map(f => f.content).join('\n');
  if (allContent.includes('com.h2database') || allContent.includes('H2Dialect') || allContent.includes('h2:mem')) {
    console.log('  FAIL: H2 references found — should be SQL Server only');
    pass = false;
  }

  if (pass) console.log('  PASS');
} catch (err) {
  console.log(`  ERROR: ${err.message}`);
  console.log(err.stack);
}

// Test 6: Kafka messaging option
console.log('\n=== Test 6: Kafka Messaging ===');
try {
  const files = compose({
    templateId: 'backend-springboot',
    variables: {
      projectName: 'event-service',
      className: 'EventService',
      groupId: 'com.bank.events',
      packageName: 'com.bank.events.eventservice',
      packagePath: 'com/bank/events/eventservice',
      artifactName: 'eventservice',
      authPattern: 'JWT',
      messaging: 'Kafka',
    },
    layers: [],
  });

  let pass = true;

  const pom = files.find(f => f.path === 'pom.xml');
  if (!pom.content.includes('spring-boot-starter-kafka')) {
    console.log('  FAIL: pom.xml should include spring-boot-starter-kafka');
    pass = false;
  }
  if (pom.content.includes('servicebus')) {
    console.log('  FAIL: pom.xml should NOT include Service Bus when messaging=Kafka');
    pass = false;
  }

  const appYml = files.find(f => f.path === 'src/main/resources/application.yml');
  if (!appYml.content.includes('kafka')) {
    console.log('  FAIL: application.yml should include Kafka config');
    pass = false;
  }

  // JWT auth should have ROLE_ prefix (not APPROLE_)
  const secConfig = files.find(f => f.path.includes('SecurityConfig'));
  if (!secConfig.content.includes('ROLE_')) {
    console.log('  FAIL: JWT auth should use ROLE_ prefix');
    pass = false;
  }

  if (pass) console.log('  PASS');
} catch (err) {
  console.log(`  ERROR: ${err.message}`);
  console.log(err.stack);
}
