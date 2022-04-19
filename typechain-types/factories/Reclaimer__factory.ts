/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Reclaimer, ReclaimerInterface } from "../Reclaimer";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "licenseId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "ParcelReclaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PAUSE_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "RECLAIM_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionApp",
    outputs: [
      {
        internalType: "contract AuctionSuperApp",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "auctionLength",
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
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "int96",
        name: "initialContributionRate",
        type: "int96",
      },
      {
        internalType: "bytes",
        name: "claimData",
        type: "bytes",
      },
    ],
    name: "claim",
    outputs: [
      {
        internalType: "uint256",
        name: "licenseId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "int96",
        name: "initialContributionRate",
        type: "int96",
      },
      {
        internalType: "bytes",
        name: "claimData",
        type: "bytes",
      },
    ],
    name: "claimPrice",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
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
    name: "license",
    outputs: [
      {
        internalType: "contract ERC721License",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
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
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_auctionLength",
        type: "uint256",
      },
    ],
    name: "setAuctionLength",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_licenseAddress",
        type: "address",
      },
    ],
    name: "setLicense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_superAppAddress",
        type: "address",
      },
    ],
    name: "setSuperApp",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
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
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506000805460ff191681556100259033610054565b61004f7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d33610054565b6100e9565b61005e8282610062565b5050565b60008281526001602090815260408083206001600160a01b038516845290915290205460ff1661005e5760008281526001602081815260408084206001600160a01b0386168086529252808420805460ff19169093179092559051339285917f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d9190a45050565b610f2b806100f86000396000f3fe608060405234801561001057600080fd5b506004361061012c5760003560e01c80635c975abb116100ad578063b4b3d07111610071578063b4b3d0711461027d578063b579605b14610290578063c67a6da7146102a3578063d547741f146102b6578063f0508a49146102c957600080fd5b80635c975abb1461023c5780636b87d24c146102475780638456cb591461025a57806391d1485414610262578063a217fddf1461027557600080fd5b806336568abe116100f457806336568abe146101bc578063389ed267146101cf5780633bbdc70c146101f65780633f4ba83a14610221578063536a0a0f1461022957600080fd5b806301ffc9a7146101315780630fd21c1714610159578063248a9ca31461016e5780632f2ff15d146101a0578063325c25a2146101b3575b600080fd5b61014461013f366004610d24565b6102f0565b60405190151581526020015b60405180910390f35b61016c610167366004610c12565b610327565b005b61019261017c366004610cdd565b6000908152600160208190526040909120015490565b604051908152602001610150565b61016c6101ae366004610cf5565b610356565b61019260045481565b61016c6101ca366004610cf5565b610382565b6101927f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d81565b600354610209906001600160a01b031681565b6040516001600160a01b039091168152602001610150565b61016c610405565b610192610237366004610c4a565b61043b565b60005460ff16610144565b600254610209906001600160a01b031681565b61016c6104fe565b610144610270366004610cf5565b610531565b610192600081565b61016c61028b366004610c12565b61055c565b61016c61029e366004610cdd565b61058b565b6101926102b1366004610c4a565b61059d565b61016c6102c4366004610cf5565b6107be565b6101927fbe4deb78b308a3165ab7e8ef2c58b7d7ca69d79804ab6d12cf8dc9c4eba2fd0481565b60006001600160e01b03198216637965db0b60e01b148061032157506301ffc9a760e01b6001600160e01b03198316145b92915050565b600061033381336107e5565b50600280546001600160a01b0319166001600160a01b0392909216919091179055565b6000828152600160208190526040909120015461037381336107e5565b61037d8383610849565b505050565b6001600160a01b03811633146103f75760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084015b60405180910390fd5b61040182826108b4565b5050565b7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d61043081336107e5565b61043861091b565b50565b6000808061044b84860186610d4c565b6004549193509150816104a05760405162461bcd60e51b815260206004820152601d60248201527f70617263656c206973206e6f7420666f72207265636c616d6174696f6e00000060448201526064016103ee565b6104aa8183610e15565b4211156104bd57600093505050506104f6565b60006104c98342610e6c565b90506000826104d88387610e4d565b6104e29190610e2d565b90506104ee8186610e6c565b955050505050505b949350505050565b7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d61052981336107e5565b6104386109ae565b60009182526001602090815260408084206001600160a01b0393909316845291905290205460ff1690565b600061056881336107e5565b50600380546001600160a01b0319166001600160a01b0392909216919091179055565b600061059781336107e5565b50600455565b60007fbe4deb78b308a3165ab7e8ef2c58b7d7ca69d79804ab6d12cf8dc9c4eba2fd046105ca81336107e5565b60005460ff16156106105760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016103ee565b600061061e84860186610cdd565b6002546040516331a9108f60e11b8152600481018390529192506000916001600160a01b0390911690636352211e9060240160206040518083038186803b15801561066857600080fd5b505afa15801561067c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106a09190610c2e565b90506001600160a01b03811661070f5760405162461bcd60e51b815260206004820152602e60248201527f5265636c61696d65723a2043616e6e6f74207265636c61696d206e6f6e2d657860448201526d697374656e74206c6963656e736560901b60648201526084016103ee565b600254604051632142170760e11b81526001600160a01b0383811660048301528a8116602483015260448201859052909116906342842e0e90606401600060405180830381600087803b15801561076557600080fd5b505af1158015610779573d6000803e3d6000fd5b50506040516001600160a01b038b1692508491507fa9c438841b876f2fa107e9d4406088f582443207e7de4318c91b4c379c3c6c4090600090a3505050949350505050565b600082815260016020819052604090912001546107db81336107e5565b61037d83836108b4565b6107ef8282610531565b61040157610807816001600160a01b03166014610a29565b610812836020610a29565b604051602001610823929190610d6d565b60408051601f198184030181529082905262461bcd60e51b82526103ee91600401610de2565b6108538282610531565b6104015760008281526001602081815260408084206001600160a01b0386168086529252808420805460ff19169093179092559051339285917f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d9190a45050565b6108be8282610531565b156104015760008281526001602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b60005460ff166109645760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b60448201526064016103ee565b6000805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b60005460ff16156109f45760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016103ee565b6000805460ff191660011790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586109913390565b60606000610a38836002610e4d565b610a43906002610e15565b67ffffffffffffffff811115610a6957634e487b7160e01b600052604160045260246000fd5b6040519080825280601f01601f191660200182016040528015610a93576020820181803683370190505b509050600360fc1b81600081518110610abc57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350600f60fb1b81600181518110610af957634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a9053506000610b1d846002610e4d565b610b28906001610e15565b90505b6001811115610bbc576f181899199a1a9b1b9c1cb0b131b232b360811b85600f1660108110610b6a57634e487b7160e01b600052603260045260246000fd5b1a60f81b828281518110610b8e57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060049490941c93610bb581610eb3565b9050610b2b565b508315610c0b5760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e7460448201526064016103ee565b9392505050565b600060208284031215610c23578081fd5b8135610c0b81610ee0565b600060208284031215610c3f578081fd5b8151610c0b81610ee0565b60008060008060608587031215610c5f578283fd5b8435610c6a81610ee0565b93506020850135600b81900b8114610c80578384fd5b9250604085013567ffffffffffffffff80821115610c9c578384fd5b818701915087601f830112610caf578384fd5b813581811115610cbd578485fd5b886020828501011115610cce578485fd5b95989497505060200194505050565b600060208284031215610cee578081fd5b5035919050565b60008060408385031215610d07578182fd5b823591506020830135610d1981610ee0565b809150509250929050565b600060208284031215610d35578081fd5b81356001600160e01b031981168114610c0b578182fd5b60008060408385031215610d5e578182fd5b50508035926020909101359150565b7f416363657373436f6e74726f6c3a206163636f756e7420000000000000000000815260008351610da5816017850160208801610e83565b7001034b99036b4b9b9b4b733903937b6329607d1b6017918401918201528351610dd6816028840160208801610e83565b01602801949350505050565b6020815260008251806020840152610e01816040850160208701610e83565b601f01601f19169190910160400192915050565b60008219821115610e2857610e28610eca565b500190565b600082610e4857634e487b7160e01b81526012600452602481fd5b500490565b6000816000190483118215151615610e6757610e67610eca565b500290565b600082821015610e7e57610e7e610eca565b500390565b60005b83811015610e9e578181015183820152602001610e86565b83811115610ead576000848401525b50505050565b600081610ec257610ec2610eca565b506000190190565b634e487b7160e01b600052601160045260246000fd5b6001600160a01b038116811461043857600080fdfea2646970667358221220af047278efa08b0a5a30a5187cc2111f1154552fa19c7745086e9568981dd16164736f6c63430008040033";

type ReclaimerConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ReclaimerConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Reclaimer__factory extends ContractFactory {
  constructor(...args: ReclaimerConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "Reclaimer";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Reclaimer> {
    return super.deploy(overrides || {}) as Promise<Reclaimer>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Reclaimer {
    return super.attach(address) as Reclaimer;
  }
  connect(signer: Signer): Reclaimer__factory {
    return super.connect(signer) as Reclaimer__factory;
  }
  static readonly contractName: "Reclaimer";
  public readonly contractName: "Reclaimer";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ReclaimerInterface {
    return new utils.Interface(_abi) as ReclaimerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Reclaimer {
    return new Contract(address, _abi, signerOrProvider) as Reclaimer;
  }
}
