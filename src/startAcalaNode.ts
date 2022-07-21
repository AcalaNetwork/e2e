import { spawn, ChildProcess } from 'child_process';
import getPort, { portNumbers } from 'get-port';

export const SPAWNING_TIME = 120_000;

const BINARY_PATH = process.env.BINARY_PATH;
const DISPLAY_LOG = process.env.LOG || false;
const ACALA_LOG = process.env.ACALA_LOG || 'info';

const DOCKER_IMAGE = 'ghcr.io/acalanetwork/mandala-node:sha-0910ce3';

export const startAcalaNode = async (): Promise<{
  binary: ChildProcess;
  WS_PORT: number;
  RPC_PORT: number;
  P2P_PORT: number;
}> => {
  const P2P_PORT = await getPort({ port: portNumbers(19931, 22000) });
  const RPC_PORT = await getPort({ port: portNumbers(19931, 22000) });
  const WS_PORT = await getPort({ port: portNumbers(19931, 22000) });

  const cmd = BINARY_PATH || 'docker';

  const DOCKER_ARGS =
    cmd === 'docker'
      ? [
          `run`,
          `-p=${P2P_PORT}:${P2P_PORT}`,
          `-p=${WS_PORT}:${WS_PORT}`,
          `-p=${RPC_PORT}:${RPC_PORT}`,
          `${DOCKER_IMAGE}`
        ]
      : [];

  const args = [
    ...DOCKER_ARGS,
    `--dev`,
    `--instant-sealing`,
    `--execution=native`, // Faster execution using native
    `--no-telemetry`,
    `--no-prometheus`,
    `--port=${P2P_PORT}`,
    `--rpc-port=${RPC_PORT}`,
    `--rpc-external`,
    `--ws-port=${WS_PORT}`,
    `--ws-external`,
    `--rpc-cors=all`,
    `--rpc-methods=unsafe`,
    `-l${ACALA_LOG}`,
    `--tmp`
  ];

  const binary = spawn(cmd, args);

  binary.on('error', (err) => {
    if ((err as any).errno === 'ENOENT') {
      console.error(`\x1b[31mMissing binary (${cmd})\x1b[0m`);
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
    }, SPAWNING_TIME);

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

  return { binary, WS_PORT, RPC_PORT, P2P_PORT };
};
