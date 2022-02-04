import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface MockCollectorInterface extends utils.Interface {
    contractName: "MockCollector";
    functions: {
        "licenseExpirationTimestamps(uint256)": FunctionFragment;
        "setContributionRate(uint256,uint256)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "licenseExpirationTimestamps", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "setContributionRate", values: [BigNumberish, BigNumberish]): string;
    decodeFunctionResult(functionFragment: "licenseExpirationTimestamps", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setContributionRate", data: BytesLike): Result;
    events: {};
}
export interface MockCollector extends BaseContract {
    contractName: "MockCollector";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MockCollectorInterface;
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
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        setContributionRate(id: BigNumberish, arg1: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
    };
    licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    setContributionRate(id: BigNumberish, arg1: BigNumberish, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        setContributionRate(id: BigNumberish, arg1: BigNumberish, overrides?: CallOverrides): Promise<void>;
    };
    filters: {};
    estimateGas: {
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        setContributionRate(id: BigNumberish, arg1: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        setContributionRate(id: BigNumberish, arg1: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
    };
}
