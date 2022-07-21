import { ChildProcess } from 'child_process';

import { startAcalaNode } from './startAcalaNode';
import { Context, setup } from './setup';

const SPAWNING_TIME = 120_000;

export function describeWithAcala(title: string, cb: (context: Context) => void, timeout: number = SPAWNING_TIME) {
  describe(title, function () {
    const context: Context = {} as Context;
    let process: ChildProcess;
    // Making sure the Acala node has started
    beforeAll(async function () {
      const { binary, WS_PORT } = await startAcalaNode();
      const ctx = await setup({ ws: `ws://localhost:${WS_PORT}`, suri: '//Alice' });
      Object.assign(context, ctx);
      process = binary;
      await context.api.isReady;
    }, timeout);

    afterAll(async function () {
      await context.api.disconnect();
      process.kill();
    });

    cb(context);
  });
}
