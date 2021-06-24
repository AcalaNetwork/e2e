import { Context, setup, rate, ratio, price, aca, ausd, renbtc } from './helper';

const ACA = { token: 'ACA' };
const AUSD = { token: 'AUSD' };
const RENBTC = { token: 'RENBTC' };

export const simulateLiquidateCDP = async () => {
  const ctx: Context = await setup();
  const [alice, bob] = await ctx.makeAccounts(2);

  await ctx.updateBalance(alice, AUSD, ausd(10_000_000)).send;
  await ctx.updateBalance(alice, RENBTC, renbtc(10_000_000)).send;

  await ctx.updateBalance(bob, AUSD, ausd(1_000_000)).send;
  await ctx.updateBalance(bob, RENBTC, renbtc(101)).send;

  const bidder = process.env.BIDDER_ADDRESS;
  if (bidder) {
    // give bidder lots of money
    await ctx.updateBalance(bidder, AUSD, ausd(1_000_000)).send;
    await ctx.updateBalance(bidder, ACA, aca(1_000)).send;
  }

  await ctx.feedPrice(RENBTC, price(10_000)).send;
  await ctx.send(ctx.tx.dex.addLiquidity(AUSD, RENBTC, ausd(100), renbtc(1_000_000), 0, false), alice).send;
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
  await ctx.send(ctx.tx.honzon.adjustLoan(RENBTC, renbtc(10), ausd(500_000)), alice).send;
  await ctx.send(ctx.tx.honzon.adjustLoan(RENBTC, renbtc(1), ausd(50_000)), bob).inBlock;

  await ctx.tx.cdpEngine.liquidate(RENBTC, alice.address).send();
};
