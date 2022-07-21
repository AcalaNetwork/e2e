import { ChildProcess } from 'child_process';

import { startAcalaNode } from './startAcalaNode';
import { Context, setup } from './setup';

type JestContext = Context & { wsPort: number };

/**
 * Describe jest test with acala context.
 * Will start an Acala node and setup context
 *
 * NOTE: context starts with empty object and becomes ready after setup.
 * So cannot be used directly inside `describeWithAcala`.
 *
 * WARNING: DO NOT deconstruct context
 *
 * EXAMPLE:
 * ```
  describeWithAcala('Acala', (ctx) => {
    it('work', async () => {
      // do something with ctx
    })
  })
 * ```
 *
 * @param title Describe title
 * @param cb Callback context function
 * @param timeout Setup timeout, default 120 sec
 */
export function describeWithAcala(title: string, cb: (context: JestContext) => void, timeout = 120_000) {
  describe(title, function () {
    const context: JestContext = {} as JestContext;
    let process: ChildProcess;
    // Making sure the Acala node has started
    beforeAll(async function () {
      const { binary, WS_PORT } = await startAcalaNode();
      const ctx = await setup({ ws: `ws://localhost:${WS_PORT}`, suri: '//Alice' });
      Object.assign(context, ctx);
      context.wsPort = WS_PORT;
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
