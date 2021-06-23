# e2e

## Simulate CDP liquidation

1. start acala local node
2. `npx @acala-network/e2e simulate_liquidate_cdp`

default env args

```
process.env.WS_URL = 'ws://localhost::9944' # node endpoint
process.env.SURI = '//Alice' # sudo account
```

optional env args

```
process.env.BIDDER_ADDRESS # will give bidder 1m aUSD and 1k ACA
```

## Development
- Run e2e tests: `BINARY_PATH=<acala binary path> yarn test:e2e`