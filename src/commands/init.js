import { resolve, basename } from 'path';
import { existsSync, readdirSync } from 'fs';
import * as p from '@clack/prompts';
import { promptUser } from '../core/prompter.js';
import { compose } from '../core/composer.js';
import { writeProject } from '../core/writer.js';

/**
 * `forge init` — scaffold a template into an existing directory (e.g., a cloned empty repo).
 *
 * Key differences from `forge create`:
 * - Writes into the current (or specified) directory, NOT a subdirectory
 * - Detects .git/ and preserves it — commits scaffold instead of running git init
 * - Uses the directory name as default project name
 * - Warns if directory contains non-trivial files
 */
export async function initAction(opts) {
  try {
    const targetDir = resolve(opts.output || '.');
    const dirName = basename(targetDir);
    const hasGit = existsSync(resolve(targetDir, '.git'));

    // Check for non-trivial existing files
    const ALLOWED_FILES = new Set(['.git', '.gitignore', '.gitattributes', 'README.md', 'readme.md', 'LICENSE', 'license']);
    if (existsSync(targetDir)) {
      const entries = readdirSync(targetDir);
      const unexpected = entries.filter(e => !ALLOWED_FILES.has(e));

      if (unexpected.length > 0) {
        p.note(
          `Found existing files:\n${unexpected.map(f => `  ${f}`).join('\n')}`,
          'Directory is not empty',
        );
        const proceed = await p.confirm({
          message: 'Scaffold anyway? Existing files may be overwritten.',
        });
        if (!proceed || p.isCancel(proceed)) {
          p.cancel('Aborted.');
          return process.exit(0);
        }
      }
    }

    // Prompt for template + variables, passing directory name as default project name
    const config = await promptUser({ name: dirName, ...opts });

    const files = compose(config);

    writeProject(files, targetDir, {
      dryRun: opts.dryRun,
      git: !hasGit ? opts.git : false,       // skip git init if repo exists
      install: opts.install,
      existingRepo: hasGit,                   // signal to commit into existing repo
    });

    if (!opts.dryRun) {
      console.log(`  Project scaffolded in ${targetDir}`);
      console.log('');
      console.log('  Next steps:');
      console.log('    See README.md for setup instructions');
      if (hasGit) {
        console.log('    git push to sync with your remote');
      }
      console.log('');
    }
  } catch (err) {
    p.cancel(`Error: ${err.message}`);
    process.exit(1);
  }
}
