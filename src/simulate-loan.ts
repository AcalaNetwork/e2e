import { Context, setup, rate, ratio, price, aca, ausd, dot } from './helper';

const ACA = { Token: 'ACA' };
const AUSD = { Token: 'AUSD' };
const DOT = { Token: 'DOT' };

export const simulateLoan = async () => {
  const ctx: Context = await setup();
  const [alice] = await ctx.makeAccounts(1);

  await ctx.updateBalance(alice, AUSD, ausd(10_000_000)).send;
  await ctx.updateBalance(alice, DOT, dot(10_000_000)).send;

  const address = process.env.ADDRESS;
  if (address == null || address.length === 0) throw Error('process.env.ADDRESS not defined!');

  await ctx.updateBalance(address, ACA, aca(1_000)).send;
  await ctx.updateBalance(address, AUSD, ausd(10_000_000)).send;
  await ctx.updateBalance(address, DOT, dot(10_000)).send;

  await ctx.feedPrice(DOT, price(30)).send;
  await ctx.send(ctx.tx.dex.addLiquidity(AUSD, DOT, ausd(1_000_000), dot(33_000), 0, false), alice).send;
  await ctx.sudo(
    ctx.tx.cdpEngine.setCollateralParams(
      DOT,
      { NewValue: rate(0) }, // stability_fee
      { NewValue: ratio(1.2) }, // liquidation_ratio
      { NewValue: rate('0.2') }, // liquidation_penalty
      { NewValue: ratio(1.3) }, // required_collateral_ratio
      { NewValue: ausd(1_000_000) } // maximum_total_debit_value
    )
  ).send;

  const tx = ctx.tx.honzon.adjustLoan(DOT, dot(1), ausd(200));
  await ctx.send(ctx.tx.sudo.sudoAs(address, tx)).inBlock;
  await ctx.feedPrice(DOT, price(27)).inBlock;
  await ctx.teardown();
};
