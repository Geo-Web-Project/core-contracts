/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  FairLaunchClaimer,
  FairLaunchClaimerInterface,
} from "../FairLaunchClaimer";

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
        name: "parcelId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "ParcelClaimed",
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
    name: "CLAIM_ROLE",
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
    name: "auctionEnd",
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
    inputs: [],
    name: "auctionStart",
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
    inputs: [],
    name: "endingBid",
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
    name: "parcel",
    outputs: [
      {
        internalType: "contract GeoWebParcel",
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
        name: "_auctionEnd",
        type: "uint256",
      },
    ],
    name: "setAuctionEnd",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_auctionStart",
        type: "uint256",
      },
    ],
    name: "setAuctionStart",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_endingBid",
        type: "uint256",
      },
    ],
    name: "setEndingBid",
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
        name: "_parcelAddress",
        type: "address",
      },
    ],
    name: "setParcel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_startingBid",
        type: "uint256",
      },
    ],
    name: "setStartingBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "startingBid",
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
  "0x608060405234801561001057600080fd5b506000805460ff191681556100259033610054565b61004f7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d33610054565b6100e9565b61005e8282610062565b5050565b60008281526001602090815260408083206001600160a01b038516845290915290205460ff1661005e5760008281526001602081815260408084206001600160a01b0386168086529252808420805460ff19169093179092559051339285917f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d9190a45050565b611110806100f86000396000f3fe608060405234801561001057600080fd5b506004361061018e5760003560e01c8063536a0a0f116100de57806386c1b4eb11610097578063b9fdd56911610071578063b9fdd56914610364578063c67a6da71461036d578063d547741f14610380578063d9a25a6f1461039357600080fd5b806386c1b4eb1461032257806391d1485414610349578063a217fddf1461035c57600080fd5b8063536a0a0f146102ab5780635c975abb146102be5780636b87d24c146102c9578063738ce0ca146102f4578063841c6b5c146103075780638456cb591461031a57600080fd5b80632a24f46c1161014b578063389ed26711610125578063389ed2671461026a5780633f4ba83a146102915780634f1130c3146102995780634f245ef7146102a257600080fd5b80632a24f46c1461023b5780632f2ff15d1461024457806336568abe1461025757600080fd5b806301ffc9a7146101935780630556e9b9146101bb5780630fd21c17146101d0578063181f4456146101e35780631cbb2ce3146101f6578063248a9ca314610209575b600080fd5b6101a66101a1366004610de2565b6103a6565b60405190151581526020015b60405180910390f35b6101ce6101c9366004610d9f565b6103dd565b005b6101ce6101de366004610cf5565b6103ef565b6101ce6101f1366004610d9f565b61041e565b6101ce610204366004610d9f565b610430565b61022d610217366004610d9f565b6000908152600160208190526040909120015490565b6040519081526020016101b2565b61022d60055481565b6101ce610252366004610db7565b610442565b6101ce610265366004610db7565b61046e565b61022d7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d81565b6101ce6104f1565b61022d60075481565b61022d60045481565b61022d6102b9366004610d0f565b610527565b60005460ff166101a6565b6002546102dc906001600160a01b031681565b6040516001600160a01b0390911681526020016101b2565b6101ce610302366004610d9f565b61053a565b6101ce610315366004610cf5565b61054c565b6101ce61057b565b61022d7ff7db13299c8a9e501861f04c20f69a2444829a36a363cfad4b58864709c7556081565b6101a6610357366004610db7565b6105ae565b61022d600081565b61022d60065481565b61022d61037b366004610d0f565b6105d9565b6101ce61038e366004610db7565b61082b565b6003546102dc906001600160a01b031681565b60006001600160e01b03198216637965db0b60e01b14806103d757506301ffc9a760e01b6001600160e01b03198316145b92915050565b60006103e98133610852565b50600655565b60006103fb8133610852565b50600280546001600160a01b0319166001600160a01b0392909216919091179055565b600061042a8133610852565b50600455565b600061043c8133610852565b50600755565b6000828152600160208190526040909120015461045f8133610852565b61046983836108b6565b505050565b6001600160a01b03811633146104e35760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084015b60405180910390fd5b6104ed8282610921565b5050565b7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d61051c8133610852565b610524610988565b50565b6000610531610a1b565b95945050505050565b60006105468133610852565b50600555565b60006105588133610852565b50600380546001600160a01b0319166001600160a01b0392909216919091179055565b7f139c2898040ef16910dc9f44dc697df79363da767d8bc92f2e310312b816e46d6105a68133610852565b610524610a75565b60009182526001602090815260408084206001600160a01b0393909316845291905290205460ff1690565b60007ff7db13299c8a9e501861f04c20f69a2444829a36a363cfad4b58864709c755606106068133610852565b60005460ff161561064c5760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016104da565b600454421161069d5760405162461bcd60e51b815260206004820152601b60248201527f61756374696f6e20686173206e6f74207374617274656420796574000000000060448201526064016104da565b60055442106106e55760405162461bcd60e51b815260206004820152601460248201527367656e656973697320697320636f6d706c65746560601b60448201526064016104da565b6000806106f485870187610e22565b60035460405163461d9a2160e01b81529294509092506000916001600160a01b039091169063461d9a219061072f9086908690600401610fa2565b602060405180830381600087803b15801561074957600080fd5b505af115801561075d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107819190610e0a565b600254604051632851206560e21b81526001600160a01b038c811660048301526024820184905292935091169063a144819490604401600060405180830381600087803b1580156107d157600080fd5b505af11580156107e5573d6000803e3d6000fd5b50506040516001600160a01b038c1692508391507f97c7a37a01ea09716c8cd03bacec8d6db1e30927bfa2ff373e434b074f81775f90600090a398975050505050505050565b600082815260016020819052604090912001546108488133610852565b6104698383610921565b61085c82826105ae565b6104ed57610874816001600160a01b03166014610af0565b61087f836020610af0565b604051602001610890929190610efa565b60408051601f198184030181529082905262461bcd60e51b82526104da91600401610f6f565b6108c082826105ae565b6104ed5760008281526001602081815260408084206001600160a01b0386168086529252808420805460ff19169093179092559051339285917f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d9190a45050565b61092b82826105ae565b156104ed5760008281526001602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b60005460ff166109d15760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b60448201526064016104da565b6000805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b60008060045442610a2c9190611050565b90506000600454600554610a409190611050565b905060008183600654610a539190611031565b610a5d9190611011565b905080600654610a6d9190611050565b935050505090565b60005460ff1615610abb5760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016104da565b6000805460ff191660011790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a2586109fe3390565b60606000610aff836002611031565b610b0a906002610ff9565b67ffffffffffffffff811115610b3057634e487b7160e01b600052604160045260246000fd5b6040519080825280601f01601f191660200182016040528015610b5a576020820181803683370190505b509050600360fc1b81600081518110610b8357634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350600f60fb1b81600181518110610bc057634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a9053506000610be4846002611031565b610bef906001610ff9565b90505b6001811115610c83576f181899199a1a9b1b9c1cb0b131b232b360811b85600f1660108110610c3157634e487b7160e01b600052603260045260246000fd5b1a60f81b828281518110610c5557634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060049490941c93610c7c81611097565b9050610bf2565b508315610cd25760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e7460448201526064016104da565b9392505050565b80356001600160a01b0381168114610cf057600080fd5b919050565b600060208284031215610d06578081fd5b610cd282610cd9565b60008060008060608587031215610d24578283fd5b610d2d85610cd9565b9350602085013580600b0b8114610d42578384fd5b9250604085013567ffffffffffffffff80821115610d5e578384fd5b818701915087601f830112610d71578384fd5b813581811115610d7f578485fd5b886020828501011115610d90578485fd5b95989497505060200194505050565b600060208284031215610db0578081fd5b5035919050565b60008060408385031215610dc9578182fd5b82359150610dd960208401610cd9565b90509250929050565b600060208284031215610df3578081fd5b81356001600160e01b031981168114610cd2578182fd5b600060208284031215610e1b578081fd5b5051919050565b60008060408385031215610e34578182fd5b823567ffffffffffffffff8082168214610e4c578384fd5b9092506020908482013581811115610e62578384fd5b8501601f81018713610e72578384fd5b803582811115610e8457610e846110c4565b8060051b604051601f19603f83011681018181108682111715610ea957610ea96110c4565b604052828152858101945083860182850187018b1015610ec7578788fd5b8794505b83851015610ee9578035865294860194600194909401938601610ecb565b508096505050505050509250929050565b7f416363657373436f6e74726f6c3a206163636f756e7420000000000000000000815260008351610f32816017850160208801611067565b7001034b99036b4b9b9b4b733903937b6329607d1b6017918401918201528351610f63816028840160208801611067565b01602801949350505050565b6020815260008251806020840152610f8e816040850160208701611067565b601f01601f19169190910160400192915050565b60006040820167ffffffffffffffff8516835260206040818501528185518084526060860191508287019350845b81811015610fec57845183529383019391830191600101610fd0565b5090979650505050505050565b6000821982111561100c5761100c6110ae565b500190565b60008261102c57634e487b7160e01b81526012600452602481fd5b500490565b600081600019048311821515161561104b5761104b6110ae565b500290565b600082821015611062576110626110ae565b500390565b60005b8381101561108257818101518382015260200161106a565b83811115611091576000848401525b50505050565b6000816110a6576110a66110ae565b506000190190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fdfea2646970667358221220e056daf8ab2442a7ac3756c3cdd52aa27a1b98b38c6ba0efb0f1b5dcb08c0b2064736f6c63430008040033";

type FairLaunchClaimerConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: FairLaunchClaimerConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class FairLaunchClaimer__factory extends ContractFactory {
  constructor(...args: FairLaunchClaimerConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "FairLaunchClaimer";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<FairLaunchClaimer> {
    return super.deploy(overrides || {}) as Promise<FairLaunchClaimer>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): FairLaunchClaimer {
    return super.attach(address) as FairLaunchClaimer;
  }
  connect(signer: Signer): FairLaunchClaimer__factory {
    return super.connect(signer) as FairLaunchClaimer__factory;
  }
  static readonly contractName: "FairLaunchClaimer";
  public readonly contractName: "FairLaunchClaimer";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): FairLaunchClaimerInterface {
    return new utils.Interface(_abi) as FairLaunchClaimerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FairLaunchClaimer {
    return new Contract(address, _abi, signerOrProvider) as FairLaunchClaimer;
  }
}
