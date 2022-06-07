/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GeoWebParcel, GeoWebParcelInterface } from "../GeoWebParcel";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "version",
        type: "uint8",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "ParcelBuilt",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "ParcelDestroyed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_id",
        type: "uint256",
      },
    ],
    name: "ParcelModified",
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
    inputs: [],
    name: "BUILD_ROLE",
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
    name: "DESTROY_ROLE",
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
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "availabilityIndex",
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
        internalType: "uint64",
        name: "baseCoordinate",
        type: "uint64",
      },
      {
        internalType: "uint256[]",
        name: "path",
        type: "uint256[]",
      },
    ],
    name: "build",
    outputs: [
      {
        internalType: "uint256",
        name: "newParcelId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "destroy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getLandParcel",
    outputs: [
      {
        internalType: "uint64",
        name: "baseCoordinate",
        type: "uint64",
      },
      {
        internalType: "uint256[]",
        name: "path",
        type: "uint256[]",
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
    name: "initialize",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5061180b806100206000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80638129fc1c1161008c5780639d118770116100665780639d11877014610217578063a217fddf1461022a578063d547741f14610232578063e7feff2e1461024557600080fd5b80638129fc1c146101d5578063904316a9146101dd57806391d148541461020457600080fd5b80632f2ff15d116100c85780632f2ff15d1461016f57806331a5ee9c1461018457806336568abe146101af578063461d9a21146101c257600080fd5b806301ffc9a7146100ef5780630e32f7c514610117578063248a9ca31461014c575b600080fd5b6101026100fd366004611345565b610266565b60405190151581526020015b60405180910390f35b61013e7fd2147ab93974135a2df3767e731a4b154b72c1ec6c3fd51c2af97844245c797a81565b60405190815260200161010e565b61013e61015a3660046112f3565b60009081526065602052604090206001015490565b61018261017d36600461130b565b61029d565b005b61013e61019236600461136d565b609760209081526000928352604080842090915290825290205481565b6101826101bd36600461130b565b6102c7565b61013e6101d036600461138e565b61034a565b6101826104d9565b61013e7fa3c57f8c4cc23cc5478854a5475b23169fc1f2a3a08c0c03be20573f72d3d90b81565b61010261021236600461130b565b61055e565b6101826102253660046112f3565b610589565b61013e600081565b61018261024036600461130b565b610689565b6102586102533660046112f3565b6106ae565b60405161010e92919061150c565b60006001600160e01b03198216637965db0b60e01b148061029757506301ffc9a760e01b6001600160e01b03198316145b92915050565b6000828152606560205260409020600101546102b88161072d565b6102c28383610737565b505050565b6001600160a01b038116331461033c5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084015b60405180910390fd5b61034682826107bd565b5050565b60007fd2147ab93974135a2df3767e731a4b154b72c1ec6c3fd51c2af97844245c797a6103768161072d565b826103d15760405162461bcd60e51b815260206004820152602560248201527f50617468206d7573742068617665206174206c65617374206f6e6520636f6d706044820152641bdb995b9d60da1b6064820152608401610333565b61041060028686868080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525061082492505050565b61044f60008686868080602002602001604051908101604052809392919081815260200183836020028082843760009201919091525061082492505050565b6099546000908152609860205260409020805467ffffffffffffffff19166001600160401b038716178155610488600182018686611279565b506099546040517f10b9af39155ed127f01ba5cd8b7893608d2619511eece37bbf623781af4d70de90600090a260998054935060019060006104ca8387611562565b90915550929695505050505050565b60006104e56001610aec565b905080156104fd576000805461ff0019166101001790555b610505610b79565b610510600033610be6565b6000609955801561055b576000805461ff0019169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b50565b60009182526065602090815260408084206001600160a01b0393909316845291905290205460ff1690565b7fa3c57f8c4cc23cc5478854a5475b23169fc1f2a3a08c0c03be20573f72d3d90b6105b38161072d565b600082815260986020908152604091829020805460018083018054865181870281018701909752808752939561062c9592946001600160401b0390941693909283018282801561062257602002820191906000526020600020905b81548152602001906001019080831161060e575b5050505050610824565b6000838152609860205260408120805467ffffffffffffffff191681559061065760018301826112c4565b505060405183907f0ce919d8d9bad1162736e2c006df81fccb0bd0394499393e78405a2a587e375d90600090a2505050565b6000828152606560205260409020600101546106a48161072d565b6102c283836107bd565b6000818152609860209081526040808320805460018201805484518187028101870190955280855260609593946001600160401b039093169391929183919083018282801561071c57602002820191906000526020600020905b815481526020019060010190808311610708575b505050505090509250925050915091565b61055b8133610bf0565b610741828261055e565b6103465760008281526065602090815260408083206001600160a01b03851684529091529020805460ff191660011790556107793390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b6107c7828261055e565b156103465760008281526065602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b600082905060008083828151811061084c57634e487b7160e01b600052603260045260246000fd5b60200260200101519050600080600061086d866001600160401b0316610c54565b600083815260976020908152604080832085845290915290205492955090935091505b60008a60028111156108b257634e487b7160e01b600052602160045260246000fd5b14156108c9576108c3826002611622565b17610988565b60018a60028111156108eb57634e487b7160e01b600052602160045260246000fd5b1415610906576000196108ff836002611622565b1816610988565b60028a600281111561092857634e487b7160e01b600052602160045260246000fd5b141561098857610939826002611622565b8116156109885760405162461bcd60e51b815260206004820152601b60248201527f436f6f7264696e617465206973206e6f7420617661696c61626c6500000000006044820152606401610333565b60008061099487610cde565b98509092509050816109f7576109ab600189611562565b9750895188106109bc575050610a9c565b8988815181106109dc57634e487b7160e01b600052603260045260246000fd5b602002602001015196506109ef87610cde565b985090925090505b600080610a106001600160401b038c16848a8a8a610d2f565b929d50919750925090508782141580610a295750868114155b15610a8f5760028e6002811115610a5057634e487b7160e01b600052602160045260246000fd5b14610a725760008881526097602090815260408083208a845290915290208590555b600082815260976020908152604080832084845290915290205494505b9096509450610890915050565b60028a6002811115610abe57634e487b7160e01b600052602160045260246000fd5b14610ae057600084815260976020908152604080832086845290915290208190555b50505050505050505050565b60008054610100900460ff1615610b33578160ff166001148015610b0f5750303b155b610b2b5760405162461bcd60e51b8152600401610333906114be565b506000919050565b60005460ff808416911610610b5a5760405162461bcd60e51b8152600401610333906114be565b506000805460ff191660ff92909216919091179055600190565b919050565b600054610100900460ff16610be45760405162461bcd60e51b815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201526a6e697469616c697a696e6760a81b6064820152608401610333565b565b6103468282610737565b610bfa828261055e565b61034657610c12816001600160a01b03166014610fd9565b610c1d836020610fd9565b604051602001610c2e929190611416565b60408051601f198184030181529082905262461bcd60e51b82526103339160040161148b565b600080600080610c63856111c1565b6001600160401b031690506000610c798661121f565b6001600160401b03169050610c8f6010836115a5565b9450610c9c6010826115a5565b93506000610cab60108461176f565b90506000610cba60108461176f565b905081610cc88260106116ca565b610cd29190611562565b96989597505050505050565b60f881901c80151590600090819083610cfe575060009150819050610d28565b6003851692506001600160f81b03851660f8610d1b6001846116e9565b901b600282901c17925050505b9193909250565b6000806000806000610d408a6111c1565b90506000610d4d8b61121f565b899550889450879350905089610e0857610d6860018261157a565b90506203ffff6001600160401b0382161115610dc65760405162461bcd60e51b815260206004820152601d60248201527f446972656374696f6e2077656e7420746f6f20666172206e6f727468210000006044820152606401610333565b610dd1601082611783565b6001600160401b0316610dfd57610de9600185611562565b9350610df660f0846116e9565b9250610fb9565b610df6601084611562565b8960011415610eb6576000816001600160401b031611610e6a5760405162461bcd60e51b815260206004820152601d60248201527f446972656374696f6e2077656e7420746f6f2066617220736f757468210000006044820152606401610333565b610e75600182611700565b9050610e82601082611783565b6001600160401b0316600f1415610eab57610e9e6001856116e9565b9350610df660f084611562565b610df66010846116e9565b8960021415610f2c576207ffff6001600160401b03831610610ee45760009450849150610df6600f846116e9565b610eef60018361157a565b9150610efc601083611783565b6001600160401b0316610f2157610f14600186611562565b9450610df6600f846116e9565b610df6600184611562565b8960031415610fb9576001600160401b038216610f6a576207ffff9150610f546010836115b9565b6001600160401b03169450610df6600f84611562565b610f75600183611700565b9150610f82601083611783565b6001600160401b0316600f1415610fab57610f9e6001866116e9565b9450610df6600f84611562565b610fb66001846116e9565b92505b6020826001600160401b0316901b81179550505095509550955095915050565b60606000610fe88360026116ca565b610ff3906002611562565b6001600160401b0381111561101857634e487b7160e01b600052604160045260246000fd5b6040519080825280601f01601f191660200182016040528015611042576020820181803683370190505b509050600360fc1b8160008151811061106b57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350600f60fb1b816001815181106110a857634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060006110cc8460026116ca565b6110d7906001611562565b90505b600181111561116b576f181899199a1a9b1b9c1cb0b131b232b360811b85600f166010811061111957634e487b7160e01b600052603260045260246000fd5b1a60f81b82828151811061113d57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060049490941c9361116481611758565b90506110da565b5083156111ba5760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610333565b9392505050565b63ffffffff602082901c166207ffff811115610b745760405162461bcd60e51b815260206004820152601d60248201527f5820636f6f7264696e617465206973206f7574206f6620626f756e64730000006044820152606401610333565b63ffffffff81166203ffff811115610b745760405162461bcd60e51b815260206004820152601d60248201527f5920636f6f7264696e617465206973206f7574206f6620626f756e64730000006044820152606401610333565b8280548282559060005260206000209081019282156112b4579160200282015b828111156112b4578235825591602001919060010190611299565b506112c09291506112de565b5090565b508054600082559060005260206000209081019061055b91905b5b808211156112c057600081556001016112df565b600060208284031215611304578081fd5b5035919050565b6000806040838503121561131d578081fd5b8235915060208301356001600160a01b038116811461133a578182fd5b809150509250929050565b600060208284031215611356578081fd5b81356001600160e01b0319811681146111ba578182fd5b6000806040838503121561137f578182fd5b50508035926020909101359150565b6000806000604084860312156113a2578081fd5b83356001600160401b0380821682146113b9578283fd5b909350602085013590808211156113ce578283fd5b818601915086601f8301126113e1578283fd5b8135818111156113ef578384fd5b8760208260051b8501011115611403578384fd5b6020830194508093505050509250925092565b7f416363657373436f6e74726f6c3a206163636f756e742000000000000000000081526000835161144e816017850160208801611728565b7001034b99036b4b9b9b4b733903937b6329607d1b601791840191820152835161147f816028840160208801611728565b01602801949350505050565b60208152600082518060208401526114aa816040850160208701611728565b601f01601f19169190910160400192915050565b6020808252602e908201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160408201526d191e481a5b9a5d1a585b1a5e995960921b606082015260800190565b6000604082016001600160401b038516835260206040818501528185518084526060860191508287019350845b8181101561155557845183529383019391830191600101611539565b5090979650505050505050565b60008219821115611575576115756117a9565b500190565b60006001600160401b0380831681851680830382111561159c5761159c6117a9565b01949350505050565b6000826115b4576115b46117bf565b500490565b60006001600160401b03808416806115d3576115d36117bf565b92169190910492915050565b600181815b8085111561161a578160001904821115611600576116006117a9565b8085161561160d57918102915b93841c93908002906115e4565b509250929050565b60006111ba838360008261163857506001610297565b8161164557506000610297565b816001811461165b576002811461166557611681565b6001915050610297565b60ff841115611676576116766117a9565b50506001821b610297565b5060208310610133831016604e8410600b84101617156116a4575081810a610297565b6116ae83836115df565b80600019048211156116c2576116c26117a9565b029392505050565b60008160001904831182151516156116e4576116e46117a9565b500290565b6000828210156116fb576116fb6117a9565b500390565b60006001600160401b0383811690831681811015611720576117206117a9565b039392505050565b60005b8381101561174357818101518382015260200161172b565b83811115611752576000848401525b50505050565b600081611767576117676117a9565b506000190190565b60008261177e5761177e6117bf565b500690565b60006001600160401b038084168061179d5761179d6117bf565b92169190910692915050565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052601260045260246000fdfea2646970667358221220c22bb37076ed1c3f21a6c08e3b64c026bfc92885f87994419b871d49a31a4af964736f6c63430008040033";

type GeoWebParcelConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: GeoWebParcelConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class GeoWebParcel__factory extends ContractFactory {
  constructor(...args: GeoWebParcelConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "GeoWebParcel";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<GeoWebParcel> {
    return super.deploy(overrides || {}) as Promise<GeoWebParcel>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): GeoWebParcel {
    return super.attach(address) as GeoWebParcel;
  }
  connect(signer: Signer): GeoWebParcel__factory {
    return super.connect(signer) as GeoWebParcel__factory;
  }
  static readonly contractName: "GeoWebParcel";
  public readonly contractName: "GeoWebParcel";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GeoWebParcelInterface {
    return new utils.Interface(_abi) as GeoWebParcelInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GeoWebParcel {
    return new Contract(address, _abi, signerOrProvider) as GeoWebParcel;
  }
}
