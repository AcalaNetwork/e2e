import { config as dotenv } from 'dotenv';
import Big from 'big.js';
import { options } from '@acala-network/api';
import { WsProvider, Keyring } from '@polkadot/api';
import { ApiManager } from '@open-web3/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { TransactionResult } from '@open-web3/api/api-manager';
import { toBaseUnit } from '@open-web3/util';

dotenv();

export const config = {
  ws: process.env.WS_URL || 'ws://localhost::9944',
  suri: process.env.SURI || '//Alice'
};

export const createApi = async () => {
  const ws = new WsProvider(config.ws);
  const apiManager = await ApiManager.create(options({ provider: ws }));

  return {
    apiManager,
    api: apiManager.api
  };
};

export const dollar = toBaseUnit;

export const setup = async () => {
  const keyring = new Keyring({ type: 'sr25519' });
  const apiManager = await ApiManager.create({ ...options(), wsEndpoint: config.ws, account: config.suri, keyring });
  const api = apiManager.api;
  const account = apiManager.defaultAccount!;

  return {
    apiManager,
    api,
    keyring,
    account,
    async teardown() {
      this.api.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 2000)); // give some time to cleanup
    },
    async makeAccounts(count: number, bal: Big | number | string = toBaseUnit(1)) {
      const random = Math.random().toString(16).substr(2, 6);
      const accounts = new Array(count).fill(null).map((_, i) => this.account.derive(`//${random}//${i}`));
      if (bal > 0) {
        this.transfer(accounts, 0, bal);
      }
      console.log(
        'Accounts: ',
        accounts.map((a) => a.address)
      );
      return accounts;
    },
    async transfer(
      acc: string | KeyringPair | Array<string | KeyringPair>,
      currency: string | number,
      val: Big | number | string
    ) {
      const accounts = ([] as Array<string | KeyringPair>)
        .concat(acc)
        .map((x) => (typeof x === 'string' ? x : x.address));

      return this.apiManager.signAndSend(
        this.api.tx.utility.batch(accounts.map((a) => this.api.tx.currencies.transfer(a, currency, val.toString())))
      ).inBlock;
    }
  };
};

export const assertSuccess = (res: TransactionResult) => {
  const success = res.events.some((evt) => evt.event.section === 'System' && evt.event.method === 'ExtrinsicSuccess');
  expect(success).toBeTruthy();
};

type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown;
}
  ? U
  : T;

export type Context = Await<ReturnType<typeof setup>>;
