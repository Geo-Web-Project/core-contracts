import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface ILicenseValidatorInterface extends utils.Interface {
    contractName: "ILicenseValidator";
    functions: {
        "invalidStartDate(uint256)": FunctionFragment;
        "isValid(uint256)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "invalidStartDate", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "isValid", values: [BigNumberish]): string;
    decodeFunctionResult(functionFragment: "invalidStartDate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValid", data: BytesLike): Result;
    events: {};
}
export interface ILicenseValidator extends BaseContract {
    contractName: "ILicenseValidator";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ILicenseValidatorInterface;
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
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;
    };
    invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
    callStatic: {
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
    };
    filters: {};
    estimateGas: {
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
