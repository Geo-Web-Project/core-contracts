import { BaseContract, BigNumber, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface PullPaymentInterface extends utils.Interface {
    contractName: "PullPayment";
    functions: {
        "payments(address)": FunctionFragment;
        "withdrawPayments(address)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "payments", values: [string]): string;
    encodeFunctionData(functionFragment: "withdrawPayments", values: [string]): string;
    decodeFunctionResult(functionFragment: "payments", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "withdrawPayments", data: BytesLike): Result;
    events: {};
}
export interface PullPayment extends BaseContract {
    contractName: "PullPayment";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: PullPaymentInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        payments(dest: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        withdrawPayments(payee: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
    };
    payments(dest: string, overrides?: CallOverrides): Promise<BigNumber>;
    withdrawPayments(payee: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        payments(dest: string, overrides?: CallOverrides): Promise<BigNumber>;
        withdrawPayments(payee: string, overrides?: CallOverrides): Promise<void>;
    };
    filters: {};
    estimateGas: {
        payments(dest: string, overrides?: CallOverrides): Promise<BigNumber>;
        withdrawPayments(payee: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        payments(dest: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        withdrawPayments(payee: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
    };
}
