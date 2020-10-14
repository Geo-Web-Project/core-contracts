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
});