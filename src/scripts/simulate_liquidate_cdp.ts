#!/usr/bin/env node

import { simulateLiquidateCDP } from "../simulate_liquidate_cdp";

simulateLiquidateCDP()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
