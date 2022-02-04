import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface MockLicenseValidatorInterface extends utils.Interface {
    contractName: "MockLicenseValidator";
    functions: {
        "invalidStartDate(uint256)": FunctionFragment;
        "isValid(uint256)": FunctionFragment;
        "truthyValue()": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "invalidStartDate", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "isValid", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "truthyValue", values?: undefined): string;
    decodeFunctionResult(functionFragment: "invalidStartDate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValid", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "truthyValue", data: BytesLike): Result;
    events: {};
}
export interface MockLicenseValidator extends BaseContract {
    contractName: "MockLicenseValidator";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: MockLicenseValidatorInterface;
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
        invalidStartDate(arg0: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;
        truthyValue(overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    invalidStartDate(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
    truthyValue(overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        invalidStartDate(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
        truthyValue(overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {};
    estimateGas: {
        invalidStartDate(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        truthyValue(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        invalidStartDate(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        truthyValue(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
