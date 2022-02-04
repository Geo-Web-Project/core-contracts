import { Signer, ContractFactory, Overrides, BigNumberish } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MockAccountant, MockAccountantInterface } from "../MockAccountant";
declare type MockAccountantConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class MockAccountant__factory extends ContractFactory {
    constructor(...args: MockAccountantConstructorParams);
    deploy(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<MockAccountant>;
    getDeployTransaction(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): MockAccountant;
    connect(signer: Signer): MockAccountant__factory;
    static readonly contractName: "MockAccountant";
    readonly contractName: "MockAccountant";
    static readonly bytecode = "0x608060405234801561001057600080fd5b5060405161018438038061018483398101604081905261002f9161003d565b600091909155600155610060565b6000806040838503121561004f578182fd5b505080516020909101519092909150565b6101158061006f6000396000f3fe6080604052348015600f57600080fd5b506004361060455760003560e01c806279c6e914604a5780634d0265b3146064578063935cc61d146081578063c6f253ab146089575b600080fd5b605260005481565b60405190815260200160405180910390f35b6052606f36600460a8565b60026020526000908152604090205481565b605260015481565b60a6609436600460bf565b60009182526002602052604090912055565b005b60006020828403121560b8578081fd5b5035919050565b6000806040838503121560d0578081fd5b5050803592602090910135915056fea26469706673582212203b2899e66596530078a35ad91b099351e86bd393ce066a25bc9af840719a29fe64736f6c63430008040033";
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
    static createInterface(): MockAccountantInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): MockAccountant;
}
export {};
