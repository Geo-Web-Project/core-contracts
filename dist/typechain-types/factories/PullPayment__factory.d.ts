import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { PullPayment, PullPaymentInterface } from "../PullPayment";
export declare class PullPayment__factory {
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
    static createInterface(): PullPaymentInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): PullPayment;
}
