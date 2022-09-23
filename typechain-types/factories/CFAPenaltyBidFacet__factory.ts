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
  "0x608060405234801561001057600080fd5b5061360e806100206000396000f3fe608060405234801561001057600080fd5b50600436106100925760003560e01c806392f1f73e1161006657806392f1f73e146100fb5780639e41ec6714610156578063ce2ccb151461016c578063e52a787414610174578063f11663e81461017c57600080fd5b8062fa680214610097578063084024a2146100ac578063499ca2f5146100e057806390ee40bf146100f3575b600080fd5b6100aa6100a5366004612f99565b61018f565b005b6000805160206134f9833981519152546000600160a01b909104600b0b135b60405190151581526020015b60405180910390f35b6100aa6100ee366004612f99565b61093e565b6100cb610b7d565b610103610d05565b6040516100d79190815181526020808301516001600160a01b031690820152604080830151600b0b90820152606080830151908201526080808301519082015260a0918201519181019190915260c00190565b61015e610e0f565b6040519081526020016100d7565b6100aa610e1e565b6100aa611059565b6100aa61018a366004612f99565b611294565b6101976113a8565b6102185760405162461bcd60e51b815260206004820152604160248201527f4346414261736550434f46616365743a2043616e206f6e6c7920706572666f7260448201527f6d20616374696f6e207768656e207061796572206269642069732061637469766064820152606560f81b608482015260a4015b60405180910390fd5b60008051602061353983398151915254600080516020613579833981519152906001600160a01b031633036102b55760405162461bcd60e51b815260206004820152603c60248201527f4346414261736550434f46616365743a205061796572206973206e6f7420616c60448201527f6c6f77656420746f20706572666f726d207468697320616374696f6e00000000606482015260840161020f565b60006000805160206135998339815191529050306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015610306573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061032a9190612fc5565b1561038e5760405162461bcd60e51b815260206004820152602e60248201527f43464150656e616c747942696446616365743a2050656e64696e67206269642060448201526d616c72656164792065786973747360901b606482015260840161020f565b6000805160206135b9833981519152805460408051630b51881360e11b81529051600080516020613559833981519152926000926001600160a01b03909116916316a31026916004808201926020929091908290030181865afa1580156103f9573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061041d9190612fe7565b905060008360000160009054906101000a90046001600160a01b03166001600160a01b031663014df4146040518163ffffffff1660e01b8152600401602060405180830381865afa158015610476573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061049a9190612fe7565b90506000805160206135798339815191526104b7888a85856113bc565b6105185760405162461bcd60e51b815260206004820152602c60248201527f43464150656e616c747942696446616365743a20496e636f727265637420666f60448201526b722073616c6520707269636560a01b606482015260840161020f565b6001810154600160a01b9004600b90810b908a900b12156105a15760405162461bcd60e51b815260206004820152603c60248201527f43464150656e616c747942696446616365743a204e657720636f6e747269627560448201527f74696f6e2072617465206973206e6f74206869676820656e6f75676800000000606482015260840161020f565b600184015485546040805163d41c3a6560e01b8152905160009384936001600160a01b039182169362422bbe93919092169163d41c3a659160048083019260209291908290030181865afa1580156105fd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106219190613000565b33306040518463ffffffff1660e01b815260040161064193929190613029565b606060405180830381865afa15801561065e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610682919061304c565b92509250506106928260006113ea565b6106fd5760405162461bcd60e51b815260206004820152603660248201527f43464150656e616c747942696446616365743a204352454154455f464c4f57206044820152751c195c9b5a5cdcda5bdb881b9bdd0819dc985b9d195960521b606482015260840161020f565b8a600b0b81600b0b121561078b5760405162461bcd60e51b815260206004820152604960248201527f43464150656e616c747942696446616365743a204352454154455f464c4f572060448201527f7065726d697373696f6e20646f6573206e6f74206861766520656e6f75676820606482015268616c6c6f77616e636560b81b608482015260a40161020f565b42885533600160a01b6001600160601b038d1602811760018a01556002890186905560038901859055600489018b905560408051600b8e900b8152602081018d90527f51dc3f0ae56a56b314941620a5450aa63fb32261ffdd59993bdd4a5645ed6d72910160405180910390a286546040805163d41c3a6560e01b815290516000926001600160a01b03169163d41c3a659160048083019260209291908290030181865afa158015610841573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108659190613000565b905060008760000160010160009054906101000a90046001600160a01b03166001600160a01b0316638d997f6e838f6040518363ffffffff1660e01b81526004016108c89291906001600160a01b03929092168252600b0b602082015260400190565b602060405180830381865afa1580156108e5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109099190612fe7565b905060006109178d836130ab565b905061092e6001600160a01b038416333084611449565b5050505050505050505050505050565b60008051602061353983398151915254600080516020613579833981519152906001600160a01b031633146109855760405162461bcd60e51b815260040161020f906130c3565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa1580156109c3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109e79190612fc5565b610a035760405162461bcd60e51b815260040161020f90613120565b6000805160206135b983398151915280546040805163400e2d8f60e11b8152905160008051602061359983398151915293926000926001600160a01b039091169163801c5b1e916004808201926020929091908290030181865afa158015610a6f573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a939190612fe7565b8354909150600090610aa5904261316e565b90508181108015610abb5750610ab9610b7d565b155b610ad75760405162461bcd60e51b815260040161020f90613185565b6000805160206134f9833981519152546000805160206135398339815191525460008051602061351983398151915254604080519182525160008051602061359983398151915293600080516020613579833981519152936001600160a01b03918216939116917f70ba5911930f2b49bef0e3806b54c696faa41fcf48becb8291d011ca4c1d8db49181900360200190a3610b7289896114ba565b505050505050505050565b7feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da7546000805160206135b983398151915280546040805163d41c3a6560e01b8152905160009460008051602061359983398151915294936000805160206135798339815191529360008051602061355983398151915293889384936001600160a01b039182169363e6a1e88893929091169163d41c3a65916004808201926020929091908290030181865afa158015610c3a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c5e9190613000565b60018701546040516001600160e01b031960e085901b168152610c9092916001600160a01b0316903090600401613029565b608060405180830381865afa158015610cad573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610cd191906131cf565b505087549193509150821180610cea575080600b0b6000145b80610cfa5750610cf86113a8565b155b965050505050505090565b610d4a6040518060c001604052806000815260200160006001600160a01b031681526020016000600b0b81526020016000815260200160008152602001600081525090565b506040805160c0810182526000805160206135998339815191525481526000805160206134f9833981519152546001600160a01b0381166020830152600160a01b9004600b0b918101919091527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670df5460608201527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e05460808201527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e15460a082015290565b6000610e1961196e565b905090565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015610e5c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e809190612fc5565b610e9c5760405162461bcd60e51b815260040161020f90613120565b6000805160206135b983398151915280546040805163400e2d8f60e11b8152905160008051602061359983398151915293926000926001600160a01b039091169163801c5b1e916004808201926020929091908290030181865afa158015610f08573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f2c9190612fe7565b8354909150600090610f3e904261316e565b90508181101580610f525750610f52610b7d565b610fb55760405162461bcd60e51b815260206004820152602e60248201527f43464150656e616c747942696446616365743a2042696420706572696f64206860448201526d185cc81b9bdd08195b185c1cd95960921b606482015260840161020f565b6000805160206134f9833981519152546000805160206135398339815191525460008051602061351983398151915254604080519182525160008051602061359983398151915293600080516020613579833981519152936001600160a01b039182169391169133917f5057e7232685b7cad2bf4919b2c3e735cf044c7b689b15fd24035359a9581458919081900360200190a4611051611aa6565b505050505050565b60008051602061353983398151915254600080516020613579833981519152906001600160a01b031633146110a05760405162461bcd60e51b815260040161020f906130c3565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa1580156110de573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111029190612fc5565b61111e5760405162461bcd60e51b815260040161020f90613120565b6000805160206135b983398151915280546040805163400e2d8f60e11b8152905160008051602061359983398151915293926000926001600160a01b039091169163801c5b1e916004808201926020929091908290030181865afa15801561118a573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111ae9190612fe7565b83549091506000906111c0904261316e565b905081811080156111d657506111d4610b7d565b155b6111f25760405162461bcd60e51b815260040161020f90613185565b6000805160206134f9833981519152546000805160206135398339815191525460008051602061351983398151915254604080519182525160008051602061359983398151915293600080516020613579833981519152936001600160a01b03918216939116917fcea76e88a336bcad5acb8cf244393e65f4bbe4b4bcaa2e989f754f5f2bd29eaf9181900360200190a361128b611aa6565b50505050505050565b60008051602061353983398151915254600080516020613579833981519152906001600160a01b031633146112db5760405162461bcd60e51b815260040161020f906130c3565b306001600160a01b031663084024a26040518163ffffffff1660e01b8152600401602060405180830381865afa158015611319573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061133d9190612fc5565b156113995760405162461bcd60e51b815260206004820152602660248201527f43464150656e616c747942696446616365743a2050656e64696e67206269642060448201526565786973747360d01b606482015260840161020f565b6113a3838361220f565b505050565b6000806113b361278e565b600b0b13905090565b600080826113ca858861320d565b6113d4919061322c565b6001600160601b03861614915050949350505050565b6000808260028111156113ff576113ff61324e565b036114105750600182811614611443565b60018260028111156114245761142461324e565b036114375750600182811c811614611443565b506001600283901c8116145b92915050565b6040516001600160a01b03808516602483015283166044820152606481018290526114b49085906323b872dd60e01b906084015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b0319909316929092179091526128bf565b50505050565b6040805160c0810182526000805160206135998339815191525481526000805160206134f9833981519152546001600160a01b03808216602080850191909152600160a01b909204600b0b838501527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670df5460608401527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e05460808401527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e15460a08401526000805160206135b98339815191528054855163d41c3a6560e01b8152955191956000805160206135598339815191529560008051602061357983398151915295909460009493169263d41c3a659260048181019392918290030181865afa1580156115ee573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116129190613000565b9050600061161e61196e565b90508260400151600b0b88600b0b12156116a05760405162461bcd60e51b815260206004820152603e60248201527f4c696243464150656e616c74794269643a204e657720636f6e7472696275746960448201527f6f6e2072617465206d757374206265203e3d2070656e64696e67206269640000606482015260840161020f565b6116a8612991565b604051632ec8eec760e01b815230600482015260009081906001600160a01b03851690632ec8eec790602401608060405180830381865afa1580156116f1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117159190613264565b505091509150600080828461172a919061329a565b1261173c57611739828461329a565b90505b600188015460408088015190516346ccbfb760e11b81526000926001600160a01b031691638d997f6e9161178b918a916004016001600160a01b03929092168252600b0b602082015260400190565b602060405180830381865afa1580156117a8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117cc9190612fe7565b905060006117d86129c0565b9050600085121561186c576117ef8a30838a6129ee565b604051632ec8eec760e01b81523060048201526001600160a01b03881690632ec8eec790602401608060405180830381865afa158015611833573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906118579190613264565b5091965094506118699050848661329a565b92505b6118768d8d61220f565b6000828960a0015161188891906130ab565b9050600080868611156118ce5761189f878761316e565b9550828611156118bd576118b3838761316e565b95508591506118d1565b6118c7868461316e565b90506118d1565b50815b80156118f45760018c01546118f4906001600160a01b038c811691163084611449565b60208b015161190e906001600160a01b038c169085612a0e565b81156119305760018c0154611930906001600160a01b038c8116911684612a0e565b60018c015461195c906001600160a01b031661194a6129c0565b6001600160a01b038d1691908c611449565b50505050505050505050505050505050565b6000805160206135b983398151915280546040805163304fb4bb60e21b81529051600093926000805160206135998339815191529285926001600160a01b039092169163c13ed2ec916004808201926020929091908290030181865afa1580156119dc573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a009190612fe7565b905060008360000160009054906101000a90046001600160a01b03166001600160a01b0316637d51ce906040518163ffffffff1660e01b8152600401602060405180830381865afa158015611a59573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a7d9190612fe7565b9050600081838560040154611a92919061320d565b611a9c919061322c565b9695505050505050565b6040805160c0808201835260008051602061357983398151915280548352600080516020613539833981519152546001600160a01b03808216602080870191909152600160a01b92839004600b90810b878901527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f43546060808901919091527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f44546080808a01919091526000805160206135198339815191525460a0808b01919091528a519889018b526000805160206135998339815191525489526000805160206134f9833981519152548087168a8701529690960490920b878a01527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670df54908701527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e054908601527fab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670e154928501929092526000805160206135b98339815191528054875163d41c3a6560e01b81529751919760008051602061355983398151915297959694600094929092169263d41c3a65926004838101939192918290030181865afa158015611c7d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611ca19190613000565b82518555602083015160408401516001600160601b0316600160a01b026001600160a01b03909116176001860155606083015160028601556080830151600386015560a083015160048601559050611cf7612991565b60018501546020840151604051631cd43d1160e31b81526000926001600160a01b03169163e6a1e88891611d319186913090600401613029565b608060405180830381865afa158015611d4e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611d7291906131cf565b5050915050600081600b0b1315611d95576020840151611d9590879030856129ee565b604051632ec8eec760e01b815230600482015260009081906001600160a01b03851690632ec8eec790602401608060405180830381865afa158015611dde573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611e029190613264565b5050915091506000808284611e17919061329a565b12611e2957611e26828461329a565b90505b600189015460408088015190516346ccbfb760e11b81526000926001600160a01b031691638d997f6e91611e78918a916004016001600160a01b03929092168252600b0b602082015260400190565b602060405180830381865afa158015611e95573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611eb99190612fe7565b90506000611ec56129c0565b905081831015611f5857611edb8b30838a6129ee565b604051632ec8eec760e01b81523060048201526001600160a01b03881690632ec8eec790602401608060405180830381865afa158015611f1f573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611f439190613264565b509196509450611f559050848661329a565b92505b818310612048578a5460018c015460208a8101516040808d01518151600081529384019091526001600160a01b03948516946339255d5b94169283926394229ecb92611fac928f9291309160448101613349565b60408051601f19818403018152918152602080830180516001600160e01b031660e095861b179052815160008152908101918290529286901b6001600160e01b03191690526120019392509060248101613387565b6000604051808303816000875af192505050801561204157506040513d6000823e601f3d908101601f1916820160405261203e91908101906133bd565b60015b1561204857505b60018b0154604051631cd43d1160e31b81526001600160a01b039091169063e6a1e8889061207e908a9030908690600401613029565b608060405180830381865afa15801561209b573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906120bf91906131cf565b5090975050506000600b87900b13156120eb5760408801516120e6908c9083908a90612a3e565b6120ff565b8183106120ff576120ff8860400151612a5e565b60018c015460208a810151908a015160028f0154604051632142170760e11b81526001600160a01b039384166004820152918316602483015260448201529116906342842e0e90606401600060405180830381600087803b15801561216357600080fd5b505af1158015612177573d6000803e3d6000fd5b50505050600080838511156121cf57612190848661316e565b945060008b60a001518b60a001516121a8919061316e565b9050808611156121c9579150816121bf818761316e565b95508591506121cd565b8592505b505b81156121ef5760208a01516121ef906001600160a01b038b169084612a0e565b801561092e5760208b015161092e906001600160a01b038b169083612a0e565b6000805160206135b9833981519152805460408051630b51881360e11b8152905160008051602061355983398151915292600080516020613579833981519152926000926001600160a01b03909216916316a31026916004808201926020929091908290030181865afa15801561228a573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906122ae9190612fe7565b905060008460000160009054906101000a90046001600160a01b03166001600160a01b031663014df4146040518163ffffffff1660e01b8152600401602060405180830381865afa158015612307573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061232b9190612fe7565b9050612339868884846113bc565b6123955760405162461bcd60e51b815260206004820152602760248201527f4c69624346414261736550434f3a20496e636f727265637420666f722073616c6044820152666520707269636560c81b606482015260840161020f565b84546040805163d41c3a6560e01b815290516000926001600160a01b03169163d41c3a659160048083019260209291908290030181865afa1580156123de573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906124029190613000565b4285556001850180546001600160601b038b16600160a01b026001600160a01b039182168181179093556002880187905560038801869055600488018b90556040518b81529394501617907fae3c4f18410e9cfcd20fc8664a5a0082a92f07a0a5febdc22bec0c53939373369060200160405180910390a26001840154604051600b8a900b81526001600160a01b03909116907f6602f4d39e226f3807ddac3e7aab03883832e2ea2d07ccdeaf513c16679fdcd09060200160405180910390a2604051632ec8eec760e01b81523060048201526000906001600160a01b03831690632ec8eec790602401608060405180830381865afa158015612509573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061252d9190613264565b505060018801546040516346ccbfb760e11b81526001600160a01b038681166004830152600b8e900b602483015292945060009350911690638d997f6e90604401602060405180830381865afa15801561258b573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906125af9190612fe7565b9050818111156125da576125da33306125c8858561316e565b6001600160a01b038716929190611449565b60018088015490870154604051631cd43d1160e31b81526000926001600160a01b039081169263e6a1e8889261261892899216903090600401613029565b608060405180830381865afa158015612635573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061265991906131cf565b5050915050600081600b0b131561268c5760018701546126869089906001600160a01b031630878f612b0c565b506126aa565b60018701546126a89089906001600160a01b031630878f612b31565b505b60006126b46129c0565b60018a0154604051631cd43d1160e31b81529192506001600160a01b03169063e6a1e888906126eb90889030908690600401613029565b608060405180830381865afa158015612708573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061272c91906131cf565b5090935050506000600b83900b13156127505761274b8982878f612a3e565b612759565b6127598c612a5e565b82841115612780576127803361276f858761316e565b6001600160a01b0388169190612a0e565b505050505050505050505050565b7feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da7546000805160206135b983398151915280546040805163d41c3a6560e01b815290516000946000805160206135598339815191529386936001600160a01b039283169363e6a1e888939092169163d41c3a65916004808201926020929091908290030181865afa158015612827573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061284b9190613000565b306128546129c0565b6040518463ffffffff1660e01b815260040161287293929190613029565b608060405180830381865afa15801561288f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906128b391906131cf565b50909695505050505050565b6000612914826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316612b569092919063ffffffff16565b8051909150156113a357808060200190518101906129329190612fc5565b6113a35760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b606482015260840161020f565b6000805160206134f983398151915280546001600160a01b031690554260008051602061359983398151915255565b7f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532cc546001600160a01b031690565b6040805160008152602081019091526114b4908590859085908590612b6f565b6040516001600160a01b0383166024820152604481018290526113a390849063a9059cbb60e01b9060640161147d565b6040805160008152602081019091526114b4908590859085908590612c46565b6000805160206135b983398151915280546040805163d41c3a6560e01b8152905160008051602061355983398151915293926000926001600160a01b039091169163d41c3a65916004808201926020929091908290030181865afa158015612aca573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190612aee9190613000565b60038301549091506114b49084906001600160a01b03168387612caa565b604080516000815260208101909152606090611a9c9087908790879087908790612cca565b604080516000815260208101909152606090611a9c9087908790879087908790612dd0565b6060612b658484600085612dfe565b90505b9392505050565b845460018601546040805160008152602081019091526001600160a01b03928316926339255d5b921690819063b4b333c690612bb49088908b908b906044810161345f565b60408051808303601f1901815291815260208201805160e094851b6001600160e01b03909116179052519185901b6001600160e01b0319168252612bff939250908690600401613387565b6000604051808303816000875af1158015612c1e573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261105191908101906133bd565b845460018601546001600160a01b03918216916339255d5b9116806350209a6287898860005b6040519080825280601f01601f191660200182016040528015612c96576020820181803683370190505b50604051602401612bb49493929190613493565b6040805160008152602081019091526114b4908590859085908590612f24565b855460018701546060916001600160a01b03908116916339255d5b91168063354b9590888b8b8a60005b6040519080825280601f01601f191660200182016040528015612d1e576020820181803683370190505b50604051602401612d33959493929190613349565b60408051808303601f1901815291815260208201805160e094851b6001600160e01b03909116179052519185901b6001600160e01b0319168252612d7e939250908790600401613387565b6000604051808303816000875af1158015612d9d573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052612dc591908101906133bd565b979650505050505050565b855460018701546060916001600160a01b03908116916339255d5b9116806394229ecb888b8b8a6000612cf4565b606082471015612e5f5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b606482015260840161020f565b6001600160a01b0385163b612eb65760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161020f565b600080866001600160a01b03168587604051612ed291906134c9565b60006040518083038185875af1925050503d8060008114612f0f576040519150601f19603f3d011682016040523d82523d6000602084013e612f14565b606091505b5091509150612dc5828286612f4e565b845460018601546001600160a01b03918216916339255d5b9116806362fc305e8789886000612c6c565b60608315612f5d575081612b68565b825115612f6d5782518084602001fd5b8160405162461bcd60e51b815260040161020f91906134e5565b80600b0b8114612f9657600080fd5b50565b60008060408385031215612fac57600080fd5b8235612fb781612f87565b946020939093013593505050565b600060208284031215612fd757600080fd5b81518015158114612b6857600080fd5b600060208284031215612ff957600080fd5b5051919050565b60006020828403121561301257600080fd5b81516001600160a01b0381168114612b6857600080fd5b6001600160a01b0393841681529183166020830152909116604082015260600190565b60008060006060848603121561306157600080fd5b83519250602084015160ff8116811461307957600080fd5b604085015190925061308a81612f87565b809150509250925092565b634e487b7160e01b600052601160045260246000fd5b600082198211156130be576130be613095565b500190565b6020808252603d908201527f4346414261736550434f46616365743a204f6e6c79207061796572206973206160408201527f6c6c6f77656420746f20706572666f726d207468697320616374696f6e000000606082015260800190565b6020808252602e908201527f43464150656e616c747942696446616365743a2050656e64696e67206269642060408201526d191bd95cc81b9bdd08195e1a5cdd60921b606082015260800190565b60008282101561318057613180613095565b500390565b6020808252602a908201527f43464150656e616c747942696446616365743a2042696420706572696f642068604082015269185cc8195b185c1cd95960b21b606082015260800190565b600080600080608085870312156131e557600080fd5b8451935060208501516131f781612f87565b6040860151606090960151949790965092505050565b600081600019048311821515161561322757613227613095565b500290565b60008261324957634e487b7160e01b600052601260045260246000fd5b500490565b634e487b7160e01b600052602160045260246000fd5b6000806000806080858703121561327a57600080fd5b505082516020840151604085015160609095015191969095509092509050565b600080821280156001600160ff1b03849003851316156132bc576132bc613095565b600160ff1b83900384128116156132d5576132d5613095565b50500190565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561330c5781810151838201526020016132f4565b838111156114b45750506000910152565b600081518084526133358160208601602086016132f1565b601f01601f19169290920160200192915050565b6001600160a01b038681168252858116602083015284166040820152600b83900b606082015260a060808201819052600090612dc59083018461331d565b6001600160a01b03841681526060602082018190526000906133ab9083018561331d565b8281036040840152611a9c818561331d565b6000602082840312156133cf57600080fd5b815167ffffffffffffffff808211156133e757600080fd5b818401915084601f8301126133fb57600080fd5b81518181111561340d5761340d6132db565b604051601f8201601f19908116603f01168101908382118183101715613435576134356132db565b8160405282815287602084870101111561344e57600080fd5b612dc58360208301602088016132f1565b6001600160a01b038581168252848116602083015283166040820152608060608201819052600090611a9c9083018461331d565b6001600160a01b03858116825284166020820152600b83900b6040820152608060608201819052600090611a9c9083018461331d565b600082516134db8184602087016132f1565b9190910192915050565b602081526000612b68602083018461331d56feab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670de3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f453c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f42eaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da63c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f41ab844abc5ac35bdf8e8581a4c7c97fb9e92911442226ad6bdb029a2dbfe670dd7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532c9a26469706673582212201c83c6548ea75816364ab662de802d7c7f472c435f6156c2b215ea782207ee2464736f6c634300080e0033";

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
