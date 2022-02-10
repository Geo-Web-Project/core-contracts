# AuctionSuperApp

![](https://mermaid.ink/img/pako:eNqNk8FuwjAMhl8l8wkk2ANUAonBDpXYDkycFg5Waka0NqlCOjQh3n1uaEe6FUQvTZzv_-067hGUzQgS2Ob2oHbovFiupBHh0Ua59Z7crCwH7ylvCPckKo6I8VRgWW6GLZpRhC7oNppHZE7-hiVDNRtZMlKTtaJjGZHBspdz9EXOTyWswkLCpj1ROeqCD-b1m9xj2A-GEXHJMVNeW8Nwk2oQ5RoKNJn4rbY9cqRIc8rY0AXIU-MaqjpHuo5B0nMlYjwWEtbm09iDERiKksDRafOdVzWv9tzxDD3epzi7i8lEzJez9KURhSZdaotmoKN6mIindNGb6DIL1xV_G98zH7fSdZr8_zLvlsIIeDAK1Bn_LcfaSILfUUESEl5mtMUq55GS5sRoVXJz6TnT3jpItpjvaQRYefv2bRQk3lXUQguNHw6Lhjr9AG2uIOg)]

<details>
  <summary>Show source code</summary>

````
```mermaid
  flowchart LR
      incrUserApp([Increase user -> app])
      decrUserApp([Decrease user -> app])
      delUserApp([Delete user -> app])
      decrAppUser([Decrease app -> user])
      delAppUser([Delete app -> user])
      revert>"Revert"]
      claim>"Claimer.claim()"]
      delAppUserAction>"Delete (app -> user) and Decrease (app -> receiver)"]
      recreateAppUser>"Recreate (app -> user)"]

      incrUserApp -- "Unknown action" --> revert
      incrUserApp -- "No user data" --> revert
      incrUserApp -- "action == CLAIM" --> claim

      decrUserApp -- "action != BID" --> revert
      delUserApp -- "action != BID" --> delAppUserAction
      decrAppUser -- "action != BID" --> recreateAppUser
      delAppUser -- "action != BID" --> recreateAppUser
````

</details>

## Examples

See Superfluid [sdk-core](https://github.com/superfluid-finance/protocol-monorepo/tree/dev/packages/sdk-core) for setup.

## Claim

Claim a parcel by creating a flow with some user data.

```javascript
let ethx: SuperToken;
enum Action {
  CLAIM,
  BID,
}

// Approve ETHx amount
const approveOp = ethx.approve({
  receiver: superApp.address,
  amount: "1000",
});

// TODO: Replace 0x bytes with claim data
const userData = ethers.utils.defaultAbiCoder.encode(
  ["uint8", "bytes"],
  [Action.CLAIM, "0x"]
);

// Claim with a contribution rate of 100 wei per second
const createFlowOp = await sf.cfaV1.createFlow({
  sender: user.address,
  receiver: superApp.address,
  flowRate: "100",
  superToken: ethx.address,
  userData: userData,
});

// Perform these in a single batch call
const batchCall = sf.batchCall([approveOp, createFlowOp]);
const txn = await batchCall.exec(user);
```
