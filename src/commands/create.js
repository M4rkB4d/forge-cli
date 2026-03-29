import { join, resolve } from 'path';
import { existsSync } from 'fs';
import * as p from '@clack/prompts';
import { promptUser } from '../core/prompter.js';
import { compose } from '../core/composer.js';
import { writeProject } from '../core/writer.js';

export async function createAction(name, opts) {
  try {
    const config = await promptUser({ name, ...opts });
    const outputDir = resolve(opts.output || '.', config.projectName);

    if (existsSync(outputDir)) {
      const overwrite = await p.confirm({
        message: `Directory ${config.projectName} already exists. Overwrite?`,
      });
      if (!overwrite || p.isCancel(overwrite)) {
        p.cancel('Aborted.');
        return process.exit(0);
      }
    }

    const files = compose(config);

    writeProject(files, outputDir, {
      dryRun: opts.dryRun,
      git: opts.git,
      install: opts.install,
    });

    if (!opts.dryRun) {
      console.log(`  Project ready at ./${config.projectName}`);
      console.log('');
      console.log('  Next steps:');
      console.log(`    cd ${config.projectName}`);
      console.log('    See README.md for setup instructions');
      console.log('');
    }
  } catch (err) {
    p.cancel(`Error: ${err.message}`);
    process.exit(1);
  }
}
