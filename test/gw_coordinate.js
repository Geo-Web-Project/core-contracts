const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");
const GeoWebCoordinatePath = artifacts.require("GeoWebCoordinatePath");

const BN = require('bn.js');

contract("GeoWebCoordinate", async accounts => {
    it("should parse direction from path", async () => {
        let gwCoor = await GeoWebCoordinatePath.deployed();

        let path = (new BN(2)).shln(256-8).or(new BN('1110', 2))

        let result = await gwCoor.nextDirection(path)

        assert.equal(
            result.direction.toString(2),
            new BN('10', 2).toString(2),
            "Direction is not correct"
        )
        
        assert.equal(
            result.nextPath.toString(2),
            (new BN(1)).shln(256-8).or(new BN('11', 2)).toString(2),
            "Next path is not correct"
        )
    });

    it("should traverse north", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('00', 2))

        let result = await gwCoor.traverse(new BN('0', 2), direction)

        assert.equal(
            result.toString(2),
            new BN('1', 2).toString(2),
            "Destination is not correct"
        )
    });

    it("should traverse south", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('01', 2))

        let result = await gwCoor.traverse(new BN('1', 2), direction)

        assert.equal(
            result.toString(2),
            new BN('0', 2).toString(2),
            "Destination is not correct"
        )
    });

    it("should traverse east", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('10', 2))

        let result = await gwCoor.traverse(new BN('0', 2), direction)

        assert.equal(
            result.toString(2),
            new BN('1', 2).shln(32).toString(2),
            "Destination is not correct"
        )
    });

    it("should traverse west", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('11', 2))

        let result = await gwCoor.traverse(new BN('1', 2).shln(32), direction)

        assert.equal(
            result.toString(2),
            new BN('0', 2).toString(2),
            "Destination is not correct"
        )
    });

    it("should not traverse too far north", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('00', 2))

        try {
            await gwCoor.traverse(new BN((2**23)-1), direction)
        } catch (error) {
            assert(error, "Expected an error but did not get one");
        }
    });

    it("should not traverse too far south", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('01', 2))

        try {
            await gwCoor.traverse(new BN(0), direction)
        } catch (error) {
            assert(error, "Expected an error but did not get one");
        }
    });

    it("should traverse east -> west", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('10', 2))

        let result = await gwCoor.traverse(new BN((2**24)-1).shln(32), direction)

        assert.equal(
            result.toString(2),
            new BN('0', 2).toString(2),
            "Destination is not correct"
        )
    });

    it("should traverse west -> east", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('11', 2))

        let result = await gwCoor.traverse(new BN(0), direction)

        assert.equal(
            result.toString(2),
            new BN((2**24)-1).shln(32).toString(2),
            "Destination is not correct"
        )
    });

    it("should convert to a word index", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

         // Global(4, 33) -> Index(0, 2), Local(4, 1)
        let coord = (new BN(4)).shln(32).or(new BN(33))

        let result = await gwCoor.toWordIndex(coord)

        assert.equal(
            result.i_x.toString(2),
            new BN(0).toString(2),
            "X coord is incorrect"
        )

        assert.equal(
            result.i_y.toString(2),
            new BN(2).toString(2),
            "Y coord is incorrect"
        )

        assert.equal(
            result.i.toString(2),
            new BN(20).toString(2),
            "Index is incorrect"
        )
    });
});