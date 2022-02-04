import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface GeoWebCoordinatePathInterface extends utils.Interface {
    contractName: "GeoWebCoordinatePath";
    functions: {
        "nextDirection(uint256)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "nextDirection", values: [BigNumberish]): string;
    decodeFunctionResult(functionFragment: "nextDirection", data: BytesLike): Result;
    events: {};
}
export interface GeoWebCoordinatePath extends BaseContract {
    contractName: "GeoWebCoordinatePath";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: GeoWebCoordinatePathInterface;
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
        nextDirection(path: BigNumberish, overrides?: CallOverrides): Promise<[
            boolean,
            BigNumber,
            BigNumber
        ] & {
            hasNext: boolean;
            direction: BigNumber;
            nextPath: BigNumber;
        }>;
    };
    nextDirection(path: BigNumberish, overrides?: CallOverrides): Promise<[
        boolean,
        BigNumber,
        BigNumber
    ] & {
        hasNext: boolean;
        direction: BigNumber;
        nextPath: BigNumber;
    }>;
    callStatic: {
        nextDirection(path: BigNumberish, overrides?: CallOverrides): Promise<[
            boolean,
            BigNumber,
            BigNumber
        ] & {
            hasNext: boolean;
            direction: BigNumber;
            nextPath: BigNumber;
        }>;
    };
    filters: {};
    estimateGas: {
        nextDirection(path: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        nextDirection(path: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
