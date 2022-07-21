#!/usr/bin/env node

import { simulateLoan } from '../testing/simulate-loan';

simulateLoan().catch((error) => {
  console.error(error);
  process.exit(-1);
});
