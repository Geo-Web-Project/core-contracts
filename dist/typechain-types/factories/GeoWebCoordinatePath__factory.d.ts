import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GeoWebCoordinatePath, GeoWebCoordinatePathInterface } from "../GeoWebCoordinatePath";
declare type GeoWebCoordinatePathConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class GeoWebCoordinatePath__factory extends ContractFactory {
    constructor(...args: GeoWebCoordinatePathConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GeoWebCoordinatePath>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GeoWebCoordinatePath;
    connect(signer: Signer): GeoWebCoordinatePath__factory;
    static readonly contractName: "GeoWebCoordinatePath";
    readonly contractName: "GeoWebCoordinatePath";
    static readonly bytecode = "0x61014b61003a600b82828239805160001a60731461002d57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600436106100355760003560e01c8063f2cc14331461003a575b600080fd5b61004d6100483660046100da565b61006e565b60408051931515845260208401929092529082015260600160405180910390f35b600080600061007c8461008a565b9250925092505b9193909250565b60f881901c801515906000908190836100aa575060009150819050610083565b6003851692506001600160f81b03851660f86100c76001846100f2565b901b600282901c17925050509193909250565b6000602082840312156100eb578081fd5b5035919050565b60008282101561011057634e487b7160e01b81526011600452602481fd5b50039056fea2646970667358221220fb2c70fd334424e2efb193d15ff0b03abc37a6138b85ea759b16507e7b3c56da64736f6c63430008040033";
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
    static createInterface(): GeoWebCoordinatePathInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): GeoWebCoordinatePath;
}
export {};
