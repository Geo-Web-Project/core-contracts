/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export declare namespace LibGeoWebParcel {
  export type LandParcelV2Struct = {
    swCoordinate: BigNumberish;
    lngDim: BigNumberish;
    latDim: BigNumberish;
  };

  export type LandParcelV2StructOutput = [BigNumber, BigNumber, BigNumber] & {
    swCoordinate: BigNumber;
    lngDim: BigNumber;
    latDim: BigNumber;
  };
}

export interface PCOLicenseClaimerFacetInterface extends utils.Interface {
  contractName: "PCOLicenseClaimerFacet";
  functions: {
    "claim(int96,uint256,(uint64,uint256,uint256))": FunctionFragment;
    "getAuctionEnd()": FunctionFragment;
    "getAuctionStart()": FunctionFragment;
    "getBeacon()": FunctionFragment;
    "getBeaconProxy(uint256)": FunctionFragment;
    "getEndingBid()": FunctionFragment;
    "getNextProxyAddress(address)": FunctionFragment;
    "getStartingBid()": FunctionFragment;
    "initializeClaimer(uint256,uint256,uint256,uint256,address)": FunctionFragment;
    "requiredBid()": FunctionFragment;
    "setAuctionEnd(uint256)": FunctionFragment;
    "setAuctionStart(uint256)": FunctionFragment;
    "setBeacon(address)": FunctionFragment;
    "setEndingBid(uint256)": FunctionFragment;
    "setStartingBid(uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "claim",
    values: [BigNumberish, BigNumberish, LibGeoWebParcel.LandParcelV2Struct]
  ): string;
  encodeFunctionData(
    functionFragment: "getAuctionEnd",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getAuctionStart",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "getBeacon", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getBeaconProxy",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getEndingBid",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getNextProxyAddress",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getStartingBid",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initializeClaimer",
    values: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "requiredBid",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setAuctionEnd",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setAuctionStart",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "setBeacon", values: [string]): string;
  encodeFunctionData(
    functionFragment: "setEndingBid",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setStartingBid",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "claim", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getAuctionEnd",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAuctionStart",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getBeacon", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getBeaconProxy",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getEndingBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getNextProxyAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getStartingBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "initializeClaimer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "requiredBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAuctionEnd",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAuctionStart",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setBeacon", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setEndingBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setStartingBid",
    data: BytesLike
  ): Result;

