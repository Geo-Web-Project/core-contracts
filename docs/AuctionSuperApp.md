# AuctionSuperApp

![](https://mermaid.ink/img/pako:eNqNVltP2zAU_iteJCTQDlPjlFsZTOUirRIDBOJhW3jwktPWInUix12pEP99juNc6qYdT7XP-c71Oz7NmxelMXoDb5yki2jKpCI3D6EIBReRfMpRDrNs9_dIX5DlSOZaQvbPCcuy570CFmMLdoWbYUkLlaDqxmh9AasxWldACmiJkfgXpfLPQ-_BnELvuRFTVxwljM-08LL4RfnF3Hf3rLaJN4wUT4UG2rC7rbh7hImY1JVVKokRch1qr86gACi0Hk0mpWTVm4Xz_HIu7xYC5VvojXKibxKFIkb0LfTeC1CO6m6uLnisvT2iIulc5Upnw8WE_OGxSaxmpitKxpb3KFiiltrDPVsSeyOfyWWCTJK7lkcdp0pORLqMB1uhNl0L4lbPoggzm-nQnFvuYtu7Ul13sgEQ4gwc2d8nofckXkS6EIQZdkJPS4vIZgA6DW7TcqhiptgH4KVfcnZGLm-Gox_WwsyIOa224T8uLkZX1kFD7SrRVY4WlhpmfU2_QwK5fuW5yoshKE1-Yr5ejTV3nEY2llb9Qpl2zJaJ0KsmzME73gQutCI2M3qLCzLlkynmqpi9rQ7aCVdP8KE8WcZrz07EVoEOpPFZv4pmdFpLaIWXT21e7I5Y3UZG4y6C1eVQFdJ-3q2pdfht8iwZolsJbpikrrlu8nXCshzNjHxn-drzx1Jd-WkZdPJoSSwsz9u-KvsS5abRrJANb6JtVkdch61UuQW3VkXn9G-nfcNzpFtWbQvVzWPwQR4D17xIcjgTqmCx2n16dc_SuVBhKM7OQvOKipSql1R5rE1dn_W67UA5b4mupVYDKkPandnXIrOObGhXhXa_d-C68lnrtrMV-yVTTr9XG93vHg_q6NerraYn4eLlUS0TJD3wgUIAfTiAQziCYzgBXwt98Cn4Afh98A_APwT_CPxj8E-A9oBqGwo0ANoHegD0EOgR0GOgJxD0IPAh0C4DkiuZvuBgIhEFlJf9BY_VdNDPXiFKk1SWytMip50d0qQV0Mo6lUxMcJN5qT21Hzx5foVj2wwy5kkykBhb5GLKVQtYvSiwrbN3DfDA099LM8Zj_WX4ZjrmqSnOMPQG-hjjmM0T_ZUVincNnWf6HxevY65S6Q3GLMkRPDZX6eNSRLWgRF1xNpFsZqXv_wBxeIHK)

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

outBid1 -- "No" --> curOwnerBidZero{"Is Current Owner Bid 0?"}

curOwnerBidZero -- "No" --> newBidder{"New highest bid?"}

curOwnerBidZero -- "Yes" --> reclaim>"Reclaim"]

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

outBid3 -- "No" --> decrAmnt2{"Decreased amount\n<=\nBid?"}

decrAmnt2 -- "Yes" --> decreaseBid

decrAmnt2 -- "No" --> revert2

isCurOwner2 -- "No" --> outBid4{"Is Outstanding Bid?"}

outBid4 -- "Yes" --> revert2
outBid4 -- "No" --> decrAmnt2


linkStyle 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33 stroke:green,stroke-width:4px,color:green;

%% linkStyle 32 stroke:orange,stroke-width:4px,color:orange;

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

## Accept a Bid

Accept a bid by decreasing a flow with some user data that contains the license ID when there is an outstanding bid.

```javascript
let ethx: SuperToken;
enum Action {
  CLAIM,
  BID,
}

let licenseId: string; // License ID to bid on

const actionData = ethers.utils.defaultAbiCoder.encode(
  ["uint256"],
  [licenseId]
);
const userData = ethers.utils.defaultAbiCoder.encode(
  ["uint8", "bytes"],
  [Action.BID, "0x"]
);

// Lower flow from 200 to 100
const updateFlowOp = await sf.cfaV1.updateFlow({
  sender: user.address,
  receiver: superApp.address,
  flowRate: "100",
  superToken: ethx.address,
  userData: userData,
});

const txn = await updateFlowOp.exec(user);
```

## Reject a Bid

Reject a bid by increasing a flow with some user data that contains the license ID when there is an outstanding bid.

```javascript
let ethx: SuperToken;
enum Action {
  CLAIM,
  BID,
}

let licenseId: string; // License ID to bid on

// Approve ETHx amount above penalty
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

// Increase flow from 100 to 200 and pay penalty
const updateFlowOp = await sf.cfaV1.updateFlow({
  sender: user.address,
  receiver: superApp.address,
  flowRate: "200",
  superToken: ethx.address,
  userData: userData,
});

// Perform these in a single batch call
const batchCall = sf.batchCall([approveOp, updateFlowOp]);
const txn = await batchCall.exec(user);
```
