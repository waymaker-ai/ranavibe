import chalk from 'chalk';
import prompts from 'prompts';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Database Setup Command
 * Interactive wizard for setting up database with Supabase or Prisma
 */
export async function dbSetup() {
  console.log(chalk.bold.cyan('\n🗄️  RANA Database Setup\n'));

  // Check for existing setup
  const hasPrisma = fs.existsSync('prisma/schema.prisma');
  const hasSupabase = fs.existsSync('.env') && fs.readFileSync('.env', 'utf-8').includes('SUPABASE');

  if (hasPrisma || hasSupabase) {
    console.log(chalk.yellow('⚠️  Existing database configuration detected.'));
    const { continue: shouldContinue } = await prompts({
      type: 'confirm',
      name: 'continue',
      message: 'Continue with setup? This may overwrite existing configuration.',
      initial: false,
    });

    if (!shouldContinue) {
      console.log(chalk.gray('Setup cancelled.'));
      return;
    }
  }

  // Database provider selection
  const { provider } = await prompts({
    type: 'select',
    name: 'provider',
    message: 'Select database provider:',
    choices: [
      { title: 'Supabase (Recommended)', value: 'supabase', description: 'PostgreSQL with auth and real-time' },
      { title: 'PostgreSQL + Prisma', value: 'postgresql', description: 'Self-hosted PostgreSQL' },
      { title: 'MySQL + Prisma', value: 'mysql', description: 'Self-hosted MySQL' },
      { title: 'SQLite + Prisma', value: 'sqlite', description: 'Local development only' },
    ],
  });

  if (!provider) {
    console.log(chalk.gray('Setup cancelled.'));
    return;
  }

  // Supabase setup
  if (provider === 'supabase') {
    await setupSupabase();
  } else {
    await setupPrisma(provider);
  }
}

/**
 * Setup Supabase with Prisma
 */
async function setupSupabase() {
  console.log(chalk.cyan('\n📦 Setting up Supabase...\n'));

  // Check if Supabase is installed
  const hasSdk = fs.existsSync('node_modules/@supabase/supabase-js');

  if (!hasSdk) {
    console.log(chalk.yellow('Installing @supabase/supabase-js...'));
    try {
      execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to install Supabase SDK'));
      return;
    }
  }

  // Get Supabase credentials
  const { url, anonKey } = await prompts([
    {
      type: 'text',
      name: 'url',
      message: 'Supabase Project URL:',
      validate: (value) => value.startsWith('https://') || 'Must be a valid URL',
    },
    {
      type: 'text',
      name: 'anonKey',
      message: 'Supabase Anon Key:',
      validate: (value) => value.length > 0 || 'Anon key is required',
    },
  ]);

  if (!url || !anonKey) {
    console.log(chalk.gray('Setup cancelled.'));
    return;
  }

  // Update .env file
  const envPath = '.env';
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Remove old Supabase keys if they exist
  envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*\n?/g, '');
  envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\n?/g, '');
  envContent = envContent.replace(/SUPABASE_URL=.*\n?/g, '');
  envContent = envContent.replace(/SUPABASE_ANON_KEY=.*\n?/g, '');

  // Add new keys
  envContent += `\n# Supabase Configuration\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`;

  fs.writeFileSync(envPath, envContent);

  // Create Supabase client
  const libDir = 'lib';
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const supabaseClient = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
});

export type Database = any; // Replace with generated types
`;

  fs.writeFileSync(path.join(libDir, 'supabase.ts'), supabaseClient);

  console.log(chalk.green('\n✅ Supabase setup complete!\n'));
  console.log(chalk.gray('Next steps:'));
  console.log(chalk.gray('  1. Run: npx supabase login'));
  console.log(chalk.gray('  2. Run: npx supabase init'));
  console.log(chalk.gray('  3. Run: aads db:migrate'));
  console.log(chalk.gray('  4. Generate types: npx supabase gen types typescript --local > lib/database.types.ts\n'));
}

/**
 * Setup Prisma
 */
async function setupPrisma(provider: string) {
  console.log(chalk.cyan(`\n📦 Setting up Prisma with ${provider}...\n`));

  // Check if Prisma is installed
  const hasPrisma = fs.existsSync('node_modules/@prisma/client');

  if (!hasPrisma) {
    console.log(chalk.yellow('Installing Prisma...'));
    try {
      execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to install Prisma'));
      return;
    }
  }

  // Get database URL
  const { databaseUrl } = await prompts({
    type: 'text',
    name: 'databaseUrl',
    message: `Database connection URL (${provider}):`,
    initial: provider === 'sqlite' ? 'file:./dev.db' : '',
  });

  if (!databaseUrl) {
    console.log(chalk.gray('Setup cancelled.'));
    return;
  }

  // Initialize Prisma
  try {
    execSync(`npx prisma init --datasource-provider ${provider}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(chalk.yellow('Prisma already initialized'));
  }

  // Update .env
  const envPath = '.env';
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  envContent = envContent.replace(/DATABASE_URL=.*\n?/g, '');
  envContent += `\nDATABASE_URL="${databaseUrl}"\n`;

  fs.writeFileSync(envPath, envContent);

  console.log(chalk.green('\n✅ Prisma setup complete!\n'));
  console.log(chalk.gray('Next steps:'));
  console.log(chalk.gray('  1. Edit: prisma/schema.prisma'));
  console.log(chalk.gray('  2. Run: npx prisma migrate dev --name init'));
  console.log(chalk.gray('  3. Run: npx prisma generate\n'));
}

