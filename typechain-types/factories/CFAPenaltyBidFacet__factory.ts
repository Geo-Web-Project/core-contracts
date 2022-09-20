/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CFAPenaltyBidFacet,
  CFAPenaltyBidFacetInterface,
} from "../CFAPenaltyBidFacet";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_bidder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "forSalePrice",
        type: "uint256",
      },
    ],
    name: "BidAccepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_bidder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int96",
        name: "contributionRate",
        type: "int96",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "forSalePrice",
        type: "uint256",
      },
    ],
    name: "BidPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_bidder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "forSalePrice",
        type: "uint256",
      },
    ],
    name: "BidRejected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_payer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_bidder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "forSalePrice",
        type: "uint256",
      },
    ],
    name: "TransferTriggered",
    type: "event",
  },
  {
    inputs: [],
    name: "acceptBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "calculatePenalty",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int96",
        name: "newContributionRate",
        type: "int96",
      },
      {
        internalType: "uint256",
        name: "newForSalePrice",
        type: "uint256",
      },
    ],
    name: "editBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "hasPendingBid",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingBid",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            internalType: "int96",
            name: "contributionRate",
            type: "int96",
          },
          {
            internalType: "uint256",
            name: "perSecondFeeNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "perSecondFeeDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "forSalePrice",
            type: "uint256",
          },
        ],
        internalType: "struct LibCFAPenaltyBid.Bid",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int96",
        name: "newContributionRate",
        type: "int96",
      },
      {
        internalType: "uint256",
        name: "newForSalePrice",
        type: "uint256",
      },
    ],
    name: "placeBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int96",
        name: "newContributionRate",
        type: "int96",
      },
      {
        internalType: "uint256",
        name: "newForSalePrice",
        type: "uint256",
      },
    ],
    name: "rejectBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "shouldBidPeriodEndEarly",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "triggerTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50613667806100206000396000f3fe608060405234801561001057600080fd5b50600436106100925760003560e01c806392f1f73e1161006657806392f1f73e146100fb5780639e41ec6714610156578063ce2ccb151461016c578063e52a787414610174578063f11663e81461017c57600080fd5b8062fa680214610097578063084024a2146100ac578063499ca2f5146100e057806390ee40bf146100f3575b600080fd5b6100aa6100a5366004612fe9565b61018f565b005b600080516020613552833981519152546000600160a01b909104600b0b135b60405190151581526020015b60405180910390f35b6100aa6100ee366004612fe9565b61087c565b6100cb610abb565b610103610c43565b6040516100d79190815181526020808301516001600160a01b031690820152604080830151600b0b90820152606080830151908201526080808301519082015260a0918201519181019190915260c00190565b61015e610d4d565b6040519081526020016100d7565b6100aa610d5c565b6100aa610f97565b6100aa61018a366004612fe9565b6111d2565b6101976112e6565b6102185760405162461bcd60e51b815260206004820152604160248201527f4346414261736550434f46616365743a2043616e206f6e6c7920706572666f7260448201527f6d20616374696f6e207768656e207061796572206269642069732061637469766064820152606560f81b608482015260a4015b60405180910390fd5b60006000805160206135f28339815191529050306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015610269573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061028d9190613015565b156102f15760405162461bcd60e51b815260206004820152602e60248201527f43464150656e616c747942696446616365743a2050656e64696e67206269642060448201526d616c72656164792065786973747360901b606482015260840161020f565b600080516020613612833981519152805460408051630b51881360e11b815290516000805160206135b2833981519152926000926001600160a01b03909116916316a31026916004808201926020929091908290030181865afa15801561035c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103809190613037565b905060008360000160009054906101000a90046001600160a01b03166001600160a01b031663014df4146040518163ffffffff1660e01b8152600401602060405180830381865afa1580156103d9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103fd9190613037565b90506000805160206135d283398151915261041a878985856112fa565b61047b5760405162461bcd60e51b815260206004820152602c60248201527f43464150656e616c747942696446616365743a20496e636f727265637420666f60448201526b722073616c6520707269636560a01b606482015260840161020f565b6001810154600160a01b9004600b90810b9089900b12156105045760405162461bcd60e51b815260206004820152603c60248201527f43464150656e616c747942696446616365743a204e657720636f6e747269627560448201527f74696f6e2072617465206973206e6f74206869676820656e6f75676800000000606482015260840161020f565b600184015485546040805163d41c3a6560e01b8152905160009384936001600160a01b039182169362422bbe93919092169163d41c3a659160048083019260209291908290030181865afa158015610560573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105849190613065565b33306040518463ffffffff1660e01b81526004016105a493929190613082565b606060405180830381865afa1580156105c1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105e591906130a5565b92509250506105f5826000611328565b6106605760405162461bcd60e51b815260206004820152603660248201527f43464150656e616c747942696446616365743a204352454154455f464c4f57206044820152751c195c9b5a5cdcda5bdb881b9bdd0819dc985b9d195960521b606482015260840161020f565b89600b0b81600b0b12156106ee5760405162461bcd60e51b815260206004820152604960248201527f43464150656e616c747942696446616365743a204352454154455f464c4f572060448201527f7065726d697373696f6e20646f6573206e6f74206861766520656e6f75676820606482015268616c6c6f77616e636560b81b608482015260a40161020f565b42885533600160a01b6001600160601b038c1602811760018a01556002890186905560038901859055600489018a905560408051600b8d900b8152602081018c90527f51dc3f0ae56a56b314941620a5450aa63fb32261ffdd59993bdd4a5645ed6d72910160405180910390a286546040805163d41c3a6560e01b815290516000926001600160a01b03169163d41c3a659160048083019260209291908290030181865afa1580156107a4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107c89190613065565b60018801546040516346ccbfb760e11b81526001600160a01b038084166004830152600b8f900b602483015292935060009290911690638d997f6e90604401602060405180830381865afa158015610824573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108489190613037565b905060006108568c83613104565b905061086d6001600160a01b038416333084611387565b50505050505050505050505050565b600080516020613592833981519152546000805160206135d2833981519152906001600160a01b031633146108c35760405162461bcd60e51b815260040161020f9061311c565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015610901573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109259190613015565b6109415760405162461bcd60e51b815260040161020f90613179565b60008051602061361283398151915280546040805163400e2d8f60e11b815290516000805160206135f283398151915293926000926001600160a01b039091169163801c5b1e916004808201926020929091908290030181865afa1580156109ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109d19190613037565b83549091506000906109e390426131c7565b905081811080156109f957506109f7610abb565b155b610a155760405162461bcd60e51b815260040161020f906131de565b60008051602061355283398151915254600080516020613592833981519152546000805160206135728339815191525460408051918252516000805160206135f2833981519152936000805160206135d2833981519152936001600160a01b03918216939116917f70ba5911930f2b49bef0e3806b54c696faa41fcf48becb8291d011ca4c1d8db49181900360200190a3610ab089896113f8565b505050505050505050565b7feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da75460008051602061361283398151915280546040805163d41c3a6560e01b815290516000946000805160206135f283398151915294936000805160206135d2833981519152936000805160206135b283398151915293889384936001600160a01b039182169363e6a1e88893929091169163d41c3a65916004808201926020929091908290030181865afa158015610b78573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b9c9190613065565b60018701546040516001600160e01b031960e085901b168152610bce92916001600160a01b0316903090600401613082565b608060405180830381865afa158015610beb573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c0f9190613228565b505087549193509150821180610c28575080600b0b6000145b80610c385750610c366112e6565b155b965050505050505090565b610c886040518060c001604052806000815260200160006001600160a01b031681526020016000600b0b81526020016000815260200160008152602001600081525090565b506040805160c0810182526000805160206135f2833981519152548152600080516020613552833981519152546001600160a01b0381166020830152600160a01b9004600b0b918101919091527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670df5460608201527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e05460808201527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e15460a082015290565b6000610d57611927565b905090565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015610d9a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610dbe9190613015565b610dda5760405162461bcd60e51b815260040161020f90613179565b60008051602061361283398151915280546040805163400e2d8f60e11b815290516000805160206135f283398151915293926000926001600160a01b039091169163801c5b1e916004808201926020929091908290030181865afa158015610e46573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e6a9190613037565b8354909150600090610e7c90426131c7565b90508181101580610e905750610e90610abb565b610ef35760405162461bcd60e51b815260206004820152602e60248201527f43464150656e616c747942696446616365743a2042696420706572696f64206860448201526d185cc81b9bdd08195b185c1cd95960921b606482015260840161020f565b60008051602061355283398151915254600080516020613592833981519152546000805160206135728339815191525460408051918252516000805160206135f2833981519152936000805160206135d2833981519152936001600160a01b039182169391169133917f5057e7232685b7cad2bf4919b2c3e735cf044c7b689b15fd24035359a9581458919081900360200190a4610f8f611a5f565b505050505050565b600080516020613592833981519152546000805160206135d2833981519152906001600160a01b03163314610fde5760405162461bcd60e51b815260040161020f9061311c565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa15801561101c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110409190613015565b61105c5760405162461bcd60e51b815260040161020f90613179565b60008051602061361283398151915280546040805163400e2d8f60e11b815290516000805160206135f283398151915293926000926001600160a01b039091169163801c5b1e916004808201926020929091908290030181865afa1580156110c8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110ec9190613037565b83549091506000906110fe90426131c7565b905081811080156111145750611112610abb565b155b6111305760405162461bcd60e51b815260040161020f906131de565b60008051602061355283398151915254600080516020613592833981519152546000805160206135728339815191525460408051918252516000805160206135f2833981519152936000805160206135d2833981519152936001600160a01b03918216939116917fcea76e88a336bcad5acb8cf244393e65f4bbe4b4bcaa2e989f754f5f2bd29eaf9181900360200190a36111c9611a5f565b50505050505050565b600080516020613592833981519152546000805160206135d2833981519152906001600160a01b031633146112195760405162461bcd60e51b815260040161020f9061311c565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015611257573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061127b9190613015565b156112d75760405162461bcd60e51b815260206004820152602660248201527f43464150656e616c747942696446616365743a2050656e64696e67206269642060448201526565786973747360d01b606482015260840161020f565b6112e18383612269565b505050565b6000806112f161288b565b600b0b13905090565b600080826113088588613266565b6113129190613285565b6001600160601b03861614915050949350505050565b60008082600281111561133d5761133d6132a7565b0361134e5750600182811614611381565b6001826002811115611362576113626132a7565b036113755750600182811c811614611381565b506001600283901c8116145b92915050565b6040516001600160a01b03808516602483015283166044820152606481018290526113f29085906323b872dd60e01b906084015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b031990931692909217909152612a1f565b50505050565b6040805160c0810182526000805160206135f2833981519152548152600080516020613552833981519152546001600160a01b03808216602080850191909152600160a01b909204600b0b838501527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670df5460608401527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e05460808401527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e15460a08401526000805160206136128339815191528054855163d41c3a6560e01b8152955191956000805160206135b2833981519152956000805160206135d283398151915295909460009493169263d41c3a659260048181019392918290030181865afa15801561152c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115509190613065565b905060008560000160009054906101000a90046001600160a01b03166001600160a01b031663565a2e2c6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156115a9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115cd9190613065565b905060006115d9611927565b90508360400151600b0b89600b0b121561165b5760405162461bcd60e51b815260206004820152603e60248201527f4c696243464150656e616c74794269643a204e657720636f6e7472696275746960448201527f6f6e2072617465206d757374206265203e3d2070656e64696e67206269640000606482015260840161020f565b61167c60008051602061355283398151915280546001600160a01b03169055565b604051632ec8eec760e01b815230600482015260009081906001600160a01b03861690632ec8eec790602401608060405180830381865afa1580156116c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116e991906132bd565b50509150915060008082846116fe91906132f3565b126117105761170d82846132f3565b90505b600189015460408089015190516346ccbfb760e11b81526000926001600160a01b031691638d997f6e9161175f918b916004016001600160a01b03929092168252600b0b602082015260400190565b602060405180830381865afa15801561177c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117a09190613037565b90506000841215611834576117b78a30888a612af1565b604051632ec8eec760e01b81523060048201526001600160a01b03881690632ec8eec790602401608060405180830381865afa1580156117fb573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061181f91906132bd565b509195509350611831905083856132f3565b91505b61183e8d8d612269565b6000818960a001516118509190613104565b9050600080858511156118965761186786866131c7565b9450828511156118855761187b83866131c7565b9450849150611899565b61188f85846131c7565b9050611899565b50815b80156118bc5760018c01546118bc906001600160a01b038c811691163084611387565b60208b01516118d6906001600160a01b038c169085612b11565b81156118f85760018c01546118f8906001600160a01b038c8116911684612b11565b60018c0154611915906001600160a01b038c811691168b8b611387565b50505050505050505050505050505050565b60008051602061361283398151915280546040805163304fb4bb60e21b81529051600093926000805160206135f28339815191529285926001600160a01b039092169163c13ed2ec916004808201926020929091908290030181865afa158015611995573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906119b99190613037565b905060008360000160009054906101000a90046001600160a01b03166001600160a01b0316637d51ce906040518163ffffffff1660e01b8152600401602060405180830381865afa158015611a12573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a369190613037565b9050600081838560040154611a4b9190613266565b611a559190613285565b9695505050505050565b6040805160c080820183526000805160206135d283398151915280548352600080516020613592833981519152546001600160a01b03808216602080870191909152600160a01b92839004600b90810b878901527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f43546060808901919091527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f44546080808a01919091526000805160206135728339815191525460a0808b01919091528a519889018b526000805160206135f2833981519152548952600080516020613552833981519152548087168a8701529690960490920b878a01527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670df54908701527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e054908601527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e154928501929092526000805160206136128339815191528054875163d41c3a6560e01b8152975191976000805160206135b283398151915297959694600094929092169263d41c3a65926004838101939192918290030181865afa158015611c36573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611c5a9190613065565b82518555602083015160408401516001600160601b0316600160a01b026001600160a01b03909116176001860155606083015160028601556080830151600386015560a083015160048601559050611cc960008051602061355283398151915280546001600160a01b03169055565b60018501546020840151604051631cd43d1160e31b81526000926001600160a01b03169163e6a1e88891611d039186913090600401613082565b608060405180830381865afa158015611d20573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611d449190613228565b5050915050600081600b0b1315611d67576020840151611d679087903085612af1565b604051632ec8eec760e01b815230600482015260009081906001600160a01b03851690632ec8eec790602401608060405180830381865afa158015611db0573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611dd491906132bd565b5050915091506000808284611de991906132f3565b12611dfb57611df882846132f3565b90505b600189015460408088015190516346ccbfb760e11b81526000926001600160a01b031691638d997f6e91611e4a918a916004016001600160a01b03929092168252600b0b602082015260400190565b602060405180830381865afa158015611e67573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611e8b9190613037565b905060008b60000160009054906101000a90046001600160a01b03166001600160a01b031663565a2e2c6040518163ffffffff1660e01b8152600401602060405180830381865afa158015611ee4573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611f089190613065565b905081831015611f9b57611f1e8b30838a612af1565b604051632ec8eec760e01b81523060048201526001600160a01b03881690632ec8eec790602401608060405180830381865afa158015611f62573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611f8691906132bd565b509196509450611f98905084866132f3565b92505b81831061208b578a5460018c015460208a8101516040808d01518151600081529384019091526001600160a01b03948516946339255d5b94169283926394229ecb92611fef928f92913091604481016133a2565b60408051601f19818403018152918152602080830180516001600160e01b031660e095861b179052815160008152908101918290529286901b6001600160e01b031916905261204493925090602481016133e0565b6000604051808303816000875af192505050801561208457506040513d6000823e601f3d908101601f191682016040526120819190810190613416565b60015b1561208b57505b60018b0154604051631cd43d1160e31b81526001600160a01b039091169063e6a1e888906120c1908a9030908690600401613082565b608060405180830381865afa1580156120de573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906121029190613228565b5090975050506000600b87900b131561212e576040880151612129908c9083908a90612b41565b612149565b818310612149576040880151612149908c9083908a90612b61565b60018c015460208a810151908a015160028f0154604051632142170760e11b81526001600160a01b039384166004820152918316602483015260448201529116906342842e0e90606401600060405180830381600087803b1580156121ad57600080fd5b505af11580156121c1573d6000803e3d6000fd5b5050505060008083851115612219576121da84866131c7565b945060008b60a001518b60a001516121f291906131c7565b9050808611156122135791508161220981876131c7565b9550859150612217565b8592505b505b81156122395760208a0151612239906001600160a01b038b169084612b11565b80156122595760208b0151612259906001600160a01b038b169083612b11565b5050505050505050505050505050565b600080516020613612833981519152805460408051630b51881360e11b815290516000805160206135b2833981519152926000805160206135d2833981519152926000926001600160a01b03909216916316a31026916004808201926020929091908290030181865afa1580156122e4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906123089190613037565b905060008460000160009054906101000a90046001600160a01b03166001600160a01b031663014df4146040518163ffffffff1660e01b8152600401602060405180830381865afa158015612361573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906123859190613037565b9050612393868884846112fa565b6123ef5760405162461bcd60e51b815260206004820152602760248201527f4c69624346414261736550434f3a20496e636f727265637420666f722073616c6044820152666520707269636560c81b606482015260840161020f565b84546040805163d41c3a6560e01b815290516000926001600160a01b03169163d41c3a659160048083019260209291908290030181865afa158015612438573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061245c9190613065565b905060008660000160009054906101000a90046001600160a01b03166001600160a01b031663565a2e2c6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156124b5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906124d99190613065565b4286556001860180546001600160601b038c16600160a01b026001600160a01b039182168181179093556002890188905560038901879055600489018c90556040518c81529394501617907fae3c4f18410e9cfcd20fc8664a5a0082a92f07a0a5febdc22bec0c53939373369060200160405180910390a26001850154604051600b8b900b81526001600160a01b03909116907f6602f4d39e226f3807ddac3e7aab03883832e2ea2d07ccdeaf513c16679fdcd09060200160405180910390a2604051632ec8eec760e01b81523060048201526000906001600160a01b03841690632ec8eec790602401608060405180830381865afa1580156125e0573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061260491906132bd565b505060018901546040516346ccbfb760e11b81526001600160a01b038781166004830152600b8f900b602483015292945060009350911690638d997f6e90604401602060405180830381865afa158015612662573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906126869190613037565b9050818111156126b1576126b1333061269f85856131c7565b6001600160a01b038816929190611387565b60018089015490880154604051631cd43d1160e31b81526000926001600160a01b039081169263e6a1e888926126ef928a9216903090600401613082565b608060405180830381865afa15801561270c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906127309190613228565b5050915050600081600b0b131561277a576127748860010160009054906101000a90046001600160a01b031630878f8d600001612b8190949392919063ffffffff16565b506127af565b6127ad8860010160009054906101000a90046001600160a01b031630878f8d600001612ba690949392919063ffffffff16565b505b6001890154604051631cd43d1160e31b81526001600160a01b039091169063e6a1e888906127e590889030908990600401613082565b608060405180830381865afa158015612802573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906128269190613228565b5090925050506000600b82900b131561284a576128458985878f612b41565b612856565b6128568985878f612b61565b8183111561287d5761287d3361286c84866131c7565b6001600160a01b0388169190612b11565b505050505050505050505050565b7feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da75460008051602061361283398151915280546040805163d41c3a6560e01b815290516000946000805160206135b28339815191529386936001600160a01b039283169363e6a1e888939092169163d41c3a65916004808201926020929091908290030181865afa158015612924573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906129489190613065565b8554604080516315968b8b60e21b8152905130926001600160a01b03169163565a2e2c9160048083019260209291908290030181865afa158015612990573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906129b49190613065565b6040518463ffffffff1660e01b81526004016129d293929190613082565b608060405180830381865afa1580156129ef573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190612a139190613228565b50909695505050505050565b6000612a74826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316612bcb9092919063ffffffff16565b8051909150156112e15780806020019051810190612a929190613015565b6112e15760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b606482015260840161020f565b6040805160008152602081019091526113f2908590859085908590612be4565b6040516001600160a01b0383166024820152604481018290526112e190849063a9059cbb60e01b906064016113bb565b6040805160008152602081019091526113f2908590859085908590612cbb565b6040805160008152602081019091526113f2908590859085908590612d1f565b604080516000815260208101909152606090611a559087908790879087908790612d49565b604080516000815260208101909152606090611a559087908790879087908790612e4f565b6060612bda8484600085612e7d565b90505b9392505050565b845460018601546040805160008152602081019091526001600160a01b03928316926339255d5b921690819063b4b333c690612c299088908b908b90604481016134b8565b60408051808303601f1901815291815260208201805160e094851b6001600160e01b03909116179052519185901b6001600160e01b0319168252612c749392509086906004016133e0565b6000604051808303816000875af1158015612c93573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610f8f9190810190613416565b845460018601546001600160a01b03918216916339255d5b9116806350209a6287898860005b6040519080825280601f01601f191660200182016040528015612d0b576020820181803683370190505b50604051602401612c2994939291906134ec565b845460018601546001600160a01b03918216916339255d5b9116806362fc305e8789886000612ce1565b855460018701546060916001600160a01b03908116916339255d5b91168063354b9590888b8b8a60005b6040519080825280601f01601f191660200182016040528015612d9d576020820181803683370190505b50604051602401612db29594939291906133a2565b60408051808303601f1901815291815260208201805160e094851b6001600160e01b03909116179052519185901b6001600160e01b0319168252612dfd9392509087906004016133e0565b6000604051808303816000875af1158015612e1c573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052612e449190810190613416565b979650505050505050565b855460018701546060916001600160a01b03908116916339255d5b9116806394229ecb888b8b8a6000612d73565b606082471015612ede5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b606482015260840161020f565b6001600160a01b0385163b612f355760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161020f565b600080866001600160a01b03168587604051612f519190613522565b60006040518083038185875af1925050503d8060008114612f8e576040519150601f19603f3d011682016040523d82523d6000602084013e612f93565b606091505b5091509150612e4482828660608315612fad575081612bdd565b825115612fbd5782518084602001fd5b8160405162461bcd60e51b815260040161020f919061353e565b80600b0b8114612fe657600080fd5b50565b60008060408385031215612ffc57600080fd5b823561300781612fd7565b946020939093013593505050565b60006020828403121561302757600080fd5b81518015158114612bdd57600080fd5b60006020828403121561304957600080fd5b5051919050565b6001600160a01b0381168114612fe657600080fd5b60006020828403121561307757600080fd5b8151612bdd81613050565b6001600160a01b0393841681529183166020830152909116604082015260600190565b6000806000606084860312156130ba57600080fd5b83519250602084015160ff811681146130d257600080fd5b60408501519092506130e381612fd7565b809150509250925092565b634e487b7160e01b600052601160045260246000fd5b60008219821115613117576131176130ee565b500190565b6020808252603d908201527f4346414261736550434f46616365743a204f6e6c79207061796572206973206160408201527f6c6c6f77656420746f20706572666f726d207468697320616374696f6e000000606082015260800190565b6020808252602e908201527f43464150656e616c747942696446616365743a2050656e64696e67206269642060408201526d191bd95cc81b9bdd08195e1a5cdd60921b606082015260800190565b6000828210156131d9576131d96130ee565b500390565b6020808252602a908201527f43464150656e616c747942696446616365743a2042696420706572696f642068604082015269185cc8195b185c1cd95960b21b606082015260800190565b6000806000806080858703121561323e57600080fd5b84519350602085015161325081612fd7565b6040860151606090960151949790965092505050565b6000816000190483118215151615613280576132806130ee565b500290565b6000826132a257634e487b7160e01b600052601260045260246000fd5b500490565b634e487b7160e01b600052602160045260246000fd5b600080600080608085870312156132d357600080fd5b505082516020840151604085015160609095015191969095509092509050565b600080821280156001600160ff1b0384900385131615613315576133156130ee565b600160ff1b839003841281161561332e5761332e6130ee565b50500190565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561336557818101518382015260200161334d565b838111156113f25750506000910152565b6000815180845261338e81602086016020860161334a565b601f01601f19169290920160200192915050565b6001600160a01b038681168252858116602083015284166040820152600b83900b606082015260a060808201819052600090612e4490830184613376565b6001600160a01b038416815260606020820181905260009061340490830185613376565b8281036040840152611a558185613376565b60006020828403121561342857600080fd5b815167ffffffffffffffff8082111561344057600080fd5b818401915084601f83011261345457600080fd5b81518181111561346657613466613334565b604051601f8201601f19908116603f0116810190838211818310171561348e5761348e613334565b816040528281528760208487010111156134a757600080fd5b612e4483602083016020880161334a565b6001600160a01b038581168252848116602083015283166040820152608060608201819052600090611a5590830184613376565b6001600160a01b03858116825284166020820152600b83900b6040820152608060608201819052600090611a5590830184613376565b6000825161353481846020870161334a565b9190910192915050565b602081526000612bdd602083018461337656feab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670de3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f453c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f42eaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da63c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f41ab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670dd7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532c9a26469706673582212206b13855829d88ca981f7526798f5cbacec8b661af7103fcabf74e03a0be54f7864736f6c634300080e0033";

type CFAPenaltyBidFacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CFAPenaltyBidFacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CFAPenaltyBidFacet__factory extends ContractFactory {
  constructor(...args: CFAPenaltyBidFacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "CFAPenaltyBidFacet";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CFAPenaltyBidFacet> {
    return super.deploy(overrides || {}) as Promise<CFAPenaltyBidFacet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): CFAPenaltyBidFacet {
    return super.attach(address) as CFAPenaltyBidFacet;
  }
  connect(signer: Signer): CFAPenaltyBidFacet__factory {
    return super.connect(signer) as CFAPenaltyBidFacet__factory;
  }
  static readonly contractName: "CFAPenaltyBidFacet";
  public readonly contractName: "CFAPenaltyBidFacet";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CFAPenaltyBidFacetInterface {
    return new utils.Interface(_abi) as CFAPenaltyBidFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CFAPenaltyBidFacet {
    return new Contract(address, _abi, signerOrProvider) as CFAPenaltyBidFacet;
  }
}
