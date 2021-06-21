import { Context, setup, rate, ratio, renbtc, ausd } from '../../helper';

jest.setTimeout(60_000);

const AUSD = { token: 'AUSD' };
const RENBTC = { token: 'RENBTC' };

let ctx: Context;

beforeAll(async () => {
  ctx = await setup();
});

afterAll(async () => {
  await ctx.teardown();
});

beforeEach(async () => {
  await ctx.killAll();
});

test('test', async () => {
  const [alice, bob] = await ctx.makeAccounts(2);
  await ctx.updateBalance(alice, RENBTC, renbtc(10)).send;
  await ctx.updateBalance(bob, RENBTC, renbtc(101)).send;
  await ctx.updateBalance(bob, AUSD, ausd(1_000_000)).send;
  await ctx.feedPrice(RENBTC, renbtc(10_000)).send;
  await ctx.send(ctx.tx.dex.addLiquidity(AUSD, RENBTC, ausd(100), renbtc(1_000_000), 0, false)).send;
  await ctx.sudo(
    ctx.tx.cdpEngine.setCollateralParams(
      RENBTC,
      { NewValue: rate(0) }, // stability_fee
      { NewValue: ratio(2) }, // liquidation_ratio
      { NewValue: rate('0.2') }, // liquidation_penalty
      { NewValue: ratio(2) }, // required_collateral_ratio
      { NewValue: ausd(1_000_000) } // maximum_total_debit_value
    )
  ).send;
  await ctx.send(ctx.tx.honzon.adjustLoan(RENBTC, renbtc(10), ausd(500_000)), alice).inBlock;
  await ctx.send(ctx.tx.honzon.adjustLoan(RENBTC, renbtc(1), ausd(50_000)), bob).inBlock;
});
