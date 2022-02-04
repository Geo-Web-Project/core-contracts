import { Signer, ContractFactory, Overrides, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MockLicenseValidator, MockLicenseValidatorInterface } from "../MockLicenseValidator";
declare type MockLicenseValidatorConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class MockLicenseValidator__factory extends ContractFactory {
    constructor(...args: MockLicenseValidatorConstructorParams);
    deploy(_truthyValue: BigNumberish, _defaultStartDate: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<MockLicenseValidator>;
    getDeployTransaction(_truthyValue: BigNumberish, _defaultStartDate: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): MockLicenseValidator;
    connect(signer: Signer): MockLicenseValidator__factory;
    static readonly contractName: "MockLicenseValidator";
    readonly contractName: "MockLicenseValidator";
    static readonly bytecode = "0x608060405234801561001057600080fd5b5060405161014a38038061014a83398101604081905261002f9161003d565b600091909155600155610060565b6000806040838503121561004f578182fd5b505080516020909101519092909150565b60dc8061006e6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c8063a3f8d382146041578063e8159ad814605c578063f577a50014606e575b600080fd5b604960005481565b6040519081526020015b60405180910390f35b60496067366004608f565b5060015490565b60806079366004608f565b6000541490565b60405190151581526020016053565b600060208284031215609f578081fd5b503591905056fea2646970667358221220632ddc79d0585c6a5e3fac3e676d153af30f34c4c82eb868820562ca2dd9f0a364736f6c63430008040033";
    static readonly abi: ({
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        name?: undefined;
        outputs?: undefined;
    } | {
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
    })[];
    static createInterface(): MockLicenseValidatorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): MockLicenseValidator;
}
export {};
