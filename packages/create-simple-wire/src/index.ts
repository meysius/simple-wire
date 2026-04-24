#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'node:path';
import prompts from 'prompts';
import { red, green, cyan, bold } from 'kleur/colors';

const SIMPLE_WIRE_VERSION = '0.0.2';

async function init() {
  console.log(bold(cyan('\n⚡  Creating a new Simple Wire application\n')));

  const response = await prompts({
    type: 'text',
    name: 'projectName',
    message: 'What is the name of your project?',
    initial: 'my-simple-app',
    validate: (value) => {
      if (!value.trim()) return 'Project name cannot be empty';
      if (fs.existsSync(value) && fs.readdirSync(value).length > 0) {
        return 'Directory already exists and is not empty';
      }
      return true;
    }
  });

  if (!response.projectName) {
    console.log(red('✖ Operation cancelled'));
    process.exit(1);
  }

  const targetDir = path.join(process.cwd(), response.projectName);
  const projectName = response.projectName;

  const __dirname = path.dirname(__filename);
  const templateSrc = path.resolve(__dirname, '../template');

  if (!fs.existsSync(templateSrc)) {
    console.error(red(`\n✖ Could not find the template directory.`));
    console.error(`  Expected to find it at: ${templateSrc}`);
    console.error(`  Did you forget to run 'pnpm build'?`);
    process.exit(1);
  }

  console.log(`\nDrafting project in ${bold(targetDir)}...`);

  try {
    await fs.copy(templateSrc, targetDir, {
      // Minimal filter just for OS junk files
      filter: (src) => {
        const basename = path.basename(src);
        return basename !== '.DS_Store' && basename !== 'Thumbs.db';
      }
    });
  } catch (e) {
    console.error(red(`✖ Failed to copy template: ${e}`));
    process.exit(1);
  }

  // Update package.json
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = await fs.readJson(pkgPath);

  pkg.name = projectName;
  pkg.version = '0.1.0';

  // Replace "workspace:*" with "latest" for the end user
  if (pkg.dependencies['simple-wire']) {
    pkg.dependencies['simple-wire'] = SIMPLE_WIRE_VERSION;
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // Handle .env renaming
  const envExample = path.join(targetDir, '.env.example');
  const envTarget = path.join(targetDir, '.env');
  if (fs.existsSync(envExample)) {
    await fs.copy(envExample, envTarget);
  }

  // Handle .gitignore renaming (npm publish renames it to .npmignore usually)
  const gitignorePath = path.join(targetDir, '_gitignore');
  if (fs.existsSync(gitignorePath)) {
    await fs.move(gitignorePath, path.join(targetDir, '.gitignore'));
  }

  console.log(green(`\n✔ Success! Created ${projectName} at ${targetDir}\n`));

  console.log(bold('Next steps:\n'));
  console.log(`  ${cyan('cd')} ${projectName}`);
  console.log(`  ${cyan('pnpm install')}\n`);

  console.log(bold('Configure your environment:\n'));
  console.log(`  1. Edit ${cyan('.env')} file to customize:`);
  console.log(`     - ${cyan('DATABASE_URL')}: PostgreSQL connection string`);
  console.log(`     - ${cyan('PORT')}: Server port (default: 3000)`);
  console.log(`     - ${cyan('LOG_LEVEL')}: Logging level (default: info)\n`);

  console.log(bold('Set up your database:\n'));
  console.log(`  ${cyan('pnpm db:create')}        Create the PostgreSQL database`);
  console.log(`  ${cyan('pnpm db:migrate')}       Apply migrations`);
  console.log(`  ${cyan('pnpm db:studio')}        Open Drizzle Studio (optional)\n`);

  console.log(bold('Start developing:\n'));
  console.log(`  ${cyan('pnpm dev')}              Start the development server`);
  console.log(`  ${cyan('pnpm build')}            Build for production`);
  console.log(`  ${cyan('pnpm start')}            Run production build\n`);
}

init().catch((e) => {
  console.error(e);
});