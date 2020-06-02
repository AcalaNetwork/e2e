import { options } from '@acala-network/api';
import { ApiPromise, WsProvider } from '@polkadot/api';

const config = {
  ws: 'ws://localhost:9944'
};

test('test', async () => {
  const ws = new WsProvider(config.ws);
  const api = new ApiPromise(options({ provider: ws }));

  await api.isReady;

  const evt = await api.query.system.events();

  console.log(evt.toHuman());

  api.disconnect();
});
