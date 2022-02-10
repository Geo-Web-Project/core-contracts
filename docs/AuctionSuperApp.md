# AuctionSuperApp

![](https://mermaid.ink/img/pako:eNqFlF9v2jAUxb-K5yeQzDRQ9y9VmSj0AakrUlEfpqYPXnwBi2BHtrO0Qnz33tghJBTYU-J7fz4-Po6zpYkWQCO6SHWRrLhx5P6RkFgRqRLzZMGMsqzzPMUBcAskxwrpDQnPspcuUgIa1ATOUmkDSsGdRLBdUjWCrZIoSY8Y-AfGDWP66F9i-oLFJOVyg7Vx-QTz2Y873dA8iI4SJ7VCrtLuNMS7hCtBavP7loEEJC5UaRnfd1AJehuh0hYLtLTj3MwKBWYb06klODKgHPGlXzHdIWPBzXJ3KwVqzcERnTvr0IpUS_JXCu-qDv7jGu0zIr0eiemTWitdKML9dmOK1WGV2yn8QYdzENzx_8JBk9zckPH9aPq74n3el_Hb6aSCD6m0ItqbqSjtQ-ljcLNGIlgid6_SOlvGF6b8AXtsu5p8JKmgwKrwp_EABVnJ5QqsK2OuDuOEoYN6EB1cdhRE6pWOHNQGj4DDIvXn4I-2cbFaeX5q5lmLHi7Yefj4MrTux6U1Wt99aS5WqVTruXtLgXxhfTZgV-wr-8Z-sJ-sj4U-6w-IdUavIVoaAMXCoFdI4VbRVfbKEp1qE5rXTbnv-3nacLWEcxND95oyind-w6XAP9gWN4R7cCvYQEwjfBWw4HmKP4pY7RDNM_zO4U5Ipw2NFjy1wCjPnZ6_qYRGzuSwhyaSLw3fVNTuHZs9t2Q)]

<details>
  <summary>Show source code</summary>

````
```mermaid
  flowchart LR
    incrUserApp([Increase user -> app])
    decrUserApp([Decrease user -> app])
    delUserApp([Delete user -> app])
    delAppUser([Delete app -> user])
    revert>"Revert"]
    claim>"Claimer.claim()"]
    delAppUserAction>"Delete (app -> user) and Decrease (app -> receiver)"]
    recreateAppUser>"Recreate (app -> user)"]
    isCurOwner{"Is Current Owner?"}
    setOutBid>"Set outstanding bid and Increase (app -> user)"]

    incrUserApp -- "Unknown action" --> revert
    incrUserApp -- "No user data" --> revert
    incrUserApp -- "action == CLAIM" --> claim
    incrUserApp -- "action == BID" --> isCurOwner
    isCurOwner -- "No" --> outBid1{"Outstanding Bid Exists?"} -- "Yes" --> revert
    outBid1 -- "No" --> newBidder{"New highest bid?"}

    isCurOwner -- "Yes" --> outBid2{"Outstanding Bid Exists?"}

    newBidder -- "No" --> revert
    newBidder -- "Yes" --> setOutBid

    decrUserApp -- "action != BID" --> revert
    delUserApp -- "action != BID" --> delAppUserAction
    delAppUser -- "action != BID" --> recreateAppUser


    linkStyle 0,1,2,4,5,6,8,9,10,11,12 stroke:green,stroke-width:4px,color:green;
    linkStyle 7 stroke:orange,stroke-width:4px,color:orange;
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
