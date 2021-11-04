task("deploy:accountant", "Deploy the Accountant").setAction(async () => {
  const Accountant = await ethers.getContractFactory("Accountant");
  const accountant = await Accountant.deploy();

  console.log("Accountant deployed to:", accountant.address);
});
