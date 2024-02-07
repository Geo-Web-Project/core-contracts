/*
	v4.3.0 Upgrade
	
	RegistryDiamond
	===============
	
	Facets to deploy:
	- PCOERC721Facet
	
	Function selectors to REPLACE:
	- All of PCOERC721Facet
	
	Function selectors to ADD:
	- updateTokenURI(uint256,string) -> PCOERC721Facet
	
	===============
*/

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
const {
  FacetCutAction,
  getSelectors,
} = require("../../scripts/libraries/diamond.js");
import { task } from "hardhat/config";
import { ensureDiamondFacets, diamondEquals } from "diamond-diff";
import { AdminClient } from "defender-admin-client";

const NETWORKS: Record<number, string> = {
  420: "optimism-goerli",
};

async function deployFacets(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract,
  pcoLicenseParams: Contract,
  geoWebParcel: Contract,
  pcoLicenseClaimer: Contract,
  pcoERC721?: Contract
) {
  const PCOERC721Facet = await hre.ethers.getContractFactory("PCOERC721Facet");
  const pcoERC721Facet = pcoERC721 ?? (await PCOERC721Facet.deploy());
  await pcoERC721Facet.deployed();
  console.log(`PCOERC721Facet deployed: ${pcoERC721Facet.address}`);

  const registryDiamondI = await hre.ethers.getContractAt(
    "RegistryDiamond",
    registryDiamond.address
  );

  const IPCOERC721 = await hre.ethers.getContractAt(
    "IPCOERC721",
    pcoERC721Facet.address
  );

  const currentRegistryDiamondFacets = (await registryDiamondI.facets()).map(
    (f: any) => {
      return { facetAddress: f.target, functionSelectors: f.selectors };
    }
  );

  const newRegistryDiamondFacets = [
    {
      facetAddress: "0xBA1231785A7b4AC0E8dC9a0403938C2182cE4A4e",
      functionSelectors: getSelectors(registryDiamondI, true),
    },
    {
      facetAddress: pcoLicenseParams.address,
      functionSelectors: getSelectors(pcoLicenseParams),
    },
    {
      facetAddress: geoWebParcel.address,
      functionSelectors: getSelectors(geoWebParcel),
    },
    {
      facetAddress: pcoLicenseClaimer.address,
      functionSelectors: getSelectors(pcoLicenseClaimer),
    },
    {
      facetAddress: pcoERC721Facet.address,
      functionSelectors: getSelectors(IPCOERC721),
    },
  ];

  const registryDiamondFacetCuts = ensureDiamondFacets(
    currentRegistryDiamondFacets,
    newRegistryDiamondFacets
  );

  return { registryDiamondFacetCuts };
}

task("upgrade:4.3.0")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .addOptionalParam("pcoErc721Address", "PCOERC721 facet address")
  .setAction(
    async (
      {
        registryDiamondAddress,
        pcoErc721Address,
      }: {
        registryDiamondAddress: string;
        pcoErc721Address?: string;
      },
      hre
    ) => {
      // Switch network
      await hre.network.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: 10 }],
      });

      const registryDiamond = await hre.ethers.getContractAt(
        "IDiamondReadable",
        registryDiamondAddress
      );

      const diamondWritableI = await hre.ethers.getContractAt(
        "IDiamondWritable",
        registryDiamondAddress
      );

      const pcoLicenseParams = await hre.ethers.getContractAt(
        "IPCOLicenseParamsStore",
        "0xCD3cAC9Dd1CE5f2E6cBff6De7a5f4cCB6f8207dd"
      );
      const pcoLicenseClaimer = await hre.ethers.getContractAt(
        "IPCOLicenseClaimer",
        "0x455391cb23189F1Bfaae1Bf2de62718baf33d409"
      );
      const geoWebParcel = await hre.ethers.getContractAt(
        "IGeoWebParcel",
        "0x53E71045CB4611374e3B28C1A996d25A4397FE45"
      );

      const pcoERC721 = pcoErc721Address
        ? await hre.ethers.getContractAt("IPCOERC721", pcoErc721Address)
        : undefined;

      const { registryDiamondFacetCuts } = await deployFacets(
        hre,
        registryDiamond,
        pcoLicenseParams,
        geoWebParcel,
        pcoLicenseClaimer,
        pcoERC721
      );

      const target = hre.ethers.constants.AddressZero;
      const data = "0x";

      console.log(registryDiamondFacetCuts, target, data);

      // await diamondWritableI[
      //   "diamondCut((address,uint8,bytes4[])[],address,bytes)"
      // ](
      //   registryDiamondFacetCuts.map((v) => [
      //     v.facetAddress,
      //     v.action,
      //     v.functionSelectors,
      //   ]),
      //   target,
      //   data
      // );

      // Cut diamond
      // await adminClient.createProposal({
      //   contract: {
      //     address: registryDiamond.address,
      //     network: NETWORKS[420] as any,
      //   }, // Target contract
      //   title: "Upgrade PCOLicenseDiamond v4.2.0", // Title of the proposal
      //   description: "Cut PCOLicenseDiamond to upgrade to v4.2.0", // Description of the proposal
      //   type: "custom", // Use 'custom' for custom admin actions
      //   functionInterface: {
      //     name: "diamondCut",
      //     inputs: [
      //       {
      //         components: [
      //           {
      //             internalType: "address",
      //             name: "target",
      //             type: "address",
      //           },
      //           {
      //             internalType: "enum IDiamondWritable.FacetCutAction",
      //             name: "action",
      //             type: "uint8",
      //           },
      //           {
      //             internalType: "bytes4[]",
      //             name: "selectors",
      //             type: "bytes4[]",
      //           },
      //         ],
      //         internalType: "struct IDiamondWritable.FacetCut[]",
      //         name: "facetCuts",
      //         type: "tuple[]",
      //       },
      //       {
      //         internalType: "address",
      //         name: "target",
      //         type: "address",
      //       },
      //       {
      //         internalType: "bytes",
      //         name: "data",
      //         type: "bytes",
      //       },
      //     ],
      //   }, // Function ABI
      //   functionInputs: pcoLicenseDiamondFacetCutsData, // Arguments to the function
      //   via: diamondAdmin, // Address to execute proposal
      //   viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
      // });
    }
  );
