import assert from 'assert';
import _ from 'lodash';
import { ApiManager } from '@open-web3/api';
import { Codec } from '@polkadot/types-codec/types';
import { H256 } from '@polkadot/types/interfaces';

export async function queryRemoteChainState(
  wsUrl: string,
  storageConfig: Record<string, null | Record<string, null | Array<any>>>,
  at?: string // latest hash if not specified
): Promise<[string, string][]> {
  const rawStorage = [] as [string, string][];
  const apiManager = await ApiManager.create({ wsEndpoint: wsUrl });

  let blockHash: string;
  if (at) {
    blockHash = at;
  } else {
    const hash = await apiManager.api.rpc.chain.getBlockHash<H256>();
    blockHash = hash.toHex();
  }

  const apiAt = await apiManager.api.at(blockHash);

  for (const palletName of Object.keys(storageConfig)) {
    const palletConfig = storageConfig[palletName];

    const pallet = apiManager.api.runtimeMetadata.asLatest.pallets.find((x) => x.name.toString() === palletName);
    assert(pallet, `pallet ${palletName} not found`);
    const keys = _.keys(palletConfig);

    const storages = pallet.storage
      .unwrapOrDefault()
      .items.filter((x) => (keys.length ? keys.includes(x.name.toString()) : true));

    for (const storage of storages) {
      const storageName = storage.name.toString();
      const queryKey = apiManager.api.query[_.camelCase(palletName)][_.camelCase(storageName)];
      const queryStorage = apiAt.query[_.camelCase(palletName)][_.camelCase(storageName)];
      assert(queryStorage, `storage ${palletName}:${storageName} not found`);

      if (storage.type.isPlain) {
        const value = (await queryStorage()) as Codec;
        rawStorage.push([queryStorage.key(), value.toHex(true)]);
      } else {
        const keys = palletConfig ? palletConfig[storageName] : [];
        // no keys specified, query all keys
        if (_.isEmpty(keys)) {
          const entries = await queryStorage.entries();
          entries.forEach(([key, value]) => {
            rawStorage.push([key.toString(), value.isEmpty ? '0x' : value.toHex(true)]);
          });
        } else {
          assert(
            Array.isArray(keys),
            'invalid keys format, must be an array of keys i.e: `{ pallet: { storage: [key1, key2, ...] } }`'
          );
          const doubleMap = storage.type.asMap.hashers.length === 2;
          for (const key of keys) {
            if (doubleMap)
              assert(
                Array.isArray(key),
                'invalid keys format, dubleMap keys needs to be nested i.e: `{ pallet: { storage: [[key1, key2], ...] } }`'
              );
            const params = doubleMap ? key : [key];
            const value = (await queryStorage(...params)) as Codec;
            rawStorage.push([queryKey.key(...params), value.isEmpty ? '0x' : value.toHex(true)]);
          }
        }
      }
    }
  }
  await apiManager.api.disconnect();
  return rawStorage;
}
