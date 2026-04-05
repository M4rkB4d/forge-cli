import { basename, relative, sep, join } from 'path';
import { readdirSync, statSync, unlinkSync, rmdirSync } from 'fs';

/**
 * Directories that are NEVER touched during cleanup.
 * Created by tools/IDEs/build systems, not by the template.
 */
const PROTECTED_DIRS = new Set(['.git', 'target', 'build', '.idea', '.vscode', 'node_modules', '.gradle']);

/**
 * Files that are NEVER touched during cleanup.
 * Created by package managers or build tools, not by the template.
 */
const PROTECTED_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env', '.env.local']);

/**
 * Walks the project directory, returning relative paths of all files.
 * Skips protected directories (.git, target, node_modules, etc.).
 */
export function walkProject(baseDir) {
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
 * Finds orphan files — files on disk that are NOT in the template output
 * and are NOT protected files (lock files, env files).
 */
export function findOrphans(projectFiles, templatePaths) {
  return projectFiles.filter(f => !templatePaths.has(f) && !PROTECTED_FILES.has(basename(f)));
}

/**
 * Deletes orphan files and removes empty directories left behind.
 * Returns { deleted: number, emptied: number }.
 */
export function removeOrphans(targetDir, orphans) {
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

  const emptied = cleanEmptyDirs(targetDir);
  return { deleted, emptied };
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
