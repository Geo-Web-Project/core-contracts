/*
	v4.1.0 Upgrade
	
	RegistryDiamond
	===============
	
	Facets to deploy:
	- GeoWebParcelFacetV2
	- PCOLicenseClaimerFacetV2
	
	Function selectors to ADD:
	- getLandParcelV2(uint256) -> GeoWebParcelFacetV2
	- claim(int96,uint256,(uint64,uint256,uint256)) -> PCOLicenseClaimerFacetV2
	
	Function selectors to REMOVE:
	- claim(int96,uint256,uint64,uint256[])
	
	===============
*/

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract } from "ethers";
const { FacetCutAction } = require("../../scripts/libraries/diamond.js");
import { task } from "hardhat/config";
import { AdminClient } from "defender-admin-client";

const NETWORKS: Record<number, string> = {
  5: "goerli",
};

async function deployFacets(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract
) {
  const facetCuts = [];

  const GeoWebParcelFacetV2 = await hre.ethers.getContractFactory(
    "GeoWebParcelFacetV2"
  );
  const geoWebParcelFacetV2 = await GeoWebParcelFacetV2.deploy();
  await geoWebParcelFacetV2.deployed();
  console.log(`GeoWebParcelFacetV2 deployed: ${geoWebParcelFacetV2.address}`);
  facetCuts.push({
    target: geoWebParcelFacetV2.address,
    action: FacetCutAction.Add,
    selectors: [
      geoWebParcelFacetV2.interface.getSighash("getLandParcelV2(uint256)"),
    ],
  });

  const PCOLicenseClaimerFacetV2 = await hre.ethers.getContractFactory(
    "PCOLicenseClaimerFacetV2"
  );
  const pcoLicenseClaimerFacetV2 = await PCOLicenseClaimerFacetV2.deploy();
  await pcoLicenseClaimerFacetV2.deployed();
  console.log(
    `PCOLicenseClaimerFacetV2 deployed: ${pcoLicenseClaimerFacetV2.address}`
  );
  facetCuts.push({
    target: pcoLicenseClaimerFacetV2.address,
    action: FacetCutAction.Add,
    selectors: [
      pcoLicenseClaimerFacetV2.interface.getSighash(
        "claim(int96,uint256,(uint64,uint256,uint256))"
      ),
    ],
  });

  // Remove
  facetCuts.push({
    target: hre.ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    selectors: [
      registryDiamond.interface.getSighash(
        "claim(int96,uint256,uint64,uint256[])"
      ),
    ],
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
    `RegistryDiamond`,
    registryDiamond.address
  );
  await diamond.diamondCut(facetCuts, target, data);
  console.log(`Diamond cut: ${diamond.address}`);
}

task("upgrade:4.1.0")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .setAction(
    async (
      {
        registryDiamondAddress,
      }: {
        registryDiamondAddress: string;
      },
      hre
    ) => {
      const { diamondAdmin } = await hre.getNamedAccounts();

      // Create Defender client
      const adminClient = new AdminClient({
        apiKey: process.env.DEFENDER_API_KEY!,
        apiSecret: process.env.DEFENDER_API_SECRET!,
      });

      const RegistryDiamond = await hre.ethers.getContractFactory(
        "RegistryDiamondABI"
      );
      const registryDiamond = RegistryDiamond.attach(registryDiamondAddress);

      const facetCuts = await deployFacets(hre, registryDiamond);

      const target = hre.ethers.constants.AddressZero;
      const data = "0x";

      const encodedFacetCuts = facetCuts.map((c) =>
        hre.ethers.utils.defaultAbiCoder.encode(
          ["address", "uint8", "bytes4[]"],
          [c.target, c.action, c.selectors]
        )
      );

      // Cut diamond
      await adminClient.createProposal({
        contract: {
          address: registryDiamond.address,
          network: NETWORKS[hre.network.config.chainId!] as any,
        }, // Target contract
        title: "Upgrade RegsitryDiamond v4.1.0", // Title of the proposal
        description: "Cut RegistryDiamond to upgrade to v4.1.0", // Description of the proposal
        type: "custom", // Use 'custom' for custom admin actions
        functionInterface: {
          name: "diamondCut",
          inputs: [
            { name: "facetCuts", type: "tuple[]" },
            {
              name: "target",
              type: "address",
            },
            {
              name: "data",
              type: "bytes",
            },
          ],
        }, // Function ABI
        functionInputs: [encodedFacetCuts, target, data], // Arguments to the function
        via: diamondAdmin, // Address to execute proposal
        viaType: "Gnosis Safe", // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
      });
    }
  );
