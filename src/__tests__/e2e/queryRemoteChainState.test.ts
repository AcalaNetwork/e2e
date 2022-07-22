import { ApiPromise, WsProvider } from "@polkadot/api";
import { queryRemoteChainState } from "../../queryRemoteChainState";

const URL = 'wss://acala-polkadot.api.onfinality.io/public-ws';
const BLOCK_HASH = '0xee12d7d60e4abf418a50efb1bec49ffd4dd05bc741d5a9a267aa051ebab10f7a';

it('query remote chain state', async function () {
    const state = await queryRemoteChainState(
        URL,
        {
            Treasury: null, // null or empty means query all storages
            Bounties: {
                Bounties: [0]
            },
            Dex: {
                LiquidityPool: null // null or empty means query all keys
            },
            AcalaOracle: {
                Values: [{token:'ACA'}]
            },
            EVM: {
                ChainId: null // query plain storage
            },
            Tokens: {
                Accounts: [['23RDJ7SyVgpKqC6M9ad8wvbBsbSr3R4Xqr5NQAKEhWPHbLbs', {token:'DOT'}]]
            }
        },
        BLOCK_HASH
    );
    const api = await ApiPromise.create({ provider: new WsProvider(URL)});
    await api.isReady;


    for (const [key, value] of state) {
        const expected = (await api.rpc.state.getStorage<any>(key, BLOCK_HASH)).toString();
        expected && expect(expected).toBe(value);
    }
}, 120_000);
