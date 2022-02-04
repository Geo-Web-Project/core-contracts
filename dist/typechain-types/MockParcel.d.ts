import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface MockParcelInterface extends utils.Interface {
    contractName: "MockParcel";
    functions: {
        "build(uint64,uint256[])": FunctionFragment;
        "nextId()": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "build", values: [BigNumberish, BigNumberish[]]): string;
    encodeFunctionData(functionFragment: "nextId", values?: undefined): string;
    decodeFunctionResult(functionFragment: "build", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nextId", data: BytesLike): Result;
    events: {};
}
export interface MockParcel extends BaseContract {
    contractName: "MockParcel";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MockParcelInterface;
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
        build(arg0: BigNumberish, arg1: BigNumberish[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        nextId(overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    build(arg0: BigNumberish, arg1: BigNumberish[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    nextId(overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        build(arg0: BigNumberish, arg1: BigNumberish[], overrides?: CallOverrides): Promise<BigNumber>;
        nextId(overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {};
    estimateGas: {
        build(arg0: BigNumberish, arg1: BigNumberish[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        nextId(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        build(arg0: BigNumberish, arg1: BigNumberish[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        nextId(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
