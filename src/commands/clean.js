import { resolve, basename, relative, sep, join, dirname } from 'path';
import { existsSync, readdirSync, statSync, unlinkSync, rmdirSync } from 'fs';
import * as p from '@clack/prompts';
import { promptUser } from '../core/prompter.js';
import { compose } from '../core/composer.js';

/**
 * Directories that are NEVER touched by forge clean.
 * These are created by tools/IDEs/build systems, not by the template.
 */
const PROTECTED_DIRS = new Set(['.git', 'target', 'build', '.idea', '.vscode', 'node_modules', '.gradle']);

/**
 * Files that are NEVER touched by forge clean.
 * These are created by package managers or build tools, not by the template.
 */
const PROTECTED_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env', '.env.local']);

/**
 * `forge clean` — remove scaffold files that no longer exist in the current template.
 *
 * How it works:
 * 1. Ask the user the same prompts as forge init (template, auth, messaging, etc.)
 * 2. Run compose() to get the list of files the current template WOULD generate
 * 3. Walk the project directory and find files NOT in that list
 * 4. Show the orphan list and ask for confirmation
 * 5. Delete the orphans and clean up empty directories
 */
export async function cleanAction(opts) {
  try {
    const targetDir = resolve(opts.output || '.');

    if (!existsSync(targetDir)) {
      p.cancel(`Directory not found: ${targetDir}`);
      return process.exit(1);
    }

    // Derive default project name from directory (same as forge init)
    const dirName = basename(targetDir);
    const sanitized = dirName
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/gi, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    p.intro('Forge Clean');
    p.note(
      'Answer the same prompts you used when creating this project.\n' +
      'This tells forge which files SHOULD exist — everything else gets removed.',
      'How it works',
    );

    const config = await promptUser({ defaultName: sanitized, ...opts });
    const files = compose(config);
    const templatePaths = new Set(files.map(f => f.path));

    // Walk the project and find orphans (exclude protected files like package-lock.json)
    const allFiles = walkProject(targetDir);
    const orphans = allFiles.filter(f => !templatePaths.has(f) && !PROTECTED_FILES.has(basename(f)));

    if (orphans.length === 0) {
      p.outro('No orphan files found — project matches the current template.');
      return;
    }

    if (opts.dryRun) {
      console.log(`\n  Dry run — ${orphans.length} file(s) would be deleted:\n`);
      orphans.forEach(f => console.log(`    ${f}`));
      console.log('');
      return;
    }

    // Show what will be deleted and confirm
    p.note(
      orphans.map(f => `  ${f}`).join('\n'),
      `${orphans.length} orphan file(s) to remove`,
    );

    const confirm = await p.confirm({
      message: 'Delete these files?',
    });
    if (!confirm || p.isCancel(confirm)) {
      p.cancel('Aborted — no files deleted.');
      return process.exit(0);
    }

    // Delete orphans
    let deleted = 0;
    for (const file of orphans) {
      const fullPath = join(targetDir, file);
      try {
        unlinkSync(fullPath);
        deleted++;
      } catch (err) {
        console.log(`  Warning: could not delete ${file} — ${err.message}`);
      }
    }

    // Clean up empty directories left behind
    const emptied = cleanEmptyDirs(targetDir);

    console.log(`\n  Removed ${deleted} file(s)${emptied > 0 ? ` and ${emptied} empty folder(s)` : ''}`);
    p.outro('Clean complete. Run forge init to re-scaffold.');

  } catch (err) {
    p.cancel(`Error: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Walks the project directory, returning relative paths of all files.
 * Skips protected directories (.git, target, node_modules, etc.).
 */
function walkProject(baseDir) {
  const results = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (PROTECTED_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        results.push(relative(baseDir, full).replaceAll(sep, '/'));
      }
    }
  }

  walk(baseDir);
  return results;
}

/**
 * Recursively removes empty directories (bottom-up).
 * Never removes protected directories or the root.
 */
function cleanEmptyDirs(baseDir) {
  let count = 0;

  function sweep(dir) {
    for (const entry of readdirSync(dir)) {
      if (PROTECTED_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        sweep(full);
        // After sweeping children, check if now empty
        const remaining = readdirSync(full);
        if (remaining.length === 0) {
          rmdirSync(full);
          count++;
        }
      }
    }
  }

  sweep(baseDir);
  return count;
}
