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
  - CFAReclaimerFacet
	
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
import { ensureDiamondFacets, diamondEquals } from "diamond-diff";
import { AdminClient } from "defender-admin-client";

const NETWORKS: Record<number, string> = {
  420: "optimism-goerli",
};

async function deployFacets(
  hre: HardhatRuntimeEnvironment,
  registryDiamond: Contract,
  pcoBeaconDiamond: Contract,
  pcoLicenseParams: Contract,
  pcoERC721: Contract,
  geoWebParcel: Contract,
  pcoLicenseClaimerV2?: Contract,
  cfaBasePCO?: Contract,
  cfaPenaltyBid?: Contract,
  cfaReclaimer?: Contract
) {
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

  const CFAReclaimerFacet = await hre.ethers.getContractFactory(
    "CFAReclaimerFacet"
  );
  const cfaReclaimerFacet = cfaReclaimer ?? (await CFAReclaimerFacet.deploy());
  await cfaReclaimerFacet.deployed();
  console.log(`CFAReclaimerFacet deployed: ${cfaReclaimerFacet.address}`);

  const pcoLicenseDiamondI = await hre.ethers.getContractAt(
    "PCOLicenseDiamond",
    pcoBeaconDiamond.address
  );

  const ICFABasePCO = await hre.ethers.getContractAt(
    "ICFABasePCO",
    cfaBasePCOFacet.address
  );

  const ICFAPenaltyBid = await hre.ethers.getContractAt(
    "ICFAPenaltyBid",
    cfaPenaltyBidFacet.address
  );

  const ICFAReclaimer = await hre.ethers.getContractAt(
    "ICFAReclaimer",
    cfaReclaimerFacet.address
  );

  const currentPCOBeaconDiamondFacets = (await pcoLicenseDiamondI.facets())
    .map((f: any) => {
      return { facetAddress: f.target, functionSelectors: f.selectors };
    })
    .filter(
      (v: any) =>
        v.facetAddress !== "0xe5769B506e624044ac2d472e76BedBA53Dc2BbEd"
    );

  const newPCOBeaconDiamondFacets = [
    {
      facetAddress: cfaBasePCOFacet.address,
      functionSelectors: getSelectors(ICFABasePCO),
    },
    {
      facetAddress: cfaPenaltyBidFacet.address,
      functionSelectors: getSelectors(ICFAPenaltyBid),
    },
    {
      facetAddress: cfaReclaimerFacet.address,
      functionSelectors: getSelectors(ICFAReclaimer),
    },
  ];

  const pcoLicenseDiamondFacetCuts = ensureDiamondFacets(
    currentPCOBeaconDiamondFacets,
    newPCOBeaconDiamondFacets
  );

  const registryDiamondI = await hre.ethers.getContractAt(
    "IRegistryDiamond",
    registryDiamond.address
  );

  const IPCOLicenseClaimer = await hre.ethers.getContractAt(
    "IPCOLicenseClaimer",
    pcoLicenseClaimerFacetV2.address
  );

  const currentRegistryDiamondFacets = (await registryDiamondI.facets()).map(
    (f: any) => {
      return { facetAddress: f.target, functionSelectors: f.selectors };
    }
  );

  const newRegistryDiamondFacets = [
    {
      facetAddress: "0xBA1231785A7b4AC0E8dC9a0403938C2182cE4A4e",
      functionSelectors: getSelectors(pcoLicenseDiamondI, true),
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
      facetAddress: pcoERC721.address,
      functionSelectors: getSelectors(pcoERC721),
    },
    {
      facetAddress: pcoLicenseClaimerFacetV2.address,
      functionSelectors: getSelectors(IPCOLicenseClaimer),
    },
  ];

  const registryDiamondFacetCuts = ensureDiamondFacets(
    currentRegistryDiamondFacets,
    newRegistryDiamondFacets
  );

  return { registryDiamondFacetCuts, pcoLicenseDiamondFacetCuts };
}

