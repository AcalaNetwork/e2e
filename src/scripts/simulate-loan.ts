#!/usr/bin/env node

import { simulateLoan } from '../simulate-loan';

simulateLoan().catch((error) => {
  console.error(error);
  process.exit(-1);
});
