# e2e

## Simulate CDP liquidation

1. start acala local node
2. `npx -p @acala-network/e2e@latest simulate-liquidate-cdp`

default env args

```
process.env.WS_URL = 'ws://localhost::9944' # node endpoint
process.env.SURI = '//Alice' # sudo account
```

optional env args

```
process.env.BIDDER_ADDRESS # will give bidder 1m aUSD and 1k ACA
```

## Simulate loan collateral ratio dropping

1. start acala local node
2. `npx -p @acala-network/e2e@latest simulate-loan`

default env args

```
process.env.WS_URL = 'ws://localhost::9944' # node endpoint
process.env.SURI = '//Alice' # sudo account
```

required env args

```
process.env.ADDRESS # will create a RENBTC loan for the given address
```

## Development
- Run e2e tests: `BINARY_PATH=<acala binary path> yarn test:e2e`