task("deploy:claimer", "Deploy the SimpleETHClaimer").setAction(async () => {
  const SimpleETHClaimer = await ethers.getContractFactory("SimpleETHClaimer");
  const claimer = await SimpleETHClaimer.deploy();

  console.log("SimpleETHClaimer deployed to:", claimer.address);
});
