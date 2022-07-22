import { describeWithAcala } from '../../describeWithAcala';

const REMOTE_URL = 'wss://acala-polkadot.api.onfinality.io/public-ws';

describeWithAcala('Acala Chain', function (ctx) {
  // WARNING: ctx is not available here
  it('works', async function () {
    expect((await ctx.api.query.technicalCommittee.members<any>()).toJSON().length).toBe(1);

    await ctx.syncStorageWithRemote(
      REMOTE_URL,
      {
        TechnicalCommittee: {
          Members: null
        }
      }
    );

    expect((await ctx.api.query.technicalCommittee.members<any>()).toJSON().length).toBe(3);
    expect((await ctx.api.query.idleScheduler.nextTaskId<any>()).toString()).toBe('0');

    // can set raw storage
    await ctx.setStorage([
      ['0x027a4e29b47efb389eca0f0ba7a8d619de42bca67c783faefa9c0e5df6620f83', '0xd3040000']
    ]);

    expect((await ctx.api.query.idleScheduler.nextTaskId<any>()).toString()).toBe('1235');

    await ctx.setStorage({
      TechnicalCommittee: {
        Members: ['5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY']
      },
      IdleScheduler: {
        NextTaskId: 1234,
      },
      Loans: {
        Positions: [
          [
            // keys
            [
              { token: "ACA" }, // key1
              "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" // key2
            ],
            // value
            {
              collateral: 100000,
              debit: 100000
            }
          ],
          [
            // keys
            [
              { token: "DOT" }, // key1
              "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" // key2
            ],
            // value
            {
              collateral: 200000,
              debit: 50000
            }
          ]
        ]
      }
    });

    expect((await ctx.api.query.technicalCommittee.members<any>()).toJSON().length).toBe(1);
    expect((await ctx.api.query.idleScheduler.nextTaskId<any>()).toString()).toBe('1234');
  }, 60_000);
});
