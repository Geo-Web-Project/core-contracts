/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC721Facet, ERC721FacetInterface } from "../ERC721Facet";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
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
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
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
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
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
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611390806100206000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80636352211e1161008c578063a22cb46511610066578063a22cb465146101e1578063b88d4fde146101f4578063c87b56dd14610207578063e985e9c51461021a57600080fd5b80636352211e146101a557806370a08231146101b857806395d89b41146101d957600080fd5b8063095ea7b3116100c8578063095ea7b31461015757806323b872dd1461016c57806342842e0e1461017f5780634cd88b761461019257600080fd5b806301ffc9a7146100ef57806306fdde0314610117578063081812fc1461012c575b600080fd5b6101026100fd366004610e78565b61022d565b60405190151581526020015b60405180910390f35b61011f61027f565b60405161010e9190610ee2565b61013f61013a366004610ef5565b610323565b6040516001600160a01b03909116815260200161010e565b61016a610165366004610f2a565b61032e565b005b61016a61017a366004610f54565b610448565b61016a61018d366004610f54565b610479565b61016a6101a0366004610fd9565b610494565b61013f6101b3366004610ef5565b6104cd565b6101cb6101c6366004611045565b6104d8565b60405190815260200161010e565b61011f61057d565b61016a6101ef366004611060565b6105bc565b61016a6102023660046110b2565b6105cb565b61011f610215366004610ef5565b610603565b61010261022836600461118e565b610622565b60006001600160e01b031982166380ac58cd60e01b148061025e57506001600160e01b03198216635b5e139f60e01b145b8061027957506301ffc9a760e01b6001600160e01b03198316145b92915050565b60008051602061133b833981519152805460609190819061029f906111c1565b80601f01602080910402602001604051908101604052809291908181526020018280546102cb906111c1565b80156103185780601f106102ed57610100808354040283529160200191610318565b820191906000526020600020905b8154815290600101906020018083116102fb57829003601f168201915b505050505091505090565b600061027982610635565b60006103398261066c565b9050806001600160a01b0316836001600160a01b0316036103ab5760405162461bcd60e51b815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e656044820152603960f91b60648201526084015b60405180910390fd5b336001600160a01b03821614806103c757506103c78133610622565b6104395760405162461bcd60e51b815260206004820152603e60248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f7420746f60448201527f6b656e206f776e6572206e6f7220617070726f76656420666f7220616c6c000060648201526084016103a2565b61044383836106fb565b505050565b6104523382610799565b61046e5760405162461bcd60e51b81526004016103a2906111fb565b610443838383610840565b610443838383604051806020016040528060008152506105cb565b61049c610a3d565b60008051602061133b8339815191526104b6818686610dc9565b506104c5600182018484610dc9565b505050505050565b60006102798261066c565b60006001600160a01b0382166105425760405162461bcd60e51b815260206004820152602960248201527f4552433732313a2061646472657373207a65726f206973206e6f7420612076616044820152683634b21037bbb732b960b91b60648201526084016103a2565b506001600160a01b031660009081527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25b602052604090205490565b7f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce259805460609160008051602061133b8339815191529161029f906111c1565b6105c7338383610ac6565b5050565b6105d53383610799565b6105f15760405162461bcd60e51b81526004016103a2906111fb565b6105fd84848484610bc6565b50505050565b606061060e82610bf9565b505060408051602081019091526000815290565b600061062e8383610c7a565b9392505050565b600060008051602061133b83398151915261064f83610bf9565b60009283526004016020525060409020546001600160a01b031690565b60008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25a602052604081205460008051602061133b833981519152906001600160a01b03168061062e5760405162461bcd60e51b8152602060048201526018602482015277115490cdcc8c4e881a5b9d985b1a59081d1bdad95b88125160421b60448201526064016103a2565b60008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25c6020526040902080546001600160a01b0319166001600160a01b03841690811790915560008051602061133b83398151915290829061075f8261066c565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a4505050565b60007f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc1816107c68461066c565b9050806001600160a01b0316856001600160a01b03161480610803575060008481526005830160205260409020546001600160a01b038681169116145b8061081357506108138186610c7a565b806108375750846001600160a01b031661082c85610635565b6001600160a01b0316145b95945050505050565b826001600160a01b03166108538261066c565b6001600160a01b0316146108b75760405162461bcd60e51b815260206004820152602560248201527f4552433732313a207472616e736665722066726f6d20696e636f72726563742060448201526437bbb732b960d91b60648201526084016103a2565b6001600160a01b0382166109195760405162461bcd60e51b8152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f206164646044820152637265737360e01b60648201526084016103a2565b60008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25c6020908152604080832080546001600160a01b03191690556001600160a01b03861683527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25b9091528120805460008051602061133b83398151915292600192916109aa90849061125f565b90915550506001600160a01b038316600090815260038201602052604081208054600192906109da908490611276565b9091555050600082815260028201602052604080822080546001600160a01b0319166001600160a01b0387811691821790925591518593918816917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a46105fd565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c600401546001600160a01b03163314610ac45760405162461bcd60e51b815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201526132b960f11b60648201526084016103a2565b565b816001600160a01b0316836001600160a01b031603610b275760405162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c65720000000000000060448201526064016103a2565b6001600160a01b0383811660008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25d6020908152604080832094871680845294825291829020805460ff19168615159081179091558251908152915160008051602061133b8339815191529493927f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3192908290030190a350505050565b610bd1848484610840565b610bdd84848484610cc7565b6105fd5760405162461bcd60e51b81526004016103a29061128e565b60008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25a60205260409020546001600160a01b0316610c775760405162461bcd60e51b8152602060048201526018602482015277115490cdcc8c4e881a5b9d985b1a59081d1bdad95b88125160421b60448201526064016103a2565b50565b6001600160a01b0391821660009081527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25d6020908152604080832093909416825291909152205460ff1690565b60006001600160a01b0384163b15610dbd57604051630a85bd0160e11b81526001600160a01b0385169063150b7a0290610d0b9033908990889088906004016112e0565b6020604051808303816000875af1925050508015610d46575060408051601f3d908101601f19168201909252610d439181019061131d565b60015b610da3573d808015610d74576040519150601f19603f3d011682016040523d82523d6000602084013e610d79565b606091505b508051600003610d9b5760405162461bcd60e51b81526004016103a29061128e565b805181602001fd5b6001600160e01b031916630a85bd0160e11b149050610dc1565b5060015b949350505050565b828054610dd5906111c1565b90600052602060002090601f016020900481019282610df75760008555610e3d565b82601f10610e105782800160ff19823516178555610e3d565b82800160010185558215610e3d579182015b82811115610e3d578235825591602001919060010190610e22565b50610e49929150610e4d565b5090565b5b80821115610e495760008155600101610e4e565b6001600160e01b031981168114610c7757600080fd5b600060208284031215610e8a57600080fd5b813561062e81610e62565b6000815180845260005b81811015610ebb57602081850181015186830182015201610e9f565b81811115610ecd576000602083870101525b50601f01601f19169290920160200192915050565b60208152600061062e6020830184610e95565b600060208284031215610f0757600080fd5b5035919050565b80356001600160a01b0381168114610f2557600080fd5b919050565b60008060408385031215610f3d57600080fd5b610f4683610f0e565b946020939093013593505050565b600080600060608486031215610f6957600080fd5b610f7284610f0e565b9250610f8060208501610f0e565b9150604084013590509250925092565b60008083601f840112610fa257600080fd5b50813567ffffffffffffffff811115610fba57600080fd5b602083019150836020828501011115610fd257600080fd5b9250929050565b60008060008060408587031215610fef57600080fd5b843567ffffffffffffffff8082111561100757600080fd5b61101388838901610f90565b9096509450602087013591508082111561102c57600080fd5b5061103987828801610f90565b95989497509550505050565b60006020828403121561105757600080fd5b61062e82610f0e565b6000806040838503121561107357600080fd5b61107c83610f0e565b91506020830135801515811461109157600080fd5b809150509250929050565b634e487b7160e01b600052604160045260246000fd5b600080600080608085870312156110c857600080fd5b6110d185610f0e565b93506110df60208601610f0e565b925060408501359150606085013567ffffffffffffffff8082111561110357600080fd5b818701915087601f83011261111757600080fd5b8135818111156111295761112961109c565b604051601f8201601f19908116603f011681019083821181831017156111515761115161109c565b816040528281528a602084870101111561116a57600080fd5b82602086016020830137600060208483010152809550505050505092959194509250565b600080604083850312156111a157600080fd5b6111aa83610f0e565b91506111b860208401610f0e565b90509250929050565b600181811c908216806111d557607f821691505b6020821081036111f557634e487b7160e01b600052602260045260246000fd5b50919050565b6020808252602e908201527f4552433732313a2063616c6c6572206973206e6f7420746f6b656e206f776e6560408201526d1c881b9bdc88185c1c1c9bdd995960921b606082015260800190565b634e487b7160e01b600052601160045260246000fd5b60008282101561127157611271611249565b500390565b6000821982111561128957611289611249565b500190565b60208082526032908201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560408201527131b2b4bb32b91034b6b83632b6b2b73a32b960711b606082015260800190565b6001600160a01b038581168252841660208201526040810183905260806060820181905260009061131390830184610e95565b9695505050505050565b60006020828403121561132f57600080fd5b815161062e81610e6256fe0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce258a264697066735822122095f06234ea138a0a7543e13bab12ab8c5c08cd5e6405f541436948be943c05a864736f6c634300080e0033";

type ERC721FacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC721FacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC721Facet__factory extends ContractFactory {
  constructor(...args: ERC721FacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "ERC721Facet";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC721Facet> {
    return super.deploy(overrides || {}) as Promise<ERC721Facet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ERC721Facet {
    return super.attach(address) as ERC721Facet;
  }
  connect(signer: Signer): ERC721Facet__factory {
    return super.connect(signer) as ERC721Facet__factory;
  }
  static readonly contractName: "ERC721Facet";
  public readonly contractName: "ERC721Facet";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721FacetInterface {
    return new utils.Interface(_abi) as ERC721FacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC721Facet {
    return new Contract(address, _abi, signerOrProvider) as ERC721Facet;
  }
}