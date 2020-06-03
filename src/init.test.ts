import { Context, setup, dollar } from './helper';

let ctx: Context;

beforeAll(async () => {
  ctx = await setup();
});

afterAll(async () => {
  await ctx.teardown();
});

test('test', async () => {
  const accounts = await ctx.makeAccounts(1);
  await ctx.transfer(accounts, 'XBTC', dollar(1));
  console.log((await ctx.api.query.tokens.accounts(accounts[0].address, 'XBTC')).toHuman());
});
