task("deploy:purchaser", "Deploy the ETHPurchaser").setAction(async () => {
  const ETHPurchaser = await ethers.getContractFactory("ETHPurchaser");
  const purchaser = await ETHPurchaser.deploy();

  console.log("ETHPurchaser deployed to:", purchaser.address);
});
