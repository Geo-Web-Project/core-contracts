import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface GeoWebCoordinateInterface extends utils.Interface {
    contractName: "GeoWebCoordinate";
    functions: {
        "toWordIndex(uint64)": FunctionFragment;
        "traverse(uint64,uint256,uint256,uint256,uint256)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "toWordIndex", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "traverse", values: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
    ]): string;
    decodeFunctionResult(functionFragment: "toWordIndex", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "traverse", data: BytesLike): Result;
    events: {};
}
export interface GeoWebCoordinate extends BaseContract {
    contractName: "GeoWebCoordinate";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: GeoWebCoordinateInterface;
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
        toWordIndex(coord: BigNumberish, overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber,
            BigNumber
        ] & {
            i_x: BigNumber;
            i_y: BigNumber;
            i: BigNumber;
        }>;
        traverse(origin: BigNumberish, direction: BigNumberish, _i_x: BigNumberish, _i_y: BigNumberish, _i: BigNumberish, overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber
        ] & {
            destination: BigNumber;
            i_x: BigNumber;
            i_y: BigNumber;
            i: BigNumber;
        }>;
    };
    toWordIndex(coord: BigNumberish, overrides?: CallOverrides): Promise<[
        BigNumber,
        BigNumber,
        BigNumber
    ] & {
        i_x: BigNumber;
        i_y: BigNumber;
        i: BigNumber;
    }>;
    traverse(origin: BigNumberish, direction: BigNumberish, _i_x: BigNumberish, _i_y: BigNumberish, _i: BigNumberish, overrides?: CallOverrides): Promise<[
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber
    ] & {
        destination: BigNumber;
        i_x: BigNumber;
        i_y: BigNumber;
        i: BigNumber;
    }>;
    callStatic: {
        toWordIndex(coord: BigNumberish, overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber,
            BigNumber
        ] & {
            i_x: BigNumber;
            i_y: BigNumber;
            i: BigNumber;
        }>;
        traverse(origin: BigNumberish, direction: BigNumberish, _i_x: BigNumberish, _i_y: BigNumberish, _i: BigNumberish, overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber,
            BigNumber,
            BigNumber
        ] & {
            destination: BigNumber;
            i_x: BigNumber;
            i_y: BigNumber;
            i: BigNumber;
        }>;
    };
    filters: {};
    estimateGas: {
        toWordIndex(coord: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        traverse(origin: BigNumberish, direction: BigNumberish, _i_x: BigNumberish, _i_y: BigNumberish, _i: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        toWordIndex(coord: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        traverse(origin: BigNumberish, direction: BigNumberish, _i_x: BigNumberish, _i_y: BigNumberish, _i: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