/**
 * Database Migration Command
 */
export async function dbMigrate() {
  console.log(chalk.bold.cyan('\n🔄 Running database migrations...\n'));

  const hasPrisma = fs.existsSync('prisma/schema.prisma');
  const hasSupabase = fs.existsSync('supabase');

  if (hasSupabase) {
    console.log(chalk.cyan('Running Supabase migrations...'));
    try {
      execSync('npx supabase db push', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Supabase migrations complete!'));
    } catch (error) {
      console.error(chalk.red('Migration failed'));
    }
  } else if (hasPrisma) {
    console.log(chalk.cyan('Running Prisma migrations...'));
    try {
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Prisma migrations complete!'));
    } catch (error) {
      console.error(chalk.red('Migration failed'));
    }
  } else {
    console.log(chalk.red('❌ No database configuration found.'));
    console.log(chalk.gray('Run: aads db:setup'));
  }
}

/**
 * Database Seed Command
 */
export async function dbSeed() {
  console.log(chalk.bold.cyan('\n🌱 Seeding database...\n'));

  const seedFile = 'prisma/seed.ts';

  if (!fs.existsSync(seedFile)) {
    console.log(chalk.yellow('⚠️  No seed file found.'));

    const { create } = await prompts({
      type: 'confirm',
      name: 'create',
      message: 'Create a seed file?',
      initial: true,
    });

    if (create) {
      const seedTemplate = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Add your seed data here
  // Example:
  // await prisma.user.create({
  //   data: {
  //     email: 'test@example.com',
  //     name: 'Test User',
  //   },
  // });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
      fs.writeFileSync(seedFile, seedTemplate);
      console.log(chalk.green(`✅ Created ${seedFile}`));
      console.log(chalk.gray('Edit the file and run: aads db:seed'));
    }
    return;
  }

  try {
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log(chalk.green('\n✅ Database seeded!'));
  } catch (error) {
    console.error(chalk.red('Seeding failed'));
  }
}

/**
 * Database Reset Command
 */
export async function dbReset() {
  console.log(chalk.bold.yellow('\n⚠️  Database Reset\n'));
  console.log(chalk.red('This will DELETE ALL DATA in your database!'));

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Are you sure you want to reset the database?',
    initial: false,
  });

  if (!confirm) {
    console.log(chalk.gray('Reset cancelled.'));
    return;
  }

  try {
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    console.log(chalk.green('\n✅ Database reset complete!'));
  } catch (error) {
    console.error(chalk.red('Reset failed'));
  }
}

/**
 * Database Studio Command
 */
export async function dbStudio() {
  console.log(chalk.bold.cyan('\n🎨 Opening Prisma Studio...\n'));

  try {
    execSync('npx prisma studio', { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Failed to open Prisma Studio'));
  }
}

/**
 * Database Status Command
 */
export async function dbStatus() {
  console.log(chalk.bold.cyan('\n📊 Database Status\n'));

  const hasPrisma = fs.existsSync('prisma/schema.prisma');
  const hasSupabase = fs.existsSync('.env') && fs.readFileSync('.env', 'utf-8').includes('SUPABASE');

  console.log(chalk.bold('Configuration:'));
  console.log(`  Prisma: ${hasPrisma ? chalk.green('✓') : chalk.gray('✗')}`);
  console.log(`  Supabase: ${hasSupabase ? chalk.green('✓') : chalk.gray('✗')}`);

  if (hasPrisma) {
    console.log(chalk.bold('\nPrisma Schema:'));
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
    const models = schema.match(/model \w+/g) || [];
    console.log(`  Models: ${models.length}`);
    models.forEach((model) => {
      console.log(`    - ${model.replace('model ', '')}`);
    });
  }

  if (hasSupabase) {
    console.log(chalk.bold('\nSupabase:'));
    const env = fs.readFileSync('.env', 'utf-8');
    const url = env.match(/SUPABASE_URL=(.*)/)?.[1];
    if (url) {
      console.log(`  Project URL: ${chalk.cyan(url)}`);
    }
  }

  console.log();
}
