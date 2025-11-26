import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';

interface TeamOptions {
  list?: boolean;
  add?: string;
  remove?: string;
  role?: string;
}

interface TeamMember {
  email: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
  joinedAt: string;
}

export async function teamCommand(options: TeamOptions) {
  const authToken = await getAuthToken();
  if (!authToken) {
    console.log(chalk.red('❌ Not authenticated. Run: waymaker-rana login'));
    return;
  }

  if (options.list) {
    await listTeamMembers(authToken);
  } else if (options.add) {
    await addTeamMember(authToken, options.add, options.role as any || 'developer');
  } else if (options.remove) {
    await removeTeamMember(authToken, options.remove);
  } else {
    await interactiveTeamManagement(authToken);
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const configPath = path.join(process.env.HOME || '', '.waymaker', 'config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    return config.authToken || null;
  } catch {
    return null;
  }
}

async function listTeamMembers(token: string) {
  const spinner = ora('Fetching team members...').start();

  try {
    const members = await fetchTeamMembers(token);
    spinner.succeed('Team members loaded');

    console.log(chalk.bold.cyan('\n👥 Team Members\n'));

    if (members.length === 0) {
      console.log(chalk.gray('No team members yet. Add members to collaborate on RANA standards.'));
      return;
    }

    members.forEach(member => {
      const roleColor = member.role === 'admin' ? chalk.red : member.role === 'developer' ? chalk.blue : chalk.gray;
      console.log(`  ${chalk.bold(member.name)} ${chalk.gray(`<${member.email}>`)}`);
      console.log(`    Role: ${roleColor(member.role)}`);
      console.log(`    Joined: ${chalk.gray(new Date(member.joinedAt).toLocaleDateString())}`);
      console.log();
    });

    console.log(chalk.gray(`Total members: ${members.length}`));
  } catch (error: any) {
    spinner.fail(`Failed to fetch team: ${error.message}`);
  }
}

async function addTeamMember(token: string, email: string, role: TeamMember['role']) {
  const spinner = ora(`Adding ${email} as ${role}...`).start();

  try {
    // TODO: Replace with actual API call
    // await fetch('https://api.waymaker.com/v1/team/members', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ email, role })
    // });

    spinner.succeed(`Added ${email} to team`);
    console.log(chalk.green(`\n✅ ${email} will receive an invitation email`));
  } catch (error: any) {
    spinner.fail(`Failed to add member: ${error.message}`);
  }
}

async function removeTeamMember(token: string, email: string) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Remove ${email} from team?`,
    default: false
  }]);

  if (!confirm) return;

  const spinner = ora(`Removing ${email}...`).start();

  try {
    // TODO: Replace with actual API call
    spinner.succeed(`Removed ${email} from team`);
  } catch (error: any) {
    spinner.fail(`Failed to remove member: ${error.message}`);
  }
}

async function interactiveTeamManagement(token: string) {
  const members = await fetchTeamMembers(token);

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'View team members', value: 'list' },
      { name: 'Add team member', value: 'add' },
      { name: 'Remove team member', value: 'remove' },
      { name: 'Change member role', value: 'role' },
      { name: 'Team settings', value: 'settings' }
    ]
  }]);

  switch (action) {
    case 'list':
      await listTeamMembers(token);
      break;
    case 'add':
      const { email, role } = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Team member email:',
          validate: (input) => input.includes('@') || 'Please enter a valid email'
        },
        {
          type: 'list',
          name: 'role',
          message: 'Role:',
          choices: [
            { name: 'Developer - Can run checks and view analytics', value: 'developer' },
            { name: 'Admin - Full team management access', value: 'admin' },
            { name: 'Viewer - Read-only access', value: 'viewer' }
          ]
        }
      ]);
      await addTeamMember(token, email, role);
      break;
    case 'remove':
      if (members.length === 0) {
        console.log(chalk.yellow('No team members to remove'));
        return;
      }
      const { memberToRemove } = await inquirer.prompt([{
        type: 'list',
        name: 'memberToRemove',
        message: 'Select member to remove:',
        choices: members.map(m => ({ name: `${m.name} (${m.email})`, value: m.email }))
      }]);
      await removeTeamMember(token, memberToRemove);
      break;
    case 'settings':
      console.log(chalk.cyan('\n⚙️  Team Settings'));
      console.log('Visit: https://waymaker.com/team/settings');
      break;
  }
}

async function fetchTeamMembers(token: string): Promise<TeamMember[]> {
  // TODO: Replace with actual API call
  // const response = await fetch('https://api.waymaker.com/v1/team/members', {
  //   headers: { Authorization: `Bearer ${token}` }
  // });
  // return response.json();

  // Mock data for now
  return [
    {
      email: 'team@waymaker.com',
      name: 'Team Member',
      role: 'developer',
      joinedAt: new Date().toISOString()
    }
  ];
}
