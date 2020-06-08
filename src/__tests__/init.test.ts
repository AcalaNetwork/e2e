import { Context, setup, dollar } from '../helper';
import { ApiPromise } from '@polkadot/api';

jest.setTimeout(60_000);

let ctx: Context;
let api: ApiPromise;

beforeAll(async () => {
  ctx = await setup();
  api = ctx.api;
});

afterAll(async () => {
  await ctx.teardown();
});

beforeEach(async () => {
  await ctx.killAll();
});

test('test', async () => {
  const accounts = await ctx.makeAccounts(2);
  const [alice, bob] = accounts;
  await ctx.updateBalance(alice, 'XBTC', dollar(10)).send;
  await ctx.updateBalance(bob, 'XBTC', dollar(101)).send;
  await ctx.updateBalance(bob, 'AUSD', dollar(1_000_000)).send;
  await ctx.feedPrice('XBTC', dollar(10000)).send;
  await ctx.send(ctx.tx.dex.addLiquidity('XBTC', dollar(100), dollar(1_000_000))).send;
  await ctx.sudo(
    ctx.tx.cdpEngine.setCollateralParams(
      'XBTC',
      { NewValue: 0 }, // stability_fee
      { NewValue: dollar(2) }, // liquidation_ratio
      { NewValue: dollar('0.2') }, // liquidation_penalty
      { NewValue: dollar(2) }, // required_collateral_ratio
      { NewValue: dollar(1000000) } // maximum_total_debit_value
    )
  ).send;
  await ctx.send(ctx.tx.honzon.adjustLoan('XBTC', dollar(10), dollar(500_000)), alice).send;
  await ctx.send(ctx.tx.honzon.adjustLoan('XBTC', dollar(1), dollar(50_000)), bob).inBlock;
});