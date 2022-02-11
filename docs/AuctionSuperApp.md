# AuctionSuperApp

![](https://mermaid.ink/img/pako:eNqNVm1v2jAQ_itepEpFM1MT6BsdTJRWGlLXVq36YVr6wUsOsBqcyDGjqOp_38V23kM3CUF899zrc2fy5gRxCM7IWUTxNlgxqcjNAyG-IFwE8ikFOU2Sw19zPABLgWxQQvoTwpLkuYeoECqoK9iLiiqgCFQnBNUZqoCgKkNkSA2R8Aekcie-86CffOe5kHoNaRAxvkbZLPsF-UWfD3tGWcaaBorHAnE25GElZo8wEZKiplwlIQCOgXp5-EyvwDrUaRhJ3ZlB83S2kXdbAfLNd-YpwZMEoYgWffOdd8SkoO426pKH6OsRFIk3KlWYChdL8puHOquCj44YCdvdg2CR2qGDe7Yj9kQ-k1kETJK7ikMMYzMTAZbwYItDy1aIRuEsCCCxaU71c-kstE0z2qKFub4-XaTfJ77zJF5EvM3cZoz4DkonOeNd-NvYjFDIFPs32ngl4zGZ3UznP6yBHgr9VK_-Yw-X8ytrX7JZozZP0KJiTaaLhDcaT65fearSjHZj8hPSVinWuuFTwBaloR6jW9iSFV-uIFXZfNgpwk8BahiXzhuIMn4xg5qsypLXmvGp2gy7h7Vt14rmttUW0JrWdsgMSKOdZW6mI96H_Swa5zWtsUPXEUtS0Ix8Z2lrv8CorZsKvpMDS0BmOKm60qwWLW5mUe5o9_hVrYqALVStxP2wVgkdc_YBy3tG3tt_g1VA3eQN_o-8QdM6S3G6FiqjLr9V8EJcxxuhfF-Mx_gVmIR0-EuzDsRWp02bPot7rA1qbIzXTKzQ53Zed15f9-RVieh1lWqv0DasI7FWzxv3z9DQ1eh6rd3D7unwsumIuHh5VLsIyBF1qUcHdEiP6Qk9pWf0nLoodKnrUXdA3SF1j6l7Qt1T6p5R95x6R9Q7od4p9c7o4IikSsYvMFpKAEHNob_loVqNhskrDeIolkZ54YuDA1JG1h5y81gysYR99kaLDvCKT9MrWNhayIJH0UhCaHHbFVcFLN8Gauu25wuHOvgKsWY8xPekN2wXNkmtYA2-M8LHEBZsE-F7hy_eEbpJ8C8JrkOuYumMFixKgTpso-LHnQgKgUFdcbaUbG2l738BzmMoGg)

<details>
  <summary>Show source code</summary>

````
```mermaid
  flowchart LR
 incrUserApp([Increase user -> app])
 decrUserApp([Decrease user -> app])
 delUserApp([Delete user -> app])
 delAppUser([Delete app -> user])
 revert1>"Revert"]
 revert2>"Revert"]
 claim>"Claimer.claim()"]
 delAppUserAction>"Delete (app -> user) and Decrease (app -> receiver)"]
 recreateAppUser>"Recreate (app -> user)"]
 isCurOwner{"Is Current Owner?"}
 setOutBid>"Set outstanding bid and Increase (app -> user)"]
 payPenalty>"Pay Penalty + Clear Outstanding Bid"]
 incAppReceiver>"Increase (app -> receiver)"]
 acceptBid>"Accept Bid"]
 decreaseBid>"Decrease Bid"]

 incrUserApp -- "Unknown action" --> revert1
 incrUserApp -- "No user data" --> revert1
 incrUserApp -- "action == CLAIM" --> claim --> incAppReceiver
 incrUserApp -- "action == BID" --> isCurOwner
 isCurOwner -- "No" --> outBid1{"Outstanding Bid Exists?"} -- "Yes" --> revert1
 outBid1 -- "No" --> newBidder{"New highest bid?"}

 newBidder -- "No" --> revert1
 newBidder -- "Yes" --> setOutBid

 decrUserApp -- "action != BID" --> revert2
 delUserApp --> delAppUserAction
 delAppUser --> recreateAppUser

 isCurOwner -- "Yes" --> outBid2{"Outstanding Bid Exists?"}
 outBid2 -- "Yes" --> bidElapsed1{"Has outstanding bid elapsed?"}
 bidElapsed1 -- "No" --> newBid{"New bid > outstanding?"}
 newBid -- "Yes" --> payPenalty --> incAppReceiver
 newBid -- "No" --> incAppReceiver
 outBid2 -- "No" --> incAppReceiver
 bidElapsed1 -- "Yes" --> revert1

 decrUserApp -- "action == BID" --> isCurOwner2{"Is Current Owner?"}
 isCurOwner2 -- "Yes" --> outBid3{"Outstanding Bid Exists?"}
 outBid3 -- "Yes" --> decrAmnt1{"Decreased amount\n==\ncurrentOwnerBid?"}
 decrAmnt1 -- "Yes" --> acceptBid
 decrAmnt1 -- "No" --> revert2
 outBid3 -- "No" --> decrAmnt2{"Decreased amount\n<=\ncurrentOwnerBid?"}
 decrAmnt2 -- "Yes" --> decreaseBid
 decrAmnt2 -- "No" --> revert2
 isCurOwner2 -- "No" --> outBid4{"Is Outstanding Bid?"}
 outBid4 -- "Yes" --> revert2

linkStyle 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,26,27,28,30 stroke:green,stroke-width:4px,color:green;
%% linkStyle 27,28 stroke:orange,stroke-width:4px,color:orange;
classDef revert fill:red,color:white;
class revert1,revert2 revert;
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

## Place a Bid

Place a bid by creating or increasing a flow with some user data that contains the license ID.

```javascript
let ethx: SuperToken;
enum Action {
  CLAIM,
  BID,
}

let licenseId: string; // License ID to bid on

// Approve ETHx amount above purchase price
const approveOp = ethx.approve({
  receiver: superApp.address,
  amount: "1000",
});

const actionData = ethers.utils.defaultAbiCoder.encode(
  ["uint256"],
  [licenseId]
);
const userData = ethers.utils.defaultAbiCoder.encode(
  ["uint8", "bytes"],
  [Action.BID, "0x"]
);

// Bid with a contribution rate of 200 wei per second
const createFlowOp = await sf.cfaV1.createFlow({
  sender: user.address,
  receiver: superApp.address,
  flowRate: "200",
  superToken: ethx.address,
  userData: userData,
});

// Perform these in a single batch call
const batchCall = sf.batchCall([approveOp, createFlowOp]);
const txn = await batchCall.exec(user);
```
