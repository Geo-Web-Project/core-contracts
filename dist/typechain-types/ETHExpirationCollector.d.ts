import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PayableOverrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface ETHExpirationCollectorInterface extends utils.Interface {
    contractName: "ETHExpirationCollector";
    functions: {
        "DEFAULT_ADMIN_ROLE()": FunctionFragment;
        "MODIFY_CONTRIBUTION_ROLE()": FunctionFragment;
        "MODIFY_FUNDS_ROLE()": FunctionFragment;
        "PAUSE_ROLE()": FunctionFragment;
        "accountant()": FunctionFragment;
        "getRoleAdmin(bytes32)": FunctionFragment;
        "getRoleMember(bytes32,uint256)": FunctionFragment;
        "getRoleMemberCount(bytes32)": FunctionFragment;
        "grantRole(bytes32,address)": FunctionFragment;
        "hasRole(bytes32,address)": FunctionFragment;
        "invalidStartDate(uint256)": FunctionFragment;
        "isValid(uint256)": FunctionFragment;
        "license()": FunctionFragment;
        "licenseExpirationTimestamps(uint256)": FunctionFragment;
        "makePayment(uint256)": FunctionFragment;
        "maxExpiration()": FunctionFragment;
        "migrateFunds(uint256,uint256,uint256)": FunctionFragment;
        "minContributionRate()": FunctionFragment;
        "minExpiration()": FunctionFragment;
        "moveFunds(uint256,uint256,uint256,uint256,uint256,uint256,uint256)": FunctionFragment;
        "pause()": FunctionFragment;
        "paused()": FunctionFragment;
        "payments(address)": FunctionFragment;
        "receiver()": FunctionFragment;
        "renounceRole(bytes32,address)": FunctionFragment;
        "revokeRole(bytes32,address)": FunctionFragment;
        "setAccountant(address)": FunctionFragment;
        "setContributionRate(uint256,uint256)": FunctionFragment;
        "setLicense(address)": FunctionFragment;
        "setMaxExpiration(uint256)": FunctionFragment;
        "setMinContributionRate(uint256)": FunctionFragment;
        "setMinExpiration(uint256)": FunctionFragment;
        "setReceiver(address)": FunctionFragment;
        "supportsInterface(bytes4)": FunctionFragment;
        "unpause()": FunctionFragment;
        "withdrawPayments(address)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "DEFAULT_ADMIN_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "MODIFY_CONTRIBUTION_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "MODIFY_FUNDS_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "PAUSE_ROLE", values?: undefined): string;
    encodeFunctionData(functionFragment: "accountant", values?: undefined): string;
    encodeFunctionData(functionFragment: "getRoleAdmin", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "getRoleMember", values: [BytesLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: "getRoleMemberCount", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "grantRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "hasRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "invalidStartDate", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "isValid", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "license", values?: undefined): string;
    encodeFunctionData(functionFragment: "licenseExpirationTimestamps", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "makePayment", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "maxExpiration", values?: undefined): string;
    encodeFunctionData(functionFragment: "migrateFunds", values: [BigNumberish, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: "minContributionRate", values?: undefined): string;
    encodeFunctionData(functionFragment: "minExpiration", values?: undefined): string;
    encodeFunctionData(functionFragment: "moveFunds", values: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
    ]): string;
    encodeFunctionData(functionFragment: "pause", values?: undefined): string;
    encodeFunctionData(functionFragment: "paused", values?: undefined): string;
    encodeFunctionData(functionFragment: "payments", values: [string]): string;
    encodeFunctionData(functionFragment: "receiver", values?: undefined): string;
    encodeFunctionData(functionFragment: "renounceRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "revokeRole", values: [BytesLike, string]): string;
    encodeFunctionData(functionFragment: "setAccountant", values: [string]): string;
    encodeFunctionData(functionFragment: "setContributionRate", values: [BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: "setLicense", values: [string]): string;
    encodeFunctionData(functionFragment: "setMaxExpiration", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "setMinContributionRate", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "setMinExpiration", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "setReceiver", values: [string]): string;
    encodeFunctionData(functionFragment: "supportsInterface", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "unpause", values?: undefined): string;
    encodeFunctionData(functionFragment: "withdrawPayments", values: [string]): string;
    decodeFunctionResult(functionFragment: "DEFAULT_ADMIN_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "MODIFY_CONTRIBUTION_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "MODIFY_FUNDS_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "PAUSE_ROLE", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "accountant", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleAdmin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleMember", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getRoleMemberCount", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "grantRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "hasRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "invalidStartDate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValid", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "license", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "licenseExpirationTimestamps", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "makePayment", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "maxExpiration", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "migrateFunds", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "minContributionRate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "minExpiration", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "moveFunds", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "payments", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "receiver", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "revokeRole", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setAccountant", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setContributionRate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setLicense", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setMaxExpiration", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setMinContributionRate", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setMinExpiration", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setReceiver", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "withdrawPayments", data: BytesLike): Result;
    events: {
        "LicenseExpirationUpdated(uint256,uint256)": EventFragment;
        "Paused(address)": EventFragment;
        "PaymentMade(uint256,uint256)": EventFragment;
        "RoleAdminChanged(bytes32,bytes32,bytes32)": EventFragment;
        "RoleGranted(bytes32,address,address)": EventFragment;
        "RoleRevoked(bytes32,address,address)": EventFragment;
        "Unpaused(address)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "LicenseExpirationUpdated"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Paused"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "PaymentMade"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoleAdminChanged"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoleGranted"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "RoleRevoked"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Unpaused"): EventFragment;
}
export declare type LicenseExpirationUpdatedEvent = TypedEvent<[
    BigNumber,
    BigNumber
], {
    licenseId: BigNumber;
    newExpirationTimestamp: BigNumber;
}>;
export declare type LicenseExpirationUpdatedEventFilter = TypedEventFilter<LicenseExpirationUpdatedEvent>;
export declare type PausedEvent = TypedEvent<[string], {
    account: string;
}>;
export declare type PausedEventFilter = TypedEventFilter<PausedEvent>;
export declare type PaymentMadeEvent = TypedEvent<[
    BigNumber,
    BigNumber
], {
    licenseId: BigNumber;
    paymentAmount: BigNumber;
}>;
export declare type PaymentMadeEventFilter = TypedEventFilter<PaymentMadeEvent>;
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
export declare type UnpausedEvent = TypedEvent<[string], {
    account: string;
}>;
export declare type UnpausedEventFilter = TypedEventFilter<UnpausedEvent>;
export interface ETHExpirationCollector extends BaseContract {
    contractName: "ETHExpirationCollector";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: ETHExpirationCollectorInterface;
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
        MODIFY_FUNDS_ROLE(overrides?: CallOverrides): Promise<[string]>;
        PAUSE_ROLE(overrides?: CallOverrides): Promise<[string]>;
        accountant(overrides?: CallOverrides): Promise<[string]>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<[string]>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<[string]>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<[BigNumber]>;
        grantRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<[boolean]>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;
        license(overrides?: CallOverrides): Promise<[string]>;
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;
        makePayment(id: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        maxExpiration(overrides?: CallOverrides): Promise<[BigNumber]>;
        migrateFunds(fromId: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        minContributionRate(overrides?: CallOverrides): Promise<[BigNumber]>;
        minExpiration(overrides?: CallOverrides): Promise<[BigNumber]>;
        moveFunds(fromId: BigNumberish, fromContributionRate: BigNumberish, fromAdditionalPayment: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, toAdditionalPayment: BigNumberish, amount: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        pause(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        paused(overrides?: CallOverrides): Promise<[boolean]>;
        payments(dest: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        receiver(overrides?: CallOverrides): Promise<[string]>;
        renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setAccountant(accountantAddress: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setContributionRate(id: BigNumberish, newContributionRate: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setLicense(licenseAddress: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setMaxExpiration(_maxExpiration: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setMinContributionRate(_minContributionRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setMinExpiration(_minExpiration: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setReceiver(_receiver: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;
        unpause(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        withdrawPayments(payee: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
    };
    DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;
    MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<string>;
    MODIFY_FUNDS_ROLE(overrides?: CallOverrides): Promise<string>;
    PAUSE_ROLE(overrides?: CallOverrides): Promise<string>;
    accountant(overrides?: CallOverrides): Promise<string>;
    getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;
    getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<string>;
    getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
    grantRole(role: BytesLike, account: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<boolean>;
    invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
    license(overrides?: CallOverrides): Promise<string>;
    licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
    makePayment(id: BigNumberish, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    maxExpiration(overrides?: CallOverrides): Promise<BigNumber>;
    migrateFunds(fromId: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    minContributionRate(overrides?: CallOverrides): Promise<BigNumber>;
    minExpiration(overrides?: CallOverrides): Promise<BigNumber>;
    moveFunds(fromId: BigNumberish, fromContributionRate: BigNumberish, fromAdditionalPayment: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, toAdditionalPayment: BigNumberish, amount: BigNumberish, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    pause(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    paused(overrides?: CallOverrides): Promise<boolean>;
    payments(dest: string, overrides?: CallOverrides): Promise<BigNumber>;
    receiver(overrides?: CallOverrides): Promise<string>;
    renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setAccountant(accountantAddress: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setContributionRate(id: BigNumberish, newContributionRate: BigNumberish, overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setLicense(licenseAddress: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setMaxExpiration(_maxExpiration: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setMinContributionRate(_minContributionRate: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setMinExpiration(_minExpiration: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setReceiver(_receiver: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<boolean>;
    unpause(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    withdrawPayments(payee: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    callStatic: {
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<string>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<string>;
        MODIFY_FUNDS_ROLE(overrides?: CallOverrides): Promise<string>;
        PAUSE_ROLE(overrides?: CallOverrides): Promise<string>;
        accountant(overrides?: CallOverrides): Promise<string>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<string>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<string>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        grantRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<void>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<boolean>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
        license(overrides?: CallOverrides): Promise<string>;
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        makePayment(id: BigNumberish, overrides?: CallOverrides): Promise<void>;
        maxExpiration(overrides?: CallOverrides): Promise<BigNumber>;
        migrateFunds(fromId: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, overrides?: CallOverrides): Promise<void>;
        minContributionRate(overrides?: CallOverrides): Promise<BigNumber>;
        minExpiration(overrides?: CallOverrides): Promise<BigNumber>;
        moveFunds(fromId: BigNumberish, fromContributionRate: BigNumberish, fromAdditionalPayment: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, toAdditionalPayment: BigNumberish, amount: BigNumberish, overrides?: CallOverrides): Promise<void>;
        pause(overrides?: CallOverrides): Promise<void>;
        paused(overrides?: CallOverrides): Promise<boolean>;
        payments(dest: string, overrides?: CallOverrides): Promise<BigNumber>;
        receiver(overrides?: CallOverrides): Promise<string>;
        renounceRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<void>;
        revokeRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<void>;
        setAccountant(accountantAddress: string, overrides?: CallOverrides): Promise<void>;
        setContributionRate(id: BigNumberish, newContributionRate: BigNumberish, overrides?: CallOverrides): Promise<void>;
        setLicense(licenseAddress: string, overrides?: CallOverrides): Promise<void>;
        setMaxExpiration(_maxExpiration: BigNumberish, overrides?: CallOverrides): Promise<void>;
        setMinContributionRate(_minContributionRate: BigNumberish, overrides?: CallOverrides): Promise<void>;
        setMinExpiration(_minExpiration: BigNumberish, overrides?: CallOverrides): Promise<void>;
        setReceiver(_receiver: string, overrides?: CallOverrides): Promise<void>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<boolean>;
        unpause(overrides?: CallOverrides): Promise<void>;
        withdrawPayments(payee: string, overrides?: CallOverrides): Promise<void>;
    };
    filters: {
        "LicenseExpirationUpdated(uint256,uint256)"(licenseId?: BigNumberish | null, newExpirationTimestamp?: null): LicenseExpirationUpdatedEventFilter;
        LicenseExpirationUpdated(licenseId?: BigNumberish | null, newExpirationTimestamp?: null): LicenseExpirationUpdatedEventFilter;
        "Paused(address)"(account?: null): PausedEventFilter;
        Paused(account?: null): PausedEventFilter;
        "PaymentMade(uint256,uint256)"(licenseId?: BigNumberish | null, paymentAmount?: null): PaymentMadeEventFilter;
        PaymentMade(licenseId?: BigNumberish | null, paymentAmount?: null): PaymentMadeEventFilter;
        "RoleAdminChanged(bytes32,bytes32,bytes32)"(role?: BytesLike | null, previousAdminRole?: BytesLike | null, newAdminRole?: BytesLike | null): RoleAdminChangedEventFilter;
        RoleAdminChanged(role?: BytesLike | null, previousAdminRole?: BytesLike | null, newAdminRole?: BytesLike | null): RoleAdminChangedEventFilter;
        "RoleGranted(bytes32,address,address)"(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleGrantedEventFilter;
        RoleGranted(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleGrantedEventFilter;
        "RoleRevoked(bytes32,address,address)"(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleRevokedEventFilter;
        RoleRevoked(role?: BytesLike | null, account?: string | null, sender?: string | null): RoleRevokedEventFilter;
        "Unpaused(address)"(account?: null): UnpausedEventFilter;
        Unpaused(account?: null): UnpausedEventFilter;
    };
    estimateGas: {
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
        MODIFY_FUNDS_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
        PAUSE_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
        accountant(overrides?: CallOverrides): Promise<BigNumber>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        grantRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<BigNumber>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        license(overrides?: CallOverrides): Promise<BigNumber>;
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        makePayment(id: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        maxExpiration(overrides?: CallOverrides): Promise<BigNumber>;
        migrateFunds(fromId: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        minContributionRate(overrides?: CallOverrides): Promise<BigNumber>;
        minExpiration(overrides?: CallOverrides): Promise<BigNumber>;
        moveFunds(fromId: BigNumberish, fromContributionRate: BigNumberish, fromAdditionalPayment: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, toAdditionalPayment: BigNumberish, amount: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        pause(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        paused(overrides?: CallOverrides): Promise<BigNumber>;
        payments(dest: string, overrides?: CallOverrides): Promise<BigNumber>;
        receiver(overrides?: CallOverrides): Promise<BigNumber>;
        renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setAccountant(accountantAddress: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setContributionRate(id: BigNumberish, newContributionRate: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setLicense(licenseAddress: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setMaxExpiration(_maxExpiration: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setMinContributionRate(_minContributionRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setMinExpiration(_minExpiration: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setReceiver(_receiver: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        unpause(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        withdrawPayments(payee: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
    };
    populateTransaction: {
        DEFAULT_ADMIN_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        MODIFY_CONTRIBUTION_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        MODIFY_FUNDS_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        PAUSE_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        accountant(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRoleAdmin(role: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRoleMember(role: BytesLike, index: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        getRoleMemberCount(role: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        grantRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        hasRole(role: BytesLike, account: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        invalidStartDate(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isValid(id: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        license(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        licenseExpirationTimestamps(arg0: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        makePayment(id: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        maxExpiration(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        migrateFunds(fromId: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        minContributionRate(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        minExpiration(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        moveFunds(fromId: BigNumberish, fromContributionRate: BigNumberish, fromAdditionalPayment: BigNumberish, toId: BigNumberish, toContributionRate: BigNumberish, toAdditionalPayment: BigNumberish, amount: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        pause(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        paused(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        payments(dest: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        receiver(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        renounceRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        revokeRole(role: BytesLike, account: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setAccountant(accountantAddress: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setContributionRate(id: BigNumberish, newContributionRate: BigNumberish, overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setLicense(licenseAddress: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setMaxExpiration(_maxExpiration: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setMinContributionRate(_minContributionRate: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setMinExpiration(_minExpiration: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setReceiver(_receiver: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        unpause(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        withdrawPayments(payee: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
    };
}
