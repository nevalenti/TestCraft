import { Command } from 'commander';

export interface Options {
  command: string;
  apiUrl: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  projectName: string;
  runName: string;
  junitXml?: string;
  keycloakAuthority?: string;
  source?: string;
  screenshotsDir?: string;
  runId?: string;
  dotenvPath?: string;
  file?: string;
}

type Flags = Record<string, string | undefined>;

const opt = (flags: Flags, key: string, envVar: string): string | undefined =>
  flags[key] ?? process.env[envVar] ?? undefined;

const mergeOptions = (command: string, flags: Flags): Options => ({
  command,
  apiUrl: opt(flags, 'apiUrl', 'TESTCRAFT_API_URL') ?? '',
  username: opt(flags, 'username', 'TESTCRAFT_USERNAME') ?? '',
  password: opt(flags, 'password', 'TESTCRAFT_PASSWORD') ?? '',
  clientId: opt(flags, 'clientId', 'TESTCRAFT_CLIENT_ID') ?? '',
  clientSecret: opt(flags, 'clientSecret', 'TESTCRAFT_CLIENT_SECRET') ?? '',
  projectName: opt(flags, 'projectName', 'TESTCRAFT_PROJECT_NAME') ?? '',
  runName:
    opt(flags, 'runName', 'TESTCRAFT_RUN_NAME') ??
    process.env['CI_JOB_NAME'] ??
    '',
  junitXml: opt(flags, 'junitXml', 'TESTCRAFT_JUNIT_XML'),
  keycloakAuthority: opt(
    flags,
    'keycloakAuthority',
    'TESTCRAFT_KEYCLOAK_AUTHORITY',
  ),
  source: opt(flags, 'source', 'TESTCRAFT_SOURCE'),
  screenshotsDir: opt(flags, 'screenshotsDir', 'TESTCRAFT_SCREENSHOTS_DIR'),
  runId: opt(flags, 'runId', 'TESTCRAFT_RUN_ID'),
  dotenvPath: opt(flags, 'dotenv', 'TESTCRAFT_DOTENV_PATH'),
  file: opt(flags, 'file', 'TESTCRAFT_LOG_FILE'),
});

const configureCommand = (cmd: Command): Command =>
  cmd
    .helpOption(false)
    .exitOverride()
    .allowExcessArguments(false)
    .option('--api-url <url>')
    .option('--username <username>')
    .option('--password <password>')
    .option('--client-id <id>')
    .option('--client-secret <secret>')
    .option('--project-name <name>')
    .option('--run-name <name>')
    .option('--keycloak-authority <url>')
    .option('--source <source>');

const buildProgram = (onParsed: (opts: Options) => void): Command => {
  const program = new Command()
    .name('testcraft-ci-reporter')
    .helpOption(false)
    .exitOverride()
    .configureOutput({ writeErr: () => {} });

  configureCommand(program.command('start'))
    .option('--dotenv <path>')
    .action((flags: Flags) => onParsed(mergeOptions('start', flags)));

  configureCommand(program.command('import', { isDefault: true }))
    .option('--junit-xml <path>')
    .option('--run-id <id>')
    .option('--dotenv <path>')
    .option('--screenshots-dir <dir>')
    .action((flags: Flags) => onParsed(mergeOptions('import', flags)));

  configureCommand(program.command('logs'))
    .option('--run-id <id>')
    .option('--file <path>')
    .action((flags: Flags) => onParsed(mergeOptions('logs', flags)));

  return program;
};

export const parseArgs = (argv: string[]): Options => {
  let opts: Options | undefined;
  const program = buildProgram((parsed) => {
    opts = parsed;
  });

  const [maybeCommand] = argv;
  const commandNames = program.commands.map((cmd) => cmd.name());
  if (
    maybeCommand !== undefined &&
    !maybeCommand.startsWith('-') &&
    !commandNames.includes(maybeCommand)
  ) {
    throw new Error(
      `Unknown command "${maybeCommand}" — expected one of: ${commandNames.join(', ')}`,
    );
  }

  program.parse(argv, { from: 'user' });

  if (!opts) throw new Error(`Failed to parse arguments: ${argv.join(' ')}`);
  return opts;
};
