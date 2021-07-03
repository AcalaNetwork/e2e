import { Context, setup, rate, ratio, price, aca, ausd, renbtc } from './helper';

const ACA = { Token: 'ACA' };
const AUSD = { Token: 'AUSD' };
const RENBTC = { Token: 'RENBTC' };

export const simulateLoan = async () => {
  const ctx: Context = await setup();
  const [alice] = await ctx.makeAccounts(1);

  await ctx.updateBalance(alice, AUSD, ausd(10_000_000)).send;
  await ctx.updateBalance(alice, RENBTC, renbtc(10_000_000)).send;

  const address = process.env.ADDRESS;
  if (address == null || address.length === 0) throw Error('process.env.ADDRESS not defined!');

  await ctx.updateBalance(address, ACA, aca(1_000)).send;
  await ctx.updateBalance(address, AUSD, ausd(10_000_000)).send;
  await ctx.updateBalance(address, RENBTC, renbtc(10_000)).send;

  await ctx.feedPrice(RENBTC, price(10_000)).send;
  await ctx.send(ctx.tx.dex.addLiquidity(AUSD, RENBTC, ausd(1_000_000), renbtc(100), 0, false), alice).send;
  await ctx.sudo(
    ctx.tx.cdpEngine.setCollateralParams(
      RENBTC,
      { NewValue: rate(0) }, // stability_fee
      { NewValue: ratio(1.2) }, // liquidation_ratio
      { NewValue: rate('0.2') }, // liquidation_penalty
      { NewValue: ratio(1.3) }, // required_collateral_ratio
      { NewValue: ausd(1_000_000) } // maximum_total_debit_value
    )
  ).send;

  const tx = ctx.tx.honzon.adjustLoan(RENBTC, renbtc(1), ausd(50_000));
  await ctx.send(ctx.tx.sudo.sudoAs(address, tx)).inBlock;
  await ctx.feedPrice(RENBTC, price(7_000)).inBlock;
  await ctx.teardown();
};
