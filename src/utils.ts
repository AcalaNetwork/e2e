import { spawn, ChildProcess } from 'child_process';

export const SPAWNING_TIME = 30_000;

const BINARY_PATH = process.env.BINARY_PATH;
const DISPLAY_LOG = process.env.LOG || false;
const ACALA_LOG = process.env.ACALA_LOG || 'info';

export const startAcalaNode = async (wsPort = 19933): Promise<ChildProcess> => {
  if (!BINARY_PATH) throw Error(`\x1b[31mMissing process.env.BINARY_PATH\x1b[0m`);

  const cmd = BINARY_PATH;
  const args = [
    '--dev',
    '-lruntime=debug',
    '--instant-sealing',
    '--execution=Native',
    '--no-telemetry',
    '--no-prometheus',
    '--no-grandpa',
    `-l${ACALA_LOG}`,
    `--ws-port=${wsPort}`,
    '--tmp'
  ];

  const binary = spawn(cmd, args);

  binary.on('error', (err) => {
    if ((err as any).errno === 'ENOENT') {
      console.error(
        `\x1b[31mMissing Acala binary (${BINARY_PATH}).\nPlease compile the Acala project:\ncargo build\x1b[0m`
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  const binaryLogs: string[] = [];
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      let msg = `Failed to start Acala Node.\n`;
      msg += `Command: ${cmd} ${args.join(' ')}\n`;
      msg += `Logs:\n`;
      msg += binaryLogs.map((chunk) => chunk.toString()).join('\n');
      binary.kill();
      reject(msg);
    }, SPAWNING_TIME - 2000);

    const onData = async (chunk: any) => {
      if (DISPLAY_LOG) {
        console.log(chunk.toString());
      }
      binaryLogs.push(chunk);
      if (chunk.toString().match(/best: #0/)) {
        clearTimeout(timer);
        if (!DISPLAY_LOG) {
          binary.stderr.off('data', onData);
          binary.stdout.off('data', onData);
        }
        resolve();
      }
    };
    binary.stderr.on('data', onData);
    binary.stdout.on('data', onData);
  });

  return binary;
};