  events: {
    "Approval(address,address,uint256)": EventFragment;
    "ApprovalForAll(address,address,bool)": EventFragment;
    "ParcelClaimed(uint256,address)": EventFragment;
    "Transfer(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ApprovalForAll"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ParcelClaimed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}

export type ApprovalEvent = TypedEvent<
  [string, string, BigNumber],
  { owner: string; operator: string; tokenId: BigNumber }
>;

export type ApprovalEventFilter = TypedEventFilter<ApprovalEvent>;

export type ApprovalForAllEvent = TypedEvent<
  [string, string, boolean],
  { owner: string; operator: string; approved: boolean }
>;

export type ApprovalForAllEventFilter = TypedEventFilter<ApprovalForAllEvent>;

export type ParcelClaimedEvent = TypedEvent<
  [BigNumber, string],
  { _licenseId: BigNumber; _payer: string }
>;

export type ParcelClaimedEventFilter = TypedEventFilter<ParcelClaimedEvent>;

export type TransferEvent = TypedEvent<
  [string, string, BigNumber],
  { from: string; to: string; tokenId: BigNumber }
>;

export type TransferEventFilter = TypedEventFilter<TransferEvent>;

export interface PCOLicenseClaimerFacet extends BaseContract {
  contractName: "PCOLicenseClaimerFacet";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: PCOLicenseClaimerFacetInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    claim(
      initialContributionRate: BigNumberish,
      initialForSalePrice: BigNumberish,
      parcel: LibGeoWebParcel.LandParcelV2Struct,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getAuctionEnd(overrides?: CallOverrides): Promise<[BigNumber]>;

    getAuctionStart(overrides?: CallOverrides): Promise<[BigNumber]>;

    getBeacon(overrides?: CallOverrides): Promise<[string]>;

    getBeaconProxy(
      licenseId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getEndingBid(overrides?: CallOverrides): Promise<[BigNumber]>;

    getNextProxyAddress(
      user: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getStartingBid(overrides?: CallOverrides): Promise<[BigNumber]>;

    initializeClaimer(
      auctionStart: BigNumberish,
      auctionEnd: BigNumberish,
      startingBid: BigNumberish,
      endingBid: BigNumberish,
      beacon: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    requiredBid(overrides?: CallOverrides): Promise<[BigNumber]>;

    setAuctionEnd(
      auctionEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setAuctionStart(
      auctionStart: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setBeacon(
      beacon: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setEndingBid(
      endingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setStartingBid(
      startingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  claim(
    initialContributionRate: BigNumberish,
    initialForSalePrice: BigNumberish,
    parcel: LibGeoWebParcel.LandParcelV2Struct,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getAuctionEnd(overrides?: CallOverrides): Promise<BigNumber>;

  getAuctionStart(overrides?: CallOverrides): Promise<BigNumber>;

  getBeacon(overrides?: CallOverrides): Promise<string>;

  getBeaconProxy(
    licenseId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  getEndingBid(overrides?: CallOverrides): Promise<BigNumber>;

  getNextProxyAddress(user: string, overrides?: CallOverrides): Promise<string>;

  getStartingBid(overrides?: CallOverrides): Promise<BigNumber>;

  initializeClaimer(
    auctionStart: BigNumberish,
    auctionEnd: BigNumberish,
    startingBid: BigNumberish,
    endingBid: BigNumberish,
    beacon: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  requiredBid(overrides?: CallOverrides): Promise<BigNumber>;

  setAuctionEnd(
    auctionEnd: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setAuctionStart(
    auctionStart: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setBeacon(
    beacon: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setEndingBid(
    endingBid: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setStartingBid(
    startingBid: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    claim(
      initialContributionRate: BigNumberish,
      initialForSalePrice: BigNumberish,
      parcel: LibGeoWebParcel.LandParcelV2Struct,
      overrides?: CallOverrides
    ): Promise<void>;

    getAuctionEnd(overrides?: CallOverrides): Promise<BigNumber>;

    getAuctionStart(overrides?: CallOverrides): Promise<BigNumber>;

    getBeacon(overrides?: CallOverrides): Promise<string>;

    getBeaconProxy(
      licenseId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    getEndingBid(overrides?: CallOverrides): Promise<BigNumber>;

    getNextProxyAddress(
      user: string,
      overrides?: CallOverrides
    ): Promise<string>;

    getStartingBid(overrides?: CallOverrides): Promise<BigNumber>;

    initializeClaimer(
      auctionStart: BigNumberish,
      auctionEnd: BigNumberish,
      startingBid: BigNumberish,
      endingBid: BigNumberish,
      beacon: string,
      overrides?: CallOverrides
    ): Promise<void>;

    requiredBid(overrides?: CallOverrides): Promise<BigNumber>;

    setAuctionEnd(
      auctionEnd: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setAuctionStart(
      auctionStart: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setBeacon(beacon: string, overrides?: CallOverrides): Promise<void>;

    setEndingBid(
      endingBid: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setStartingBid(
      startingBid: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Approval(address,address,uint256)"(
      owner?: string | null,
      operator?: string | null,
      tokenId?: BigNumberish | null
    ): ApprovalEventFilter;
    Approval(
      owner?: string | null,
      operator?: string | null,
      tokenId?: BigNumberish | null
    ): ApprovalEventFilter;

    "ApprovalForAll(address,address,bool)"(
      owner?: string | null,
      operator?: string | null,
      approved?: null
    ): ApprovalForAllEventFilter;
    ApprovalForAll(
      owner?: string | null,
      operator?: string | null,
      approved?: null
    ): ApprovalForAllEventFilter;

    "ParcelClaimed(uint256,address)"(
      _licenseId?: BigNumberish | null,
      _payer?: string | null
    ): ParcelClaimedEventFilter;
    ParcelClaimed(
      _licenseId?: BigNumberish | null,
      _payer?: string | null
    ): ParcelClaimedEventFilter;

    "Transfer(address,address,uint256)"(
      from?: string | null,
      to?: string | null,
      tokenId?: BigNumberish | null
    ): TransferEventFilter;
    Transfer(
      from?: string | null,
      to?: string | null,
      tokenId?: BigNumberish | null
    ): TransferEventFilter;
  };

  estimateGas: {
    claim(
      initialContributionRate: BigNumberish,
      initialForSalePrice: BigNumberish,
      parcel: LibGeoWebParcel.LandParcelV2Struct,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getAuctionEnd(overrides?: CallOverrides): Promise<BigNumber>;

    getAuctionStart(overrides?: CallOverrides): Promise<BigNumber>;

    getBeacon(overrides?: CallOverrides): Promise<BigNumber>;

    getBeaconProxy(
      licenseId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getEndingBid(overrides?: CallOverrides): Promise<BigNumber>;

    getNextProxyAddress(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getStartingBid(overrides?: CallOverrides): Promise<BigNumber>;

    initializeClaimer(
      auctionStart: BigNumberish,
      auctionEnd: BigNumberish,
      startingBid: BigNumberish,
      endingBid: BigNumberish,
      beacon: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    requiredBid(overrides?: CallOverrides): Promise<BigNumber>;

    setAuctionEnd(
      auctionEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setAuctionStart(
      auctionStart: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setBeacon(
      beacon: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setEndingBid(
      endingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setStartingBid(
      startingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    claim(
      initialContributionRate: BigNumberish,
      initialForSalePrice: BigNumberish,
      parcel: LibGeoWebParcel.LandParcelV2Struct,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getAuctionEnd(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getAuctionStart(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getBeacon(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getBeaconProxy(
      licenseId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getEndingBid(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getNextProxyAddress(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getStartingBid(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initializeClaimer(
      auctionStart: BigNumberish,
      auctionEnd: BigNumberish,
      startingBid: BigNumberish,
      endingBid: BigNumberish,
      beacon: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    requiredBid(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setAuctionEnd(
      auctionEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setAuctionStart(
      auctionStart: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setBeacon(
      beacon: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setEndingBid(
      endingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setStartingBid(
      startingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
