/*
	v4.1.5 Upgrade
	
	RegistryDiamond
	===============
	
	Facets to deploy:
	- PCOLicenseClaimerFacetV2
	
	Function selectors to REPLACE:
	- All of IPCOLicenseClaimerFacet -> PCOLicenseClaimerFacetV2
	
	===============
*/

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
const {
  FacetCutAction,
  getSelectors,
} = require("../../scripts/libraries/diamond.js");
import { task } from "hardhat/config";
import { AdminClient } from "defender-admin-client";
import { DiamondWritable } from "../../typechain-types/DiamondWritable";

async function deployFacets(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract,
  pcoLicenseClaimerV2?: Contract
) {
  const facetCuts = [];

  const PCOLicenseClaimerFacetV2 = await hre.ethers.getContractFactory(
    "PCOLicenseClaimerFacetV2"
  );
  const pcoLicenseClaimerFacetV2 =
    pcoLicenseClaimerV2 ?? (await PCOLicenseClaimerFacetV2.deploy());
  await pcoLicenseClaimerFacetV2.deployed();
  console.log(
    `PCOLicenseClaimerFacetV2 deployed: ${pcoLicenseClaimerFacetV2.address}`
  );

  const pcoLicenseClaimer = await hre.ethers.getContractAt(
    "IPCOLicenseClaimer",
    pcoLicenseClaimerFacetV2.address
  );

  facetCuts.push({
    target: pcoLicenseClaimerFacetV2.address,
    action: FacetCutAction.Replace,
    selectors: getSelectors(pcoLicenseClaimer),
  });

  return facetCuts;
}

export async function upgrade(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract
) {
  const facetCuts = await deployFacets(hre, registryDiamond);

  const target = hre.ethers.constants.AddressZero;
  const data = "0x";

  // Cut diamond
  const diamond = await hre.ethers.getContractAt(
    `IRegistryDiamond`,
    registryDiamond.address
  );
  await diamond.diamondCut(facetCuts, target, data);
  console.log(`Diamond cut: ${diamond.address}`);
}

task("upgrade:4.1.5")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .addOptionalParam("pcoLicenseClaimerV2Address", "PCOLicenseClaimerV2 address")
  .setAction(
    async (
      {
        registryDiamondAddress,
        pcoLicenseClaimerV2Address,
      }: {
        registryDiamondAddress: string;
        pcoLicenseClaimerV2Address?: string;
      },
      hre
    ) => {
      const { diamondAdmin } = await hre.getNamedAccounts();

      // Create Defender client
      // const adminClient = new AdminClient({
      //   apiKey: process.env.DEFENDER_API_KEY!,
      //   apiSecret: process.env.DEFENDER_API_SECRET!,
      // });

      const registryDiamond = await hre.ethers.getContractAt(
        "IRegistryDiamond",
        registryDiamondAddress
      );

      const pcoLicenseClaimerFacetV2 = pcoLicenseClaimerV2Address
        ? await hre.ethers.getContractAt(
            "IPCOLicenseClaimer",
            pcoLicenseClaimerV2Address
          )
        : undefined;

      const facetCuts = await deployFacets(
        hre,
        registryDiamond,
        pcoLicenseClaimerFacetV2
      );

      const target = hre.ethers.constants.AddressZero;
      const data = "0x";

      console.log(facetCuts, target, data);

      // Cut diamond
      // await adminClient.createProposal({
      //   contract: {
      //     address: registryDiamond.address,
      //     network: NETWORKS[hre.network.config.chainId!] as any,
      //   }, // Target contract
      //   title: "Upgrade RegistryDiamond v4.1.0", // Title of the proposal
      //   description: "Cut RegistryDiamond to upgrade to v4.1.0", // Description of the proposal
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
      //   functionInputs: [encodedFacetCuts, target, data], // Arguments to the function
      //   via: diamondAdmin, // Address to execute proposal
      //   viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
      // });
    }
  );
