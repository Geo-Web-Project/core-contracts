# AuctionSuperApp

![](https://mermaid.ink/img/pako:eNqNVm1v2jAQ_itepEpFO6bG0Dc2OlFaaUhdW7Xqh2npBy85wGpwIseMoqr_fU7ivDmBVUgQ3z1399ybyZvjRwE6I2ceRht_yaQiNw-e8AQXvnxKUE7i-PD3TB-QJUjWWkL6F4TF8XMvhQVYg13hblhYQ4WoujFan8JKjNalkBSaYyT-RancC895yJ4857kSU1vsh4yvtHCa_qL8kp0Pe0ZbxZv4ikdCA03Yw1rcHmEiIGVmhUqij1yH6pUMUoBC4zFjkkua3gycJ9O1vNsIlG-eM0uIPkkUimSi757znoISVHdrdckD7e0RFYnWKlGaDRcL8ocHGbGyM11RYra9R8FCtdUe7tmWmBP5TKYhMknuah51nIKc8HUaDyZDbdoKYmfPfB9jw3SSPdfcBaZ2ubqsZAWwxo30-8RznsSLiDaCsKw3nqOladys_Z0Gt1E-UgFT7APw3C8Zj8n0ZjL7aSyyCcmemkX4j4vL2ZVxUDW22eaCo4FFWV9d3XyrBeT6lScqSUcgN_mFSTsbY245FbjR0iCbqVvckCVfLDFR6awUI5V-SphlXvNvQSoO5UgWzmr73yjKp3pRzHo2L4JMY-9gcy-NcWOzyoGxSltxzItD99a2KiK1zXW1rkMWJ5i15wdLWnuHubrwUzPobIjpRmp5UfdV2Ocom0a1uzvGsW5WRmzDGlnuwbWy6By8fS3fsQd0zw1XQ3V3cfDBLg5s85TkZCVU2sPiytE35ipaC-V5YjzWX35OKYt_We1IaWr7LG-5DpS1RbRFrQQUhrSb2beUWQcb2pWhuVY7cF18WtW2rqNh3imr3s1CD7uHg1r6drb57IRcvDyqbYjkCFygMIAhHMMJnMIZnIOrhS64FNwBuENwj8E9AfcU3DNwz4EeAdU2FOgA6BDoMdAToKdAz4Cew-AIBi5JlIxecLSQiALyQ3_DA7UcDeNX8KMwkrnya8rm4IBUhAa0sI4kEwvcZZ5rv5r3iyS5wrkpApnzMBxJDAxys-SqBiz2CEzJzFkDHHD068mK8UC_iL15gugKqiWu0HNG-jHAOVuH-qXGE-8auo71XxxeB1xF0hnNWZggOGytoset8EtBjrribCHZykjf_wFu8lQw)

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

outBid3 -- "No" --> decrAmnt2{"Decreased amount\n<=\nBid?"}

decrAmnt2 -- "Yes" --> decreaseBid

decrAmnt2 -- "No" --> revert2

isCurOwner2 -- "No" --> outBid4{"Is Outstanding Bid?"}

outBid4 -- "Yes" --> revert2
outBid4 -- "No" --> decrAmnt2


linkStyle 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31 stroke:green,stroke-width:4px,color:green;

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
