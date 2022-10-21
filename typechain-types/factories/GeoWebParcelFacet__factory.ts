/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  GeoWebParcelFacet,
  GeoWebParcelFacetInterface,
} from "../GeoWebParcelFacet";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
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
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getLandParcelV1",
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
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getLandParcelV2",
    outputs: [
      {
        internalType: "uint64",
        name: "swCoordinate",
        type: "uint64",
      },
      {
        internalType: "uint256",
        name: "latDim",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lngDim",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610491806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806331a5ee9c146100465780637d31e460146100765780639a7f0f2c146100a8575b600080fd5b610060600480360381019061005b919061027c565b6100d9565b60405161006d91906102cb565b60405180910390f35b610090600480360381019061008b91906102e6565b610116565b60405161009f93929190610336565b60405180910390f35b6100c260048036038101906100bd91906102e6565b610171565b6040516100d092919061042b565b60405180910390f35b6000806100e4610214565b905080600001600085815260200190815260200160002060008481526020019081526020016000205491505092915050565b600080600080610124610214565b9050600081600301600087815260200190815260200160002090508060000160009054906101000a900467ffffffffffffffff168160020154826001015494509450945050509193909250565b60006060600061017f610214565b9050600081600101600086815260200190815260200160002090508060000160009054906101000a900467ffffffffffffffff16816001018080548060200260200160405190810160405280929190818152602001828054801561020257602002820191906000526020600020905b8154815260200190600101908083116101ee575b50505050509050935093505050915091565b6000807f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f890508091505090565b600080fd5b6000819050919050565b61025981610246565b811461026457600080fd5b50565b60008135905061027681610250565b92915050565b6000806040838503121561029357610292610241565b5b60006102a185828601610267565b92505060206102b285828601610267565b9150509250929050565b6102c581610246565b82525050565b60006020820190506102e060008301846102bc565b92915050565b6000602082840312156102fc576102fb610241565b5b600061030a84828501610267565b91505092915050565b600067ffffffffffffffff82169050919050565b61033081610313565b82525050565b600060608201905061034b6000830186610327565b61035860208301856102bc565b61036560408301846102bc565b949350505050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6103a281610246565b82525050565b60006103b48383610399565b60208301905092915050565b6000602082019050919050565b60006103d88261036d565b6103e28185610378565b93506103ed83610389565b8060005b8381101561041e57815161040588826103a8565b9750610410836103c0565b9250506001810190506103f1565b5085935050505092915050565b60006040820190506104406000830185610327565b818103602083015261045281846103cd565b9050939250505056fea2646970667358221220406e0a40b19d3156c1470d347a8459c5f95443a8f14bf4edadd78cfc6f9bb7aa64736f6c63430008100033";

type GeoWebParcelFacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: GeoWebParcelFacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class GeoWebParcelFacet__factory extends ContractFactory {
  constructor(...args: GeoWebParcelFacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "GeoWebParcelFacet";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<GeoWebParcelFacet> {
    return super.deploy(overrides || {}) as Promise<GeoWebParcelFacet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): GeoWebParcelFacet {
    return super.attach(address) as GeoWebParcelFacet;
  }
  connect(signer: Signer): GeoWebParcelFacet__factory {
    return super.connect(signer) as GeoWebParcelFacet__factory;
  }
  static readonly contractName: "GeoWebParcelFacet";
  public readonly contractName: "GeoWebParcelFacet";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): GeoWebParcelFacetInterface {
    return new utils.Interface(_abi) as GeoWebParcelFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GeoWebParcelFacet {
    return new Contract(address, _abi, signerOrProvider) as GeoWebParcelFacet;
  }
}
