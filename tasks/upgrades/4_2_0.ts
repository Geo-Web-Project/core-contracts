/*
	v4.2.0 Upgrade
	
	RegistryDiamond
	===============
	
	Facets to deploy:
	- PCOLicenseClaimerFacetV2
	
	Function selectors to REPLACE:
	- All of IPCOLicenseClaimerFacetV2 -> PCOLicenseClaimerFacetV2
	
	Function selectors to ADD:
	- claim(int96,uint256,(uint64,uint256,uint256),bytes) -> PCOLicenseClaimerFacetV2
	
	===============
	
	PCOLicenseDiamond
	===============
	
	Facets to deploy:
	- CFABasePCOFacet
	- CFAPenaltyBidFacet
	
	Function selectors to REPLACE:
	- All of ICFABasePCOFacet -> CFABasePCOFacet
	- All of ICFAPenaltyBidFacet -> CFAPenaltyBidFacet
	
	Function selectors to ADD:
	- initializeBid(address,address,address,uint256,address,int96,uint256,bytes) -> CFABasePCOFacet
	- contentHash() -> CFABasePCOFacet
	- editBid(int96,uint256,bytes) -> CFAPenaltyBidFacet
	- placeBid(int96,uint256,bytes) -> CFAPenaltyBidFacet

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

async function deployFacets(
  hre: HardhatRuntimeEnvironment,
  pcoLicenseClaimerV2?: Contract,
  cfaBasePCO?: Contract,
  cfaPenaltyBid?: Contract
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

  const CFABasePCOFacet = await hre.ethers.getContractFactory(
    "CFABasePCOFacet"
  );
  const cfaBasePCOFacet = cfaBasePCO ?? (await CFABasePCOFacet.deploy());
  await cfaBasePCOFacet.deployed();
  console.log(`CFABasePCOFacet deployed: ${cfaBasePCOFacet.address}`);

  const CFAPenaltyBidFacet = await hre.ethers.getContractFactory(
    "CFAPenaltyBidFacet"
  );
  const cfaPenaltyBidFacet =
    cfaPenaltyBid ?? (await CFAPenaltyBidFacet.deploy());
  await cfaPenaltyBidFacet.deployed();
  console.log(`CFAPenaltyBidFacet deployed: ${cfaPenaltyBidFacet.address}`);

  const pcoLicenseClaimerI = await hre.ethers.getContractAt(
    "IPCOLicenseClaimer",
    pcoLicenseClaimerFacetV2.address
  );

  const cfaBasePCOI = await hre.ethers.getContractAt(
    "ICFABasePCO",
    cfaBasePCOFacet.address
  );

  const cfaPenaltyBidI = await hre.ethers.getContractAt(
    "ICFAPenaltyBid",
    cfaPenaltyBidFacet.address
  );

  // ADD
  facetCuts.push({
    target: pcoLicenseClaimerFacetV2.address,
    action: FacetCutAction.Add,
    selectors: [
      pcoLicenseClaimerFacetV2.interface.getSighash(
        "claim(int96,uint256,(uint64,uint256,uint256),bytes)"
      ),
    ],
  });
  facetCuts.push({
    target: cfaBasePCOFacet.address,
    action: FacetCutAction.Add,
    selectors: [
      cfaBasePCOFacet.interface.getSighash(
        "initializeBid(address,address,address,uint256,address,int96,uint256,bytes)"
      ),
      cfaBasePCOFacet.interface.getSighash("contentHash()"),
    ],
  });
  facetCuts.push({
    target: cfaPenaltyBidFacet.address,
    action: FacetCutAction.Add,
    selectors: [
      cfaPenaltyBidFacet.interface.getSighash("editBid(int96,uint256,bytes)"),
      cfaPenaltyBidFacet.interface.getSighash("placeBid(int96,uint256,bytes)"),
    ],
  });

  // REPLACE
  facetCuts.push({
    target: pcoLicenseClaimerFacetV2.address,
    action: FacetCutAction.Replace,
    selectors: getSelectors(pcoLicenseClaimerI),
  });
  facetCuts.push({
    target: cfaBasePCOFacet.address,
    action: FacetCutAction.Replace,
    selectors: getSelectors(cfaBasePCOI),
  });
  facetCuts.push({
    target: cfaPenaltyBidFacet.address,
    action: FacetCutAction.Replace,
    selectors: getSelectors(cfaPenaltyBidI),
  });

  return facetCuts;
}
task("upgrade:4.2.0")
  .addOptionalParam("pcoLicenseClaimerV2Address", "PCOLicenseClaimerV2 address")
  .setAction(
    async (
      {
        pcoLicenseClaimerV2Address,
      }: {
        pcoLicenseClaimerV2Address?: string;
      },
      hre
    ) => {
      // const { diamondAdmin } = await hre.getNamedAccounts();

      // Create Defender client
      // const adminClient = new AdminClient({
      //   apiKey: process.env.DEFENDER_API_KEY!,
      //   apiSecret: process.env.DEFENDER_API_SECRET!,
      // });

      const pcoLicenseClaimerFacetV2 = pcoLicenseClaimerV2Address
        ? await hre.ethers.getContractAt(
            "IPCOLicenseClaimer",
            pcoLicenseClaimerV2Address
          )
        : undefined;

      const facetCuts = await deployFacets(hre, pcoLicenseClaimerFacetV2);

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
