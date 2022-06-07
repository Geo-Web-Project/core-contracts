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

export interface FairLaunchClaimerInterface extends utils.Interface {
  contractName: "FairLaunchClaimer";
  functions: {
    "CLAIM_ROLE()": FunctionFragment;
    "DEFAULT_ADMIN_ROLE()": FunctionFragment;
    "PAUSE_ROLE()": FunctionFragment;
    "auctionEnd()": FunctionFragment;
    "auctionStart()": FunctionFragment;
    "claim(address,int96,bytes)": FunctionFragment;
    "claimPrice(address,int96,bytes)": FunctionFragment;
    "endingBid()": FunctionFragment;
    "getRoleAdmin(bytes32)": FunctionFragment;
    "grantRole(bytes32,address)": FunctionFragment;
    "hasRole(bytes32,address)": FunctionFragment;
    "initialize()": FunctionFragment;
    "license()": FunctionFragment;
    "parcel()": FunctionFragment;
    "pause()": FunctionFragment;
    "paused()": FunctionFragment;
    "renounceRole(bytes32,address)": FunctionFragment;
    "revokeRole(bytes32,address)": FunctionFragment;
    "setAuctionEnd(uint256)": FunctionFragment;
    "setAuctionStart(uint256)": FunctionFragment;
    "setEndingBid(uint256)": FunctionFragment;
    "setLicense(address)": FunctionFragment;
    "setParcel(address)": FunctionFragment;
    "setStartingBid(uint256)": FunctionFragment;
    "startingBid()": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "unpause()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "CLAIM_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PAUSE_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "auctionEnd",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "auctionStart",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "claim",
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "claimPrice",
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "endingBid", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getRoleAdmin",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "grantRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "hasRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "license", values?: undefined): string;
  encodeFunctionData(functionFragment: "parcel", values?: undefined): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeRole",
    values: [BytesLike, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setAuctionEnd",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setAuctionStart",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setEndingBid",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "setLicense", values: [string]): string;
  encodeFunctionData(functionFragment: "setParcel", values: [string]): string;
  encodeFunctionData(
    functionFragment: "setStartingBid",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "startingBid",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;

  decodeFunctionResult(functionFragment: "CLAIM_ROLE", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "DEFAULT_ADMIN_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "PAUSE_ROLE", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "auctionEnd", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "auctionStart",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "claim", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "claimPrice", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "endingBid", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRoleAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "license", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "parcel", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceRole",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setAuctionEnd",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setAuctionStart",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setEndingBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setLicense", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setParcel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setStartingBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "startingBid",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;

  events: {
    "Initialized(uint8)": EventFragment;
    "ParcelClaimed(uint256,address)": EventFragment;
    "Paused(address)": EventFragment;
    "RoleAdminChanged(bytes32,bytes32,bytes32)": EventFragment;
    "RoleGranted(bytes32,address,address)": EventFragment;
    "RoleRevoked(bytes32,address,address)": EventFragment;
    "Unpaused(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ParcelClaimed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Paused"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Unpaused"): EventFragment;
}

export type InitializedEvent = TypedEvent<[number], { version: number }>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export type ParcelClaimedEvent = TypedEvent<
  [BigNumber, string],
  { parcelId: BigNumber; to: string }
>;

export type ParcelClaimedEventFilter = TypedEventFilter<ParcelClaimedEvent>;

export type PausedEvent = TypedEvent<[string], { account: string }>;

export type PausedEventFilter = TypedEventFilter<PausedEvent>;

export type RoleAdminChangedEvent = TypedEvent<
  [string, string, string],
  { role: string; previousAdminRole: string; newAdminRole: string }
>;

export type RoleAdminChangedEventFilter =
  TypedEventFilter<RoleAdminChangedEvent>;

export type RoleGrantedEvent = TypedEvent<
  [string, string, string],
  { role: string; account: string; sender: string }
>;

export type RoleGrantedEventFilter = TypedEventFilter<RoleGrantedEvent>;

export type RoleRevokedEvent = TypedEvent<
  [string, string, string],
  { role: string; account: string; sender: string }
>;

export type RoleRevokedEventFilter = TypedEventFilter<RoleRevokedEvent>;

export type UnpausedEvent = TypedEvent<[string], { account: string }>;

export type UnpausedEventFilter = TypedEventFilter<UnpausedEvent>;

export interface FairLaunchClaimer extends BaseContract {
  contractName: "FairLaunchClaimer";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: FairLaunchClaimerInterface;

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
    CLAIM_ROLE(overrides?: CallOverrides): Promise<[string]>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<[string]>;

    PAUSE_ROLE(overrides?: CallOverrides): Promise<[string]>;

    auctionEnd(overrides?: CallOverrides): Promise<[BigNumber]>;

    auctionStart(overrides?: CallOverrides): Promise<[BigNumber]>;

    claim(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    claimPrice(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    endingBid(overrides?: CallOverrides): Promise<[BigNumber]>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<[string]>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    license(overrides?: CallOverrides): Promise<[string]>;

    parcel(overrides?: CallOverrides): Promise<[string]>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    paused(overrides?: CallOverrides): Promise<[boolean]>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setAuctionEnd(
      _auctionEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setAuctionStart(
      _auctionStart: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setEndingBid(
      _endingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setLicense(
      _licenseAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setParcel(
      _parcelAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setStartingBid(
      _startingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    startingBid(overrides?: CallOverrides): Promise<[BigNumber]>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  CLAIM_ROLE(overrides?: CallOverrides): Promise<string>;

  DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

  PAUSE_ROLE(overrides?: CallOverrides): Promise<string>;

  auctionEnd(overrides?: CallOverrides): Promise<BigNumber>;

  auctionStart(overrides?: CallOverrides): Promise<BigNumber>;

  claim(
    user: string,
    initialContributionRate: BigNumberish,
    claimData: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  claimPrice(
    user: string,
    initialContributionRate: BigNumberish,
    claimData: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  endingBid(overrides?: CallOverrides): Promise<BigNumber>;

  getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

  grantRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  hasRole(
    role: BytesLike,
    account: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  initialize(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  license(overrides?: CallOverrides): Promise<string>;

  parcel(overrides?: CallOverrides): Promise<string>;

  pause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  paused(overrides?: CallOverrides): Promise<boolean>;

  renounceRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  revokeRole(
    role: BytesLike,
    account: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setAuctionEnd(
    _auctionEnd: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setAuctionStart(
    _auctionStart: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setEndingBid(
    _endingBid: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setLicense(
    _licenseAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setParcel(
    _parcelAddress: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setStartingBid(
    _startingBid: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  startingBid(overrides?: CallOverrides): Promise<BigNumber>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  unpause(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    CLAIM_ROLE(overrides?: CallOverrides): Promise<string>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;

    PAUSE_ROLE(overrides?: CallOverrides): Promise<string>;

    auctionEnd(overrides?: CallOverrides): Promise<BigNumber>;

    auctionStart(overrides?: CallOverrides): Promise<BigNumber>;

    claim(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    claimPrice(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    endingBid(overrides?: CallOverrides): Promise<BigNumber>;

    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    initialize(overrides?: CallOverrides): Promise<void>;

    license(overrides?: CallOverrides): Promise<string>;

    parcel(overrides?: CallOverrides): Promise<string>;

    pause(overrides?: CallOverrides): Promise<void>;

    paused(overrides?: CallOverrides): Promise<boolean>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setAuctionEnd(
      _auctionEnd: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setAuctionStart(
      _auctionStart: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setEndingBid(
      _endingBid: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    setLicense(
      _licenseAddress: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setParcel(_parcelAddress: string, overrides?: CallOverrides): Promise<void>;

    setStartingBid(
      _startingBid: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    startingBid(overrides?: CallOverrides): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    unpause(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "Initialized(uint8)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;

    "ParcelClaimed(uint256,address)"(
      parcelId?: BigNumberish | null,
      to?: string | null
    ): ParcelClaimedEventFilter;
    ParcelClaimed(
      parcelId?: BigNumberish | null,
      to?: string | null
    ): ParcelClaimedEventFilter;

    "Paused(address)"(account?: null): PausedEventFilter;
    Paused(account?: null): PausedEventFilter;

    "RoleAdminChanged(bytes32,bytes32,bytes32)"(
      role?: BytesLike | null,
      previousAdminRole?: BytesLike | null,
      newAdminRole?: BytesLike | null
    ): RoleAdminChangedEventFilter;
    RoleAdminChanged(
      role?: BytesLike | null,
      previousAdminRole?: BytesLike | null,
      newAdminRole?: BytesLike | null
    ): RoleAdminChangedEventFilter;

    "RoleGranted(bytes32,address,address)"(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): RoleGrantedEventFilter;
    RoleGranted(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): RoleGrantedEventFilter;

    "RoleRevoked(bytes32,address,address)"(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): RoleRevokedEventFilter;
    RoleRevoked(
      role?: BytesLike | null,
      account?: string | null,
      sender?: string | null
    ): RoleRevokedEventFilter;

    "Unpaused(address)"(account?: null): UnpausedEventFilter;
    Unpaused(account?: null): UnpausedEventFilter;
  };

  estimateGas: {
    CLAIM_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PAUSE_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    auctionEnd(overrides?: CallOverrides): Promise<BigNumber>;

    auctionStart(overrides?: CallOverrides): Promise<BigNumber>;

    claim(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    claimPrice(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    endingBid(overrides?: CallOverrides): Promise<BigNumber>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    license(overrides?: CallOverrides): Promise<BigNumber>;

    parcel(overrides?: CallOverrides): Promise<BigNumber>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    paused(overrides?: CallOverrides): Promise<BigNumber>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setAuctionEnd(
      _auctionEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setAuctionStart(
      _auctionStart: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setEndingBid(
      _endingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setLicense(
      _licenseAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setParcel(
      _parcelAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setStartingBid(
      _startingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    startingBid(overrides?: CallOverrides): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    CLAIM_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    DEFAULT_ADMIN_ROLE(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    PAUSE_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    auctionEnd(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    auctionStart(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    claim(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    claimPrice(
      user: string,
      initialContributionRate: BigNumberish,
      claimData: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    endingBid(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getRoleAdmin(
      role: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    grantRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    hasRole(
      role: BytesLike,
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    license(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    parcel(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    paused(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    revokeRole(
      role: BytesLike,
      account: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setAuctionEnd(
      _auctionEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setAuctionStart(
      _auctionStart: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setEndingBid(
      _endingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setLicense(
      _licenseAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setParcel(
      _parcelAddress: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setStartingBid(
      _startingBid: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    startingBid(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    unpause(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
