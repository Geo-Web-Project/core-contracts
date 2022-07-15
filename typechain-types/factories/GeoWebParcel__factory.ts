/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GeoWebParcel, GeoWebParcelInterface } from "../GeoWebParcel";

const _abi = [
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506101bc806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063e7feff2e14610030575b600080fd5b61004361003e366004610117565b61005a565b60405161005192919061012f565b60405180910390f35b60008181527f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f96020908152604080832080546001820180548451818702810187019095528085526060957f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f89567ffffffffffffffff9094169391839183018282801561010557602002820191906000526020600020905b8154815260200190600101908083116100f1575b50505050509050935093505050915091565b600060208284031215610128578081fd5b5035919050565b60006040820167ffffffffffffffff8516835260206040818501528185518084526060860191508287019350845b818110156101795784518352938301939183019160010161015d565b509097965050505050505056fea264697066735822122014d200855f1e7e7a1df7f7a7825c629f447ae941ce8f8a57c1a579c1bb2023d564736f6c63430008040033";

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
