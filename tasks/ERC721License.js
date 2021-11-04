task("deploy:license", "Deploy the ERC721License").setAction(async () => {
  const ERC721License = await ethers.getContractFactory("ERC721License");
  const license = await ERC721License.deploy();

  console.log("ERC721License deployed to:", license.address);

  return license.address;
});
