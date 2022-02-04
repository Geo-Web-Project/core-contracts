import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MockParcel, MockParcelInterface } from "../MockParcel";
declare type MockParcelConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class MockParcel__factory extends ContractFactory {
    constructor(...args: MockParcelConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<MockParcel>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): MockParcel;
    connect(signer: Signer): MockParcel__factory;
    static readonly contractName: "MockParcel";
    readonly contractName: "MockParcel";
    static readonly bytecode = "0x60806040526000805534801561001457600080fd5b50610164806100246000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063461d9a211461003b57806361b8ce8c14610060575b600080fd5b61004e610049366004610081565b610069565b60405190815260200160405180910390f35b61004e60005481565b60005461007781600161010a565b6000559392505050565b600080600060408486031215610095578283fd5b833567ffffffffffffffff80821682146100ad578485fd5b909350602085013590808211156100c2578384fd5b818601915086601f8301126100d5578384fd5b8135818111156100e3578485fd5b8760208260051b85010111156100f7578485fd5b6020830194508093505050509250925092565b6000821982111561012957634e487b7160e01b81526011600452602481fd5b50019056fea26469706673582212206ae34b00bced51a76e02afa91b6d42bd8685f0928571cc35fa43d2ff44b478ff64736f6c63430008040033";
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): MockParcelInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): MockParcel;
}
export {};