task("upgrade:4.2.0")
  .addParam("registryDiamondAddress", "RegistryDiamond address")
  .addParam("pcoBeaconDiamondAddress", "PCO beacond diamond address")
  .addOptionalParam("pcoLicenseClaimerV2Address", "PCOLicenseClaimerV2 address")
  .addOptionalParam("cfaBaseAddress", "CFABasePCO facet address")
  .addOptionalParam("cfaPenaltyBidAddress", "CFAPenaltyBid facet address")
  .addOptionalParam("cfaReclaimerAddress", "CFAReclaimer facet address")
  .setAction(
    async (
      {
        registryDiamondAddress,
        pcoBeaconDiamondAddress,
        pcoLicenseClaimerV2Address,
        cfaBaseAddress,
        cfaPenaltyBidAddress,
        cfaReclaimerAddress,
      }: {
        registryDiamondAddress: string;
        pcoBeaconDiamondAddress: string;
        pcoLicenseClaimerV2Address?: string;
        cfaBaseAddress?: string;
        cfaPenaltyBidAddress?: string;
        cfaReclaimerAddress?: string;
      },
      hre
    ) => {
      const { diamondAdmin } = await hre.getNamedAccounts();

      // Create Defender client
      const adminClient = new AdminClient({
        apiKey: process.env.DEFENDER_API_KEY!,
        apiSecret: process.env.DEFENDER_API_SECRET!,
      });

      // Switch network
      await hre.network.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: 10 }],
      });

      const registryDiamond = await hre.ethers.getContractAt(
        "IDiamondReadable",
        registryDiamondAddress
      );

      const pcoBeaconDiamond = await hre.ethers.getContractAt(
        "IDiamondReadable",
        pcoBeaconDiamondAddress
      );

      const diamondWritableI = await hre.ethers.getContractAt(
        "IDiamondWritable",
        pcoBeaconDiamondAddress
      );

      const pcoLicenseClaimerFacetV2 = pcoLicenseClaimerV2Address
        ? await hre.ethers.getContractAt(
            "IPCOLicenseClaimer",
            pcoLicenseClaimerV2Address
          )
        : undefined;

      const cfaBasePCOFacet = cfaBaseAddress
        ? await hre.ethers.getContractAt("ICFABasePCO", cfaBaseAddress)
        : undefined;

      const cfaPenaltyBidFacet = cfaPenaltyBidAddress
        ? await hre.ethers.getContractAt("ICFAPenaltyBid", cfaPenaltyBidAddress)
        : undefined;

      const cfaReclaimerFacet = cfaReclaimerAddress
        ? await hre.ethers.getContractAt("ICFAReclaimer", cfaReclaimerAddress)
        : undefined;

      const pcoLicenseParams = await hre.ethers.getContractAt(
        "IPCOLicenseParamsStore",
        "0xCD3cAC9Dd1CE5f2E6cBff6De7a5f4cCB6f8207dd"
      );
      const pcoERC721 = await hre.ethers.getContractAt(
        "PCOERC721Facet",
        "0xe8F5c41Fc53ea331A68E45Cdb0ee2f8849EDcaA0"
      );
      const geoWebParcel = await hre.ethers.getContractAt(
        "IGeoWebParcel",
        "0x53E71045CB4611374e3B28C1A996d25A4397FE45"
      );

      const { registryDiamondFacetCuts, pcoLicenseDiamondFacetCuts } =
        await deployFacets(
          hre,
          registryDiamond,
          pcoBeaconDiamond,
          pcoLicenseParams,
          pcoERC721,
          geoWebParcel,
          pcoLicenseClaimerFacetV2,
          cfaBasePCOFacet,
          cfaPenaltyBidFacet,
          cfaReclaimerFacet
        );

      const target = hre.ethers.constants.AddressZero;
      const data = "0x";

      // console.log(pcoLicenseDiamondFacetCuts, target, data);

      const pcoLicenseDiamondCutData =
        diamondWritableI.interface.encodeFunctionData(
          "diamondCut((address,uint8,bytes4[])[],address,bytes)",
          [
            pcoLicenseDiamondFacetCuts.map((v) => [
              v.facetAddress,
              v.action,
              v.functionSelectors,
            ]),
            target,
            data,
          ]
        );
      console.log(pcoLicenseDiamondCutData);

      const registryDiamondCutData =
        diamondWritableI.interface.encodeFunctionData(
          "diamondCut((address,uint8,bytes4[])[],address,bytes)",
          [
            registryDiamondFacetCuts.map((v) => [
              v.facetAddress,
              v.action,
              v.functionSelectors,
            ]),
            target,
            data,
          ]
        );
      console.log(registryDiamondCutData);

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
