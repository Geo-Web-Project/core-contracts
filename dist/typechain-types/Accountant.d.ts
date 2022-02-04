import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface AccountantInterface extends utils.Interface {
    contractName: "Accountant";
    functions: {
        "DEFAULT_ADMIN_ROLE()": FunctionFragment;
        "MODIFY_CONTRIBUTION_ROLE()": FunctionFragment;
        "contributionRates(uint256)": FunctionFragment;
        "getRoleAdmin(bytes32)": FunctionFragment;
        "getRoleMember(bytes32,uint256)": FunctionFragment;
        "getRoleMemberCount(bytes32)": FunctionFragment;
        "grantRole(bytes32,address)": FunctionFragment;
        "hasRole(bytes32,address)": FunctionFragment;
        "invalidStartDate(uint256)": FunctionFragment;
        "isValid(uint256)": FunctionFragment;
        "perSecondFeeDenominator()": FunctionFragment;
        "perSecondFeeNumerator()": FunctionFragment;
        "renounceRole(bytes32,address)": FunctionFragment;
        "revokeRole(bytes32,address)": FunctionFragment;
        "setContributionRate(uint256,uint256)": FunctionFragment;
        "setPerSecondFee(uint256,uint256)": FunctionFragment;
        "setValidator(address)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "validator()": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "DEFAULT_ADMIN_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "MODIFY_CONTRIBUTION_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "contributionRates", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "getRoleAdmin", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "getRoleMember", values: [BytesLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: "getRoleMemberCount", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "grantRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "hasRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "invalidStartDate", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "isValid", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "perSecondFeeDenominator", values?: undefined): string;
    encodeFunctionData(functionFragment: "perSecondFeeNumerator", values?: undefined): string;
    encodeFunctionData(functionFragment: "renounceRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "revokeRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "setContributionRate", values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: "setPerSecondFee", values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: "setValidator", values: [string]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "validator", values?: undefined): string;
    decodeFunctionResult(functionFragment: "DEFAULT_ADMIN_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "MODIFY_CONTRIBUTION_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "contributionRates", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleAdmin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleMember", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleMemberCount", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "invalidStartDate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValid", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "perSecondFeeDenominator", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "perSecondFeeNumerator", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setContributionRate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setPerSecondFee", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setValidator", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "validator", data: BytesLike): Result;
    events: {
        "ContributionRateUpdated(uint256,uint256)": EventFragment;
        "RoleAdminChanged(bytes32,bytes32,bytes32)": EventFragment;
        "RoleGranted(bytes32,address,address)": EventFragment;
        "RoleRevoked(bytes32,address,address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "ContributionRateUpdated"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
}
export declare type ContributionRateUpdatedEvent = TypedEvent<[
    BigNumber,
    BigNumber
], {
    id: BigNumber;
    newRate: BigNumber;
}>;
export declare type ContributionRateUpdatedEventFilter = TypedEventFilter<ContributionRateUpdatedEvent>;
export declare type RoleAdminChangedEvent = TypedEvent<[
    string,
    string,
    string
], {
    role: string;
    previousAdminRole: string;
    newAdminRole: string;
}>;
export declare type RoleAdminChangedEventFilter = TypedEventFilter<RoleAdminChangedEvent>;
export declare type RoleGrantedEvent = TypedEvent<[
    string,
    string,
    string
], {
    role: string;
    account: string;
    sender: string;
}>;
export declare type RoleGrantedEventFilter = TypedEventFilter<RoleGrantedEvent>;
export declare type RoleRevokedEvent = TypedEvent<[
    string,
    string,
    string
], {
    role: string;
    account: string;
    sender: string;
}>;
export declare type RoleRevokedEventFilter = TypedEventFilter<RoleRevokedEvent>;
export interface Accountant extends BaseContract {
    contractName: "Accountant";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: AccountantInterface;
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
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<[string]>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<[string]>;
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<[string]>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<[string]>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<[BigNumber]>;
        grantRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<[boolean]>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<[BigNumber]>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<[BigNumber]>;
        renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setPerSecondFee(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setValidator(_validator: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;
        validator(overrides?: CallOverrides): Promise<[string]>;
    };
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;
    MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<string>;
    contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;
    getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<string>;
    getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
    grantRole(role: BytesLike, account: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<boolean>;
    invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
    perSecondFeeDenominator(overrides?: CallOverrides): Promise<BigNumber>;
    perSecondFeeNumerator(overrides?: CallOverrides): Promise<BigNumber>;
    renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setPerSecondFee(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setValidator(_validator: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<boolean>;
    validator(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<string>;
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<string>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        grantRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<void>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<boolean>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<BigNumber>;
        renounceRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<void>;
        revokeRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<void>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: CallOverrides): Promise<void>;
        setPerSecondFee(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: CallOverrides): Promise<void>;
        setValidator(_validator: string, overrides?: CallOverrides): Promise<void>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<boolean>;
        validator(overrides?: CallOverrides): Promise<string>;
    };
    filters: {
        "ContributionRateUpdated(uint256,uint256)"(id?: BigNumberish | null, newRate?: null): ContributionRateUpdatedEventFilter;
        ContributionRateUpdated(id?: BigNumberish | null, newRate?: null): ContributionRateUpdatedEventFilter;
        "RoleAdminChanged(bytes32,bytes32,bytes32)"(role?: BytesLike | null, previousAdminRole?: BytesLike | null, newAdminRole?: BytesLike | null): RoleAdminChangedEventFilter;
        RoleAdminChanged(role?: BytesLike | null, previousAdminRole?: BytesLike | null, newAdminRole?: BytesLike | null): RoleAdminChangedEventFilter;
        "RoleGranted(bytes32,address,address)"(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleGrantedEventFilter;
        RoleGranted(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleGrantedEventFilter;
        "RoleRevoked(bytes32,address,address)"(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleRevokedEventFilter;
        RoleRevoked(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleRevokedEventFilter;
    };
    estimateGas: {
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        grantRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<BigNumber>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<BigNumber>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<BigNumber>;
        renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setPerSecondFee(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setValidator(_validator: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        validator(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        contributionRates(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        grantRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        perSecondFeeDenominator(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        perSecondFeeNumerator(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setContributionRate(id: BigNumberish, newRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setPerSecondFee(_perSecondFeeNumerator: BigNumberish, _perSecondFeeDenominator: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setValidator(_validator: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        validator(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
