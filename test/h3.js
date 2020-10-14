const H3 = artifacts.require("H3");
const BN = require('bn.js');

contract("H3", async accounts => {
    it("should parse direction from path", async () => {
        let h3 = await H3.deployed();

        let path = (new BN('10111100', 2)).shln(256-8)

        let result = await h3.nextDirection(path)

        assert.equal(
            result.direction.toString(2),
            new BN('101', 2).toString(2),
            "Direction is not correct"
        )
        
        assert.equal(
            result.nextPath.toString(2),
            new BN('111', 2).shln(256-3).toString(2),
            "Next path is not correct"
        )
    });

    it("should parse resolution from index", async () => {
        let h3 = await H3.deployed();

        let index = new BN('8b0800000000fff', 16)

        let result = await h3.getResolution(index)

        assert.equal(
            result,
            11,
            "Resolution is not correct"
        )
    });

    it("should parse base cell from index", async () => {
        let h3 = await H3.deployed();

        let index = new BN('8b0800000000fff', 16)

        let result = await h3.getBaseCell(index)

        assert.equal(
            result,
            4,
            "Base cell is not correct"
        )
    });

    it("should edit base cell in index", async () => {
        let h3 = await H3.deployed();

        let index = new BN('8b0800000000fff', 16)

        let newIndex = await h3.withBaseCell(index, 5)

        let result = await h3.getBaseCell(newIndex)

        assert.equal(
            result,
            5,
            "Base cell is not correct"
        )
    });

    it("should get index digit", async () => {
        let h3 = await H3.deployed();

        let index = new BN('8bea00000000fff', 16)

        let result = await h3.getIndexDigit(index, 13)

        assert.equal(
            result,
            7,
            "Index digit is not correct"
        )
    });

    it("should edit index digit", async () => {
        let h3 = await H3.deployed();

        let index = new BN('8bea00000000fff', 16)

        let newIndex = await h3.withIndexDigit(index, 13, 3)

        let result = await h3.getIndexDigit(newIndex, 13)

        assert.equal(
            result,
            3,
            "Index digit is not correct"
        )
    });
});