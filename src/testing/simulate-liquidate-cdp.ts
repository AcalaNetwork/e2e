import { Context, setup, rate, ratio, price, aca, ausd, dot } from '../setup';

const ACA = { token: 'ACA' };
const AUSD = { token: 'AUSD' };
const DOT = { token: 'DOT' };

const debitExchangeRate = 0.1;

export const simulateLiquidateCDP = async () => {
  const ctx: Context = await setup();
  const [alice, bob] = await ctx.makeAccounts(2);

  await ctx.updateBalance(alice, AUSD, ausd(10_000_000)).send;
  await ctx.updateBalance(alice, DOT, dot(10_000_000)).send;

  await ctx.updateBalance(bob, AUSD, ausd(1_000_000)).send;
  await ctx.updateBalance(bob, DOT, dot(101)).send;

  const bidder = process.env.BIDDER_ADDRESS;
  if (bidder) {
    // give bidder lots of money
    await ctx.updateBalance(bidder, AUSD, ausd(1_000_000)).send;
    await ctx.updateBalance(bidder, ACA, aca(1_000)).send;
  }

  await ctx.feedPrice(DOT, price(30)).send;
  await ctx.send(ctx.tx.dex.addLiquidity(AUSD, DOT, ausd(30_000), dot(1_000), 0, false), alice).send;
  await ctx.sudo(
    ctx.tx.cdpEngine.setCollateralParams(
      DOT,
      { NewValue: rate(0) }, // stability_fee
      { NewValue: ratio(2) }, // liquidation_ratio
      { NewValue: rate('0.2') }, // liquidation_penalty
      { NewValue: ratio(2) }, // required_collateral_ratio
      { NewValue: ausd(1_000_000) } // maximum_total_debit_value
    )
  ).send;
  await ctx.send(ctx.tx.honzon.adjustLoan(DOT, dot(10), ausd(150 / debitExchangeRate)), alice).inBlock;
  await ctx.send(ctx.tx.honzon.adjustLoan(DOT, dot(1), ausd(15 / debitExchangeRate)), bob).inBlock;

  await ctx.tx.cdpEngine.liquidate(DOT, alice.address).send();
  await ctx.teardown();
};
