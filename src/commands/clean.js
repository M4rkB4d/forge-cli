import { resolve, basename } from 'path';
import { existsSync } from 'fs';
import * as p from '@clack/prompts';
import { promptUser } from '../core/prompter.js';
import { compose } from '../core/composer.js';
import { walkProject, findOrphans, removeOrphans } from '../core/cleaner.js';

/**
 * `forge clean` — remove scaffold files that no longer exist in the current template.
 *
 * Standalone version of the orphan cleanup that forge init now does automatically.
 * Use this when you want to clean without re-scaffolding.
 */
export async function cleanAction(opts) {
  try {
    const targetDir = resolve(opts.output || '.');

    if (!existsSync(targetDir)) {
      p.cancel(`Directory not found: ${targetDir}`);
      return process.exit(1);
    }

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

    const allFiles = walkProject(targetDir);
    const orphans = findOrphans(allFiles, templatePaths);

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

    const { deleted, emptied } = removeOrphans(targetDir, orphans);
    console.log(`\n  Removed ${deleted} file(s)${emptied > 0 ? ` and ${emptied} empty folder(s)` : ''}`);
    p.outro('Clean complete.');

  } catch (err) {
    p.cancel(`Error: ${err.message}`);
    process.exit(1);
  }
}
