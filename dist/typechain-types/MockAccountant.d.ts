import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface MockAccountantInterface extends utils.Interface {
    contractName: "MockAccountant";
    functions: {
        "contributionRates(uint256)": FunctionFragment;
        "perSecondFeeDenominator()": FunctionFragment;
        "perSecondFeeNumerator()": FunctionFragment;
        "setContributionRate(uint256,uint256)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "contributionRates", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "perSecondFeeDenominator", values?: undefined): string;
    encodeFunctionData(functionFragment: "perSecondFeeNumerator", values?: undefined): string;
    encodeFunctionData(functionFragment: "setContributionRate", values: [BigNumberish, BigNumberish]): string;
    decodeFunctionResult(functionFragment: "contributionRates", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "perSecondFeeDenominator", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "perSecondFeeNumerator", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setContributionRate", data: BytesLike): Result;
    events: {};
}
export interface MockAccountant extends BaseContract {
    contractName: "MockAccountant";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MockAccountantInterface;
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
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<[BigNumber]>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<[BigNumber]>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
    };
    contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    perSecondFeeDenominator(overrides?: CallOverrides): Promise<BigNumber>;
    perSecondFeeNumerator(overrides?: CallOverrides): Promise<BigNumber>;
    setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<BigNumber>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: CallOverrides): Promise<void>;
    };
    filters: {};
    estimateGas: {
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<BigNumber>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
    };
}
