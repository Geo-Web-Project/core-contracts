import chaiAsPromised from "chai-as-promised";
import { expect, use } from "chai";
import { ethers, getNamedAccounts, deployments } from "hardhat";
import { BigNumber, ContractReceipt } from "ethers";
import { solidity } from "ethereum-waffle";
import { smock } from "@defi-wonderland/smock";
import { TestableERC721Facet } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const { shouldBehaveLikeERC721 } = require("./ERC721.behavior");
const {
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS } = constants;
const firstTokenId = BigNumber.from("5042");
const secondTokenId = BigNumber.from("79217");
const nonExistentTokenId = BigNumber.from("13");
const fourthTokenId = BigNumber.from(4);

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("ERC721Facet", async function () {
  let accounts: SignerWithAddress[] = [];

  beforeEach(async function () {
    accounts = await ethers.getSigners();
  });

  const setupTest = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }, options) => {
      await deployments.fixture();
      const { diamondAdmin } = await getNamedAccounts();
      const { diamond } = deployments;
      await diamond.deploy("ERC721Facet", {
        from: diamondAdmin,
        owner: diamondAdmin,
        facets: ["TestableERC721Facet"],
      });

      const erc721Facet: TestableERC721Facet = await ethers.getContract(
        "ERC721Facet",
        diamondAdmin
      );

      const [owner] = accounts;

      await erc721Facet.mint(owner.address, firstTokenId);
      await erc721Facet.mint(owner.address, secondTokenId);

      return {
        erc721Facet,
      };
    }
  );

  const beforeTransfers = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }, options) => {
      const res = await setupTest();
      const { erc721Facet } = res;
      const [owner, newOwner, approved, anotherApproved, operator, other] =
        accounts;

      await erc721Facet.connect(owner).approve(approved.address, firstTokenId);
      await erc721Facet
        .connect(owner)
        .setApprovalForAll(operator.address, true);

      return res;
    }
  );

  describe("balanceOf", function () {
    context("when the given address owns some tokens", function () {
      it("returns the amount of tokens owned by the given address", async function () {
        const { erc721Facet } = await setupTest();
        const [owner, newOwner, approved, anotherApproved, operator, other] =
          accounts.map((v) => v.address);

        expect(await erc721Facet.balanceOf(owner)).to.be.equal("2");
      });
    });

    context("when the given address does not own any tokens", function () {
      it("returns 0", async function () {
        const { erc721Facet } = await setupTest();
        const [owner, newOwner, approved, anotherApproved, operator, other] =
          accounts.map((v) => v.address);

        expect(await erc721Facet.balanceOf(other)).to.be.equal("0");
      });
    });

    context("when querying the zero address", function () {
      it("throws", async function () {
        const { erc721Facet } = await setupTest();

        await expectRevert(
          erc721Facet.balanceOf(ZERO_ADDRESS),
          "ERC721: address zero is not a valid owner"
        );
      });
    });
  });

  //   describe("ownerOf", function () {
  //     context("when the given token ID was tracked by this token", function () {
  //       const tokenId = firstTokenId;

  //       it("returns the owner of the given token ID", async function () {
  //         const { erc721Facet } = await setupTest();
  //         const [owner, newOwner, approved, anotherApproved, operator, other] =
  //           accounts.map((v) => v.address);

  //         expect(await erc721Facet.ownerOf(tokenId)).to.be.equal(owner);
  //       });
  //     });

  //     context(
  //       "when the given token ID was not tracked by this token",
  //       function () {
  //         const tokenId = nonExistentTokenId;

  //         it("reverts", async function () {
  //           const { erc721Facet } = await setupTest();

  //           await expectRevert(
  //             erc721Facet.ownerOf(tokenId),
  //             "ERC721: invalid token ID"
  //           );
  //         });
  //       }
  //     );
  //   });

  describe("transfers", function () {
    const tokenId = firstTokenId;
    const data = "0x42";

    let receipt: ContractReceipt | null = null;

    const transferWasSuccessful = function (erc721Facet: TestableERC721Facet) {
      it("transfers the ownership of the given token ID to the given address", async function () {
        const [owner, newOwner, approved, anotherApproved, operator, other] =
          accounts.map((v) => v.address);

        expect(await erc721Facet.ownerOf(tokenId)).to.be.equal(other);
      });

      it("emits a Transfer event", async function () {
        const [owner, newOwner, approved, anotherApproved, operator, other] =
          accounts.map((v) => v.address);

        expectEvent(receipt, "Transfer", {
          from: owner,
          to: this.toWhom,
          tokenId: tokenId,
        });
      });

      it("clears the approval for the token ID", async function () {
        expect(await this.token.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
      });

      it("adjusts owners balances", async function () {
        const [owner, newOwner, approved, anotherApproved, operator, other] =
          accounts.map((v) => v.address);

        expect(await erc721Facet.balanceOf(owner)).to.be.equal("1");
      });
    };

    const shouldTransferTokensByUsers = function (
      transferFunction: (
        erc721Facet: TestableERC721Facet,
        from: string,
        to: string,
        tokenId: BigNumber,
        opts: any
      ) => Promise<ContractReceipt>
    ) {
      context("when called by the owner", function () {
        beforeEach(async function () {
          const { erc721Facet } = await beforeTransfers();

          const [owner, newOwner, approved, anotherApproved, operator, other] =
            accounts.map((v) => v.address);
          receipt = await transferFunction(erc721Facet, owner, other, tokenId, {
            from: owner,
          });
        });
        // transferWasSuccessful({ tokenId });
      });

      context("when called by the approved individual", function () {
        beforeEach(async function () {
          const { erc721Facet } = await beforeTransfers();

          const [owner, newOwner, approved, anotherApproved, operator, other] =
            accounts.map((v) => v.address);

          receipt = await transferFunction(erc721Facet, owner, other, tokenId, {
            from: approved,
          });
        });
        // transferWasSuccessful({ tokenId });
      });

      context("when called by the operator", function () {
        beforeEach(async function () {
          const { erc721Facet } = await beforeTransfers();

          const [owner, newOwner, approved, anotherApproved, operator, other] =
            accounts.map((v) => v.address);

          receipt = await transferFunction(erc721Facet, owner, other, tokenId, {
            from: operator,
          });
        });
        // transferWasSuccessful({ tokenId });
      });

      context("when called by the owner without an approved user", function () {
        beforeEach(async function () {
          const { erc721Facet } = await beforeTransfers();
          const [owner, newOwner, approved, anotherApproved, operator, other] =
            accounts.map((v) => v.address);

          await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
          receipt = await transferFunction(erc721Facet, owner, other, tokenId, {
            from: operator,
          });
        });
        // transferWasSuccessful({ owner, tokenId, approved: null });
      });

      //   context("when sent to the owner", function () {
      //     beforeEach(async function () {
      //       receipt = await transferFunction.call(this, owner, owner, tokenId, {
      //         from: owner,
      //       });
      //     });

      //     it("keeps ownership of the token", async function () {
      //       expect(await this.token.ownerOf(tokenId)).to.be.equal(owner);
      //     });

      //     it("clears the approval for the token ID", async function () {
      //       expect(await this.token.getApproved(tokenId)).to.be.equal(
      //         ZERO_ADDRESS
      //       );
      //     });

      //     it("emits only a transfer event", async function () {
      //       expectEvent(receipt, "Transfer", {
      //         from: owner,
      //         to: owner,
      //         tokenId: tokenId,
      //       });
      //     });

      //     it("keeps the owner balance", async function () {
      //       expect(await this.token.balanceOf(owner)).to.be.bignumber.equal("2");
      //     });

      //     it("keeps same tokens by index", async function () {
      //       if (!this.token.tokenOfOwnerByIndex) return;
      //       const tokensListed = await Promise.all(
      //         [0, 1].map((i) => this.token.tokenOfOwnerByIndex(owner, i))
      //       );
      //       expect(tokensListed.map((t) => t.toNumber())).to.have.members([
      //         firstTokenId.toNumber(),
      //         secondTokenId.toNumber(),
      //       ]);
      //     });
      //   });

      //   context(
      //     "when the address of the previous owner is incorrect",
      //     function () {
      //       it("reverts", async function () {
      //         await expectRevert(
      //           transferFunction.call(this, other, other, tokenId, {
      //             from: owner,
      //           }),
      //           "ERC721: transfer from incorrect owner"
      //         );
      //       });
      //     }
      //   );

      //   context(
      //     "when the sender is not authorized for the token id",
      //     function () {
      //       it("reverts", async function () {
      //         await expectRevert(
      //           transferFunction.call(this, owner, other, tokenId, {
      //             from: other,
      //           }),
      //           "ERC721: caller is not token owner or approved"
      //         );
      //       });
      //     }
      //   );

      //   context("when the given token ID does not exist", function () {
      //     it("reverts", async function () {
      //       await expectRevert(
      //         transferFunction.call(this, owner, other, nonExistentTokenId, {
      //           from: owner,
      //         }),
      //         "ERC721: invalid token ID"
      //       );
      //     });
      //   });

      //   context(
      //     "when the address to transfer the token to is the zero address",
      //     function () {
      //       it("reverts", async function () {
      //         await expectRevert(
      //           transferFunction.call(this, owner, ZERO_ADDRESS, tokenId, {
      //             from: owner,
      //           }),
      //           "ERC721: transfer to the zero address"
      //         );
      //       });
      //     }
      //   );
    };

    describe("via transferFrom", function () {
      shouldTransferTokensByUsers(async function (
        erc721Facet: TestableERC721Facet,
        from: string,
        to: string,
        tokenId: BigNumber,
        opts: any
      ) {
        return (await erc721Facet.transferFrom(from, to, tokenId, opts)).wait();
      });
    });

    // describe("via safeTransferFrom", function () {
    //   const safeTransferFromWithData = function (from, to, tokenId, opts) {
    //     return this.token.methods[
    //       "safeTransferFrom(address,address,uint256,bytes)"
    //     ](from, to, tokenId, data, opts);
    //   };

    //   const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
    //     return this.token.methods[
    //       "safeTransferFrom(address,address,uint256)"
    //     ](from, to, tokenId, opts);
    //   };

    //   const shouldTransferSafely = function (transferFun, data) {
    //     describe("to a user account", function () {
    //       shouldTransferTokensByUsers(transferFun);
    //     });

    //     describe("to a valid receiver contract", function () {
    //       beforeEach(async function () {
    //         this.receiver = await this.ERC721ReceiverMock.deploy(
    //           RECEIVER_MAGIC_VALUE,
    //           Error.None
    //         );
    //         this.toWhom = this.receiver.address;
    //       });

    //       shouldTransferTokensByUsers(transferFun);

    //       it("calls onERC721Received", async function () {
    //         const receipt = await transferFun.call(
    //           this,
    //           owner,
    //           this.receiver.address,
    //           tokenId,
    //           { from: owner }
    //         );

    //         await expectEvent.inTransaction(
    //           receipt.tx,
    //           ERC721ReceiverMock,
    //           "Received",
    //           {
    //             operator: owner,
    //             from: owner,
    //             tokenId: tokenId,
    //             data: data,
    //           }
    //         );
    //       });

    //       it("calls onERC721Received from approved", async function () {
    //         const receipt = await transferFun.call(
    //           this,
    //           owner,
    //           this.receiver.address,
    //           tokenId,
    //           { from: approved }
    //         );

    //         await expectEvent.inTransaction(
    //           receipt.tx,
    //           ERC721ReceiverMock,
    //           "Received",
    //           {
    //             operator: approved,
    //             from: owner,
    //             tokenId: tokenId,
    //             data: data,
    //           }
    //         );
    //       });

    //       describe("with an invalid token id", function () {
    //         it("reverts", async function () {
    //           await expectRevert(
    //             transferFun.call(
    //               this,
    //               owner,
    //               this.receiver.address,
    //               nonExistentTokenId,
    //               { from: owner }
    //             ),
    //             "ERC721: invalid token ID"
    //           );
    //         });
    //       });
    //     });
    //   };

    //   describe("with data", function () {
    //     shouldTransferSafely(safeTransferFromWithData, data);
    //   });

    //   describe("without data", function () {
    //     shouldTransferSafely(safeTransferFromWithoutData, null);
    //   });

    //   describe("to a receiver contract returning unexpected value", function () {
    //     it("reverts", async function () {
    //       const invalidReceiver = await ERC721ReceiverMock.new(
    //         "0x42",
    //         Error.None
    //       );
    //       await expectRevert(
    //         this.token.safeTransferFrom(
    //           owner,
    //           invalidReceiver.address,
    //           tokenId,
    //           { from: owner }
    //         ),
    //         "ERC721: transfer to non ERC721Receiver implementer"
    //       );
    //     });
    //   });

    //   describe("to a receiver contract that reverts with message", function () {
    //     it("reverts", async function () {
    //       const revertingReceiver = await ERC721ReceiverMock.new(
    //         RECEIVER_MAGIC_VALUE,
    //         Error.RevertWithMessage
    //       );
    //       await expectRevert(
    //         this.token.safeTransferFrom(
    //           owner,
    //           revertingReceiver.address,
    //           tokenId,
    //           { from: owner }
    //         ),
    //         "ERC721ReceiverMock: reverting"
    //       );
    //     });
    //   });

    //   describe("to a receiver contract that reverts without message", function () {
    //     it("reverts", async function () {
    //       const revertingReceiver = await ERC721ReceiverMock.new(
    //         RECEIVER_MAGIC_VALUE,
    //         Error.RevertWithoutMessage
    //       );
    //       await expectRevert(
    //         this.token.safeTransferFrom(
    //           owner,
    //           revertingReceiver.address,
    //           tokenId,
    //           { from: owner }
    //         ),
    //         "ERC721: transfer to non ERC721Receiver implementer"
    //       );
    //     });
    //   });

    //   describe("to a receiver contract that panics", function () {
    //     it("reverts", async function () {
    //       const revertingReceiver = await ERC721ReceiverMock.new(
    //         RECEIVER_MAGIC_VALUE,
    //         Error.Panic
    //       );
    //       await expectRevert.unspecified(
    //         this.token.safeTransferFrom(
    //           owner,
    //           revertingReceiver.address,
    //           tokenId,
    //           { from: owner }
    //         )
    //       );
    //     });
    //   });

    //   describe("to a contract that does not implement the required function", function () {
    //     it("reverts", async function () {
    //       const nonReceiver = this.token;
    //       await expectRevert(
    //         this.token.safeTransferFrom(owner, nonReceiver.address, tokenId, {
    //           from: owner,
    //         }),
    //         "ERC721: transfer to non ERC721Receiver implementer"
    //       );
    //     });
    //   });
    // });
  });
});
