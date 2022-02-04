import { Signer, ContractFactory, Overrides, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MockCollector, MockCollectorInterface } from "../MockCollector";
declare type MockCollectorConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class MockCollector__factory extends ContractFactory {
    constructor(...args: MockCollectorConstructorParams);
    deploy(_defaultExpiration: BigNumberish, _minPayment: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<MockCollector>;
    getDeployTransaction(_defaultExpiration: BigNumberish, _minPayment: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): MockCollector;
    connect(signer: Signer): MockCollector__factory;
    static readonly contractName: "MockCollector";
    readonly contractName: "MockCollector";
    static readonly bytecode = "0x608060405234801561001057600080fd5b5060405161020b38038061020b83398101604081905261002f9161003d565b600191909155600255610060565b6000806040838503121561004f578182fd5b505080516020909101519092909150565b61019c8061006f6000396000f3fe6080604052600436106100295760003560e01c8063c6f253ab1461002e578063e2ba182514610043575b600080fd5b61004161003c366004610121565b610082565b005b34801561004f57600080fd5b5061007061005e366004610109565b60006020819052908152604090205481565b60405190815260200160405180910390f35b6002543410156100e65760405162461bcd60e51b815260206004820152602560248201527f56616c7565206d7573742062652067726561746572207468616e206d696e50616044820152641e5b595b9d60da1b606482015260840160405180910390fd5b6001546100f39042610142565b6000928352602083905260409092209190915550565b60006020828403121561011a578081fd5b5035919050565b60008060408385031215610133578081fd5b50508035926020909101359150565b6000821982111561016157634e487b7160e01b81526011600452602481fd5b50019056fea26469706673582212200b995a08c181c98a4a9cee9febbdd1dea212fe9f27f8ffac401a59fb4601768c64736f6c63430008040033";
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
    static createInterface(): MockCollectorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): MockCollector;
}
export {};
