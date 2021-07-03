#!/usr/bin/env node

import { simulateLiquidateCDP } from '../simulate-liquidate-cdp';

simulateLiquidateCDP().catch((error) => {
  console.error(error);
  process.exit(-1);
});
