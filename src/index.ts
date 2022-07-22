import { simulateLoan } from './testing/simulate-loan';
import { simulateLiquidateCDP } from './testing/simulate-liquidate-cdp';

export * from './setup';
export * from './startAcalaNode';
export * from './describeWithAcala';

// for testing purpose
export const testing = {
  simulateLoan,
  simulateLiquidateCDP
};
