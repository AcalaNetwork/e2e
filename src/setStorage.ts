import assert from 'assert';
import { ApiPromise } from '@polkadot/api';
import { StorageKey, Metadata } from '@polkadot/types';
import { Registry } from '@polkadot/types/types';
import { StorageEntryMetadataLatest } from '@polkadot/types/interfaces';
import { createFunction } from '@polkadot/types/metadata/decorate/storage/createFunction';

import { Context } from './setup';

interface StorageKeyMaker {
  meta: StorageEntryMetadataLatest;
  makeKey: (...keys: any[]) => StorageKey;
}

const storageKeyMaker =
  (registry: Registry, metadata: Metadata) =>
  (section: string, method: string): StorageKeyMaker => {
    const pallet = metadata.asLatest.pallets.filter((x) => x.name.toString() === section)[0];
    assert(pallet);
    const meta = pallet.storage
      .unwrap()
      .items.filter((x) => x.name.toString() === method)[0] as any as StorageEntryMetadataLatest;
    assert(meta);

    const storageFn = createFunction(
      registry,
      {
        meta,
        prefix: section,
        section,
        method
      },
      {}
    );

    return {
      meta,
      makeKey: (...keys: any[]): StorageKey => new StorageKey(registry, [storageFn, keys])
    };
  };

function objectToStorageItems(
  api: ApiPromise,
  storage: Record<string, Record<string, any | [any, any][]>>
): [string, string][] {
  const storageItems: [string, string][] = [] as [string, string][];
  for (const sectionName in storage) {
    const section = storage[sectionName];
    for (const storageName in section) {
      const storage = section[storageName];
      const { makeKey, meta } = storageKeyMaker(api.registry, api.runtimeMetadata)(sectionName, storageName);
      if (meta.type.isPlain) {
        const key = makeKey();
        const value = api.createType(key.outputType, storage);
        storageItems.push([key.toHex(), value.toHex(true)]);
      } else {
        for (const [keys, value] of storage) {
          const key = makeKey(...keys);
          const codecValue = api.createType(key.outputType, value);
          storageItems.push([key.toHex(), codecValue.toHex(true)]);
        }
      }
    }
  }
  return storageItems;
}

export const setStorage = async (
  ctx: Context,
  storage: [string, string][] | Record<string, Record<string, any | Record<string, any>>>
): Promise<void> => {
  let storageItems: [string, string][];
  if (Array.isArray(storage)) {
    storageItems = storage;
  } else {
    storageItems = objectToStorageItems(ctx.api, storage);
  }
  console.log(storageItems);

  await ctx.sudo(ctx.api.tx.system.setStorage(storageItems)).inBlock;
};
