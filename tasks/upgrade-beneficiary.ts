import { ContractAddressOrInstance } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function upgradeBeneficiarySuperApp(
  hre: HardhatRuntimeEnvironment,
  beneficiaryContractAddress: ContractAddressOrInstance
) {
  const { treasury, diamondAdmin, deployer } = await hre.getNamedAccounts();

  console.log("Upgrading BeneficiarySuperApp");
  const BeneficiarySuperApp = await hre.ethers.getContractFactory(
    "BeneficiarySuperApp"
  );
  const beneSuperApp = await hre.upgrades.upgradeProxy(
    beneficiaryContractAddress,
    BeneficiarySuperApp
  );
  console.log("BeneficiarySuperApp upgraded: ", beneSuperApp.address);
}

task("upgrade:eoa:beneficiarySuperApp")
  .addParam("beneficiaryContractAddress", "BeneficiarySuperApp address")
  .setAction(
    async (
      {
        beneficiaryContractAddress,
      }: {
        beneficiaryContractAddress: string;
      },
      hre
    ) => {
      // Switch network
      await hre.network.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: 10 }],
      });

      //   await upgradeBeneficiarySuperApp(hre, beneficiaryContractAddress);

      await hre.upgrades.admin.changeProxyAdmin(
        "0x5aD276439E3772FDb6696B6cB61401902D4e8b72",
        "0x8FC4308da9310479dF48ef77142Eef05c363e099"
      );
    }
  );
