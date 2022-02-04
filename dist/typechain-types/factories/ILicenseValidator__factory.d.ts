import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ILicenseValidator, ILicenseValidatorInterface } from "../ILicenseValidator";
export declare class ILicenseValidator__factory {
    static readonly abi: {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    }[];
    static createInterface(): ILicenseValidatorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ILicenseValidator;
}
