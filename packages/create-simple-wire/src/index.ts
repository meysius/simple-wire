#!/usr/bin/env node
import prompts from 'prompts';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

const COLOR = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message: string, color = COLOR.reset) {
  console.log(`${color}${message}${COLOR.reset}`);
}

function getTemplateDir(): string {
  // When published, template is bundled at ../template
  const bundledTemplate = path.join(__dirname, '..', 'template');
  if (fs.existsSync(bundledTemplate)) {
    return bundledTemplate;
  }

  // During development, use sibling package
  const devTemplate = path.join(__dirname, '..', '..', 'starter-template');
  if (fs.existsSync(devTemplate)) {
    return devTemplate;
  }

  throw new Error('Template not found');
}

function getCoreVersion(): string {
  // Read version from simple-wire package
  const corePkgPath = path.join(__dirname, '..', '..', 'simple-wire', 'package.json');
  if (fs.existsSync(corePkgPath)) {
    const corePkg = fs.readJsonSync(corePkgPath);
    return `^${corePkg.version}`;
  }
  return '^0.1.0';
}

async function main() {
  const args = process.argv.slice(2);
  let projectName = args[0];

  // Skip prompts if --yes flag
  const skipPrompts = args.includes('--yes') || args.includes('-y');

  if (!projectName) {
    if (skipPrompts) {
      log('Project name is required', COLOR.red);
      process.exit(1);
    }

    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-app',
    });

    projectName = response.projectName;
  }

  if (!projectName) {
    log('Project name is required', COLOR.red);
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    log(`Directory "${projectName}" already exists`, COLOR.red);
    process.exit(1);
  }

  log(`\nCreating ${projectName}...`, COLOR.blue);

  // Copy template
  const templateDir = getTemplateDir();
  fs.copySync(templateDir, targetDir, {
    filter: (src) => {
      const basename = path.basename(src);
      // Skip files that shouldn't be copied
      return !['node_modules', 'dist', 'pnpm-lock.yaml', '.env'].includes(basename);
    },
  });

  // Update package.json
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = fs.readJsonSync(pkgPath);

  pkg.name = projectName;
  pkg.version = '0.1.0';

  // Replace workspace protocol with actual version
  if (pkg.dependencies?.['simple-wire'] === 'workspace:*') {
    pkg.dependencies['simple-wire'] = getCoreVersion();
  }

  // Remove private flag if present
  delete pkg.private;

  fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });

  // Rename .env.example to .env if it exists
  const envExample = path.join(targetDir, '.env.example');
  const envFile = path.join(targetDir, '.env');
  if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
    fs.copySync(envExample, envFile);
  }

  // Install dependencies
  log('\nInstalling dependencies...', COLOR.dim);
  try {
    execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });
  } catch {
    log('\npnpm install failed. You can install dependencies manually.', COLOR.red);
  }

  // Success message
  log(`\n✓ Created ${projectName}\n`, COLOR.green);
  log('Next steps:', COLOR.reset);
  log(`  cd ${projectName}`, COLOR.dim);
  log('  pnpm dev', COLOR.dim);
  log('');
}

main().catch((err) => {
  log(err.message, COLOR.red);
  process.exit(1);
});