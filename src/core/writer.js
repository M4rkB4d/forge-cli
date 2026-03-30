import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

/**
 * Writes composed files to the output directory.
 */
export function writeProject(files, outputDir, options = {}) {
  if (options.dryRun) {
    console.log('\nDry run — files that would be created:\n');
    for (const file of files) {
      console.log(`  ${file.path}`);
    }
    return;
  }

  mkdirSync(outputDir, { recursive: true });

  let count = 0;
  for (const file of files) {
    const fullPath = join(outputDir, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
    count++;
  }

  console.log(`\n  Created ${count} files in ${outputDir}\n`);

  if (options.existingRepo) {
    commitScaffold(outputDir);
  } else if (options.git !== false) {
    initGit(outputDir);
  }

  if (options.install !== false) {
    installDeps(outputDir, files);
  }
}

function initGit(dir) {
  try {
    execSync('git init', { cwd: dir, stdio: 'pipe' });
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "Initial project scaffold"', {
      cwd: dir,
      stdio: 'pipe',
    });
    console.log('  Git initialized with initial commit');
  } catch {
    console.log('  Git init skipped (git not available or error)');
  }
}

function commitScaffold(dir) {
  try {
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "Scaffold project via forge init"', {
      cwd: dir,
      stdio: 'pipe',
    });
    console.log('  Scaffold committed to existing repository');
  } catch {
    console.log('  Git commit skipped (nothing to commit or git error)');
  }
}

function installDeps(dir, files) {
  const hasPom = files.some(f => f.path === 'pom.xml');
  const hasPackageJson = files.some(f => f.path === 'package.json');

  if (hasPom && existsSync(join(dir, 'mvnw'))) {
    console.log('  Running Maven wrapper setup...');
    try {
      execSync('./mvnw validate', { cwd: dir, stdio: 'pipe', timeout: 60000 });
      console.log('  Maven dependencies resolved');
    } catch {
      console.log('  Maven setup skipped (run ./mvnw validate manually)');
    }
  }

  if (hasPackageJson) {
    console.log('  Installing npm dependencies...');
    try {
      execSync('npm install', { cwd: dir, stdio: 'pipe', timeout: 120000 });
      console.log('  npm dependencies installed');
    } catch {
      console.log('  npm install skipped (run npm install manually)');
    }
  }
}
