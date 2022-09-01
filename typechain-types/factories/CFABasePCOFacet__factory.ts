/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CFABasePCOFacet,
  CFABasePCOFacetInterface,
} from "../CFABasePCOFacet";

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
        indexed: false,
        internalType: "int96",
        name: "contributionRate",
        type: "int96",
      },
    ],
    name: "PayerContributionRateUpdated",
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
        indexed: false,
        internalType: "uint256",
        name: "forSalePrice",
        type: "uint256",
      },
    ],
    name: "PayerForSalePriceUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "contributionRate",
    outputs: [
      {
        internalType: "int96",
        name: "",
        type: "int96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentBid",
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
        internalType: "struct LibCFABasePCO.Bid",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "forSalePrice",
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
        internalType: "contract IPCOLicenseParamsStore",
        name: "paramsStore",
        type: "address",
      },
      {
        internalType: "contract IERC721",
        name: "_license",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_licenseId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "bidder",
        type: "address",
      },
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
    name: "initializeBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isPayerBidActive",
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
        internalType: "contract IERC721",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "licenseId",
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
    name: "payer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5061114d806100206000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80638d107ff51161005b5780638d107ff5146100ed5780639190f8d31461011e578063cdd42e9514610126578063def181011461013b57600080fd5b8063123119cd1461008d5780632c55dbed146100b25780636b87d24c146100ca5780636df38b84146100d2575b600080fd5b610095610196565b6040516001600160a01b0390911681526020015b60405180910390f35b6100ba6101ce565b60405190151581526020016100a9565b6100956101dd565b6100da610206565b604051600b9190910b81526020016100a9565b7f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532cb545b6040519081526020016100a9565b610110610210565b610139610134366004610e23565b61024b565b005b6101436107f4565b6040516100a99190815181526020808301516001600160a01b031690820152604080830151600b0b90820152606080830151908201526080808301519082015260a0918201519181019190915260c00190565b6000807f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f415b600101546001600160a01b031692915050565b60006101d8610922565b905090565b6000807f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532c96101bb565b60006101d8610936565b600061021a610922565b1561024557507f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f455490565b50600090565b610253610b07565b7f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532c980546001600160a01b03199081166001600160a01b0389811691821784557f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532ca8054909316908916179091557f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532cb86905560408051630b51881360e11b81529051600092916316a310269160048083019260209291908290030181865afa158015610321573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103459190610e93565b905060008260000160009054906101000a90046001600160a01b03166001600160a01b031663014df4146040518163ffffffff1660e01b8152600401602060405180830381865afa15801561039e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103c29190610e93565b90506103d084868484610b90565b6104335760405162461bcd60e51b815260206004820152602960248201527f4346414261736550434f46616365743a20496e636f727265637420666f722073604482015268616c6520707269636560b81b60648201526084015b60405180910390fd5b8254604080516320bc442560e01b815290517feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da6926000926001600160a01b03909116916320bc4425916004808201926020929091908290030181865afa1580156104a1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104c59190610eac565b6040805180820182526001600160a01b0383168082529151635b69006f60e11b81527fa9214cc96615e0085d3bb077758db69497dc2dce3b2b1e97bc93c3d18d83efd360048201529293509160208301919063b6d200de90602401602060405180830381865afa15801561053d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105619190610eac565b6001600160a01b03908116909152815184549082166001600160a01b03199182161785556020928301516001860180549184169190921617905586546040805163d41c3a6560e01b81529051600094929093169263d41c3a65926004808401939192918290030181865afa1580156105dd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106019190610eac565b905060008660000160009054906101000a90046001600160a01b03166001600160a01b031663565a2e2c6040518163ffffffff1660e01b8152600401602060405180830381865afa15801561065a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061067e9190610eac565b905061068d848b30858d610bc3565b5061069a8482848c610bf2565b427f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f419081556bffffffffffffffffffffffff8a16600160a01b026001600160a01b038c169081177f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f42557f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f438890557f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f448790557f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f458a9055604080518b815290517fae3c4f18410e9cfcd20fc8664a5a0082a92f07a0a5febdc22bec0c53939373369181900360200190a2604051600b8b900b81526001600160a01b038c16907f6602f4d39e226f3807ddac3e7aab03883832e2ea2d07ccdeaf513c16679fdcd09060200160405180910390a25050505050505050505050505050565b6108396040518060c001604052806000815260200160006001600160a01b031681526020016000600b0b81526020016000815260200160008152602001600081525090565b506040805160c0810182527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f415481527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f42546001600160a01b0381166020830152600160a01b9004600b0b918101919091527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f435460608201527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f445460808201527f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f455460a082015290565b60008061092d610936565b600b0b13905090565b7feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da7547f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532c980546040805163d41c3a6560e01b815290516000947feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da69386936001600160a01b039283169363e6a1e888939092169163d41c3a65916004808201926020929091908290030181865afa1580156109f3573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a179190610eac565b8554604080516315968b8b60e21b8152905130926001600160a01b03169163565a2e2c9160048083019260209291908290030181865afa158015610a5f573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a839190610eac565b60405160e085901b6001600160e01b03191681526001600160a01b03938416600482015291831660248301529091166044820152606401608060405180830381865afa158015610ad7573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610afb9190610ed0565b50909695505050505050565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c600401546001600160a01b03163314610b8e5760405162461bcd60e51b815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201526132b960f11b606482015260840161042a565b565b60008082610b9e8588610f0e565b610ba89190610f3b565b6bffffffffffffffffffffffff861614915050949350505050565b604080516000815260208101909152606090610be89087908790879087908790610c18565b9695505050505050565b604080516000815260208101909152610c12908590859085908590610d1d565b50505050565b855460018701546060916001600160a01b03908116916339255d5b9116806394229ecb888b8b8a60006040519080825280601f01601f191660200182016040528015610c6b576020820181803683370190505b50604051602401610c80959493929190610fcb565b60408051808303601f1901815291815260208201805160e094851b6001600160e01b03909116179052519185901b6001600160e01b0319168252610ccb939250908790600401611009565b6000604051808303816000875af1158015610cea573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610d12919081019061103f565b979650505050505050565b845460018601546040805160008152602081019091526001600160a01b03928316926339255d5b92169081906362fc305e90610d629089908b908a90604481016110e1565b60408051808303601f1901815291815260208201805160e094851b6001600160e01b03909116179052519185901b6001600160e01b0319168252610dad939250908690600401611009565b6000604051808303816000875af1158015610dcc573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610df4919081019061103f565b505050505050565b6001600160a01b0381168114610e1157600080fd5b50565b80600b0b8114610e1157600080fd5b60008060008060008060c08789031215610e3c57600080fd5b8635610e4781610dfc565b95506020870135610e5781610dfc565b9450604087013593506060870135610e6e81610dfc565b92506080870135610e7e81610e14565b8092505060a087013590509295509295509295565b600060208284031215610ea557600080fd5b5051919050565b600060208284031215610ebe57600080fd5b8151610ec981610dfc565b9392505050565b60008060008060808587031215610ee657600080fd5b845193506020850151610ef881610e14565b6040860151606090960151949790965092505050565b6000816000190483118215151615610f3657634e487b7160e01b600052601160045260246000fd5b500290565b600082610f5857634e487b7160e01b600052601260045260246000fd5b500490565b634e487b7160e01b600052604160045260246000fd5b60005b83811015610f8e578181015183820152602001610f76565b83811115610c125750506000910152565b60008151808452610fb7816020860160208601610f73565b601f01601f19169290920160200192915050565b6001600160a01b038681168252858116602083015284166040820152600b83900b606082015260a060808201819052600090610d1290830184610f9f565b6001600160a01b038416815260606020820181905260009061102d90830185610f9f565b8281036040840152610be88185610f9f565b60006020828403121561105157600080fd5b815167ffffffffffffffff8082111561106957600080fd5b818401915084601f83011261107d57600080fd5b81518181111561108f5761108f610f5d565b604051601f8201601f19908116603f011681019083821181831017156110b7576110b7610f5d565b816040528281528760208487010111156110d057600080fd5b610d12836020830160208801610f73565b6001600160a01b03858116825284166020820152600b83900b6040820152608060608201819052600090610be890830184610f9f56fea2646970667358221220326e82fee44b30ca86fb9faa1305329a860517c9f433f62eda4f2f26818d593164736f6c634300080e0033";

type CFABasePCOFacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CFABasePCOFacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CFABasePCOFacet__factory extends ContractFactory {
  constructor(...args: CFABasePCOFacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "CFABasePCOFacet";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CFABasePCOFacet> {
    return super.deploy(overrides || {}) as Promise<CFABasePCOFacet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): CFABasePCOFacet {
    return super.attach(address) as CFABasePCOFacet;
  }
  connect(signer: Signer): CFABasePCOFacet__factory {
    return super.connect(signer) as CFABasePCOFacet__factory;
  }
  static readonly contractName: "CFABasePCOFacet";
  public readonly contractName: "CFABasePCOFacet";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CFABasePCOFacetInterface {
    return new utils.Interface(_abi) as CFABasePCOFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CFABasePCOFacet {
    return new Contract(address, _abi, signerOrProvider) as CFABasePCOFacet;
  }
}
