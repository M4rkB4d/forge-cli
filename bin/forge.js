#!/usr/bin/env node

import { Command } from 'commander';
import { createAction } from '../src/commands/create.js';
import { initAction } from '../src/commands/init.js';
import { listAction } from '../src/commands/list.js';

const program = new Command();

program
  .name('forge')
  .description('Project scaffolding CLI')
  .version('0.1.0');

program
  .command('create')
  .description('Create a new project from a template')
  .argument('[name]', 'project name')
  .option('-t, --template <template>', 'template to use (skip prompt)')
  .option('-o, --output <dir>', 'output directory', '.')
  .option('--no-git', 'skip git initialization')
  .option('--no-install', 'skip dependency installation')
  .option('--dry-run', 'preview files without writing')
  .action(createAction);

program
  .command('init')
  .description('Scaffold a template into the current directory (e.g., an existing cloned repo)')
  .option('-t, --template <template>', 'template to use (skip prompt)')
  .option('-o, --output <dir>', 'target directory', '.')
  .option('--no-git', 'skip git commit')
  .option('--no-install', 'skip dependency installation')
  .option('--dry-run', 'preview files without writing')
  .action(initAction);

program
  .command('list')
  .description('List available templates and layers')
  .action(listAction);

program.parse();
