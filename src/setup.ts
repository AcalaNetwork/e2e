import dotenv from 'dotenv';

import Big from 'big.js';
import { options } from '@acala-network/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { Keyring } from '@polkadot/keyring';
import { ApiManager } from '@open-web3/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { xxhashAsHex } from '@polkadot/util-crypto';
import { queryRemoteChainState } from './queryRemoteChainState';
import { setStorage } from './setStorage';

dotenv.config();

interface Config {
  ws?: string;
  provider?: WsProvider;
  suri?: string;
}

export const config: Config = {
  ws: process.env.WS_URL,
  suri: process.env.SURI
};

export const createApi = async (extend?: Partial<Config>) => {
  const { ws, provider } = { ...config, ...extend };
  const apiManager = await ApiManager.create({ ...options(), provider: provider || new WsProvider(ws) });

  return {
    apiManager,
    api: apiManager.api
  };
};

export const fixed18 = (x: BalanceType) => Big(x).mul(Big('1e+18')).toFixed(0);
export const aca = (x: BalanceType) => Big(x).mul(Big('1e+12')).toFixed(0);
export const ausd = (x: BalanceType) => Big(x).mul(Big('1e+12')).toFixed(0);
export const dot = (x: BalanceType) => Big(x).mul(Big('1e+10')).toFixed(0);
export const ldot = (x: BalanceType) => Big(x).mul(Big('1e+10')).toFixed(0);
export const renbtc = (x: BalanceType) => Big(x).mul(Big('1e+8')).toFixed(0);
export const kar = (x: BalanceType) => Big(x).mul(Big('1e+12')).toFixed(0);
export const kusd = (x: BalanceType) => Big(x).mul(Big('1e+12')).toFixed(0);
export const ksm = (x: BalanceType) => Big(x).mul(Big('1e+12')).toFixed(0);
export const lksm = (x: BalanceType) => Big(x).mul(Big('1e+12')).toFixed(0);

export const price = fixed18;
export const exchangeRate = fixed18;
export const ratio = fixed18;
export const rate = fixed18;

export type BalanceType = Big | number | string;

function getModulePrefix(module: string): string {
  return xxhashAsHex(module, 128);
}

export const setup = async (extend?: Partial<Config>) => {
  const { ws, provider, suri } = { ...config, ...extend };
  const keyring = new Keyring({ type: 'sr25519' });
  const apiManager = await ApiManager.create({
    ...options(),
    provider: provider || new WsProvider(ws),
    account: suri,
    keyring
  });
  const api = apiManager.api;
  const account = apiManager.defaultAccount!; // eslint-disable-line

  return {
    apiManager,
    api,
    keyring,
    account,
    tx: api.tx,
    async teardown() {
      await this.api.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 2000)); // give some time to cleanup
    },
    async makeAccounts(count: number, bal: BalanceType = aca(1)) {
      const random = Math.random().toString(16).substr(2, 6);
      const accounts = new Array(count).fill(null).map((_, i) => this.account.derive(`//${random}//${i}`));
      if (bal > 0) {
        const currencyId = api.consts.currencies.getNativeCurrencyId.toJSON();
        await this.updateBalance(accounts, currencyId, bal).inBlock;
      }
      console.log(
        'Accounts: ',
        accounts.map((a) => a.address)
      );
      return accounts;
    },
    updateBalance(acc: string | KeyringPair | Array<string | KeyringPair>, currency: any, val: BalanceType) {
      const accounts = ([] as Array<string | KeyringPair>)
        .concat(acc)
        .map((x) => (typeof x === 'string' ? x : x.address));

      return this.apiManager.signAndSend(
        accounts.map((a) =>
          this.api.tx.sudo.sudo(this.api.tx.currencies.updateBalance(a, currency, new Big(val).toFixed()))
        )
      );
    },
    feedPrice(currency: any, price: BalanceType) {
      const values = [[currency, price]];
      return this.sudo(this.api.tx.acalaOracle.feedValues(values));
    },
    send(call: SubmittableExtrinsic<'promise'>, account?: KeyringPair) {
      return this.apiManager.signAndSend(call, { account });
    },
    sudo(call: SubmittableExtrinsic<'promise'>) {
      return this.send(this.api.tx.sudo.sudo(call));
    },
    async syncStorageWithRemote(
      wsUrl: string,
      storageConfig: Record<string, null | Record<string, null | Array<any>>>,
      at?: string // latest hash if not specified
    ) {
      const storage = await queryRemoteChainState(wsUrl, storageConfig, at);
      await this.setStorage(storage);
    },
    async setStorage(storage: [string, string][] | Record<string, Record<string, any | [any, any][]>>) {
      await setStorage(this, storage);
    },
    killModuleStorage(module: string) {
      return this.sudo(this.tx.system.killPrefix(getModulePrefix(module), 0));
    },
    async killAll() {
      await this.killModuleStorage('Tokens').send;
      await this.killModuleStorage('CDPEngine').send;
      await this.killModuleStorage('Loans').send;
      await this.killModuleStorage('AuctionManager').send;
      await this.killModuleStorage('Auction').send;
      await this.killModuleStorage('CDPTreasury').send;
      await this.killModuleStorage('Dex').inBlock;
    }
  };
};

type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown;
}
  ? U
  : T;

export type Context = Await<ReturnType<typeof setup>>;
