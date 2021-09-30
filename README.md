# E2E tests & simulations

To run the simulation you need to local Acala node

### Running Acala local node

Using `docker`:
```shell=
docker run --rm -p 9944:9944 acala/mandala-node:latest \
--dev --ws-external --rpc-methods=unsafe \
--instant-sealing  -levm=trace --tmp
```

To build the project without Docker use the guidelines here:
[**AcalaNetwork/Acala**](https://github.com/AcalaNetwork/Acala)
Run the node with:
```
cargo run -- --dev --tmp
```

### Simulations settings

Environment variables used in simulations you can find in [.env](https://github.com/AcalaNetwork/e2e/blob/master/.env) file, feel free to change them:

```bash=
WS_URL=ws://localhost::9944
SURI=//Alice

# required for loan price drop simulation
# will create a RENBTC loan for the given address
ADDRESS=5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y  
```

##  Liquidation Simulation 


The liquidation simulation script will work only for your local Acala testnet, you should ensure that it's running.


Install dependencies:
```
yarn
```

Run simulation:
```shell=
yarn dev:simulate-liquidate-cdp
```

##  Loan collateral ratio drop Simulation 


The Loan collater ratio drop simulation script will work only for your local Acala testnet, you should ensure that it's running.


Install dependencies:
```
yarn
```

Run simulation:
```shell=
yarn dev:simulate-loan
```
