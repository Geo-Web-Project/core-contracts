const GeoWebCoordinate = artifacts.require("GeoWebCoordinate");
const GeoWebCoordinatePath = artifacts.require("GeoWebCoordinatePath");

const BN = require('bn.js');

contract("GeoWebCoordinate", async accounts => {

    function makeCoord(x, y) {
        return new BN(x).shln(32).or(new BN(y))
    }

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

        let result = await gwCoor.traverse(makeCoord(0, 0), direction, new BN(0), new BN(0), new BN(0))

        assert.equal(
            result.destination.toString(2),
            new BN('1', 2).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "16",
            "I is not correct"
        )
    });

    it("should traverse south", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('01', 2))

        let result = await gwCoor.traverse(makeCoord(0, 1), direction, new BN(0), new BN(0), new BN(16))

        assert.equal(
            result.destination.toString(2),
            new BN('0', 2).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "0",
            "I is not correct"
        )
    });

    it("should traverse east", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('10', 2))

        let result = await gwCoor.traverse(makeCoord(0, 0), direction, new BN(0), new BN(0), new BN(0))

        assert.equal(
            result.destination.toString(2),
            new BN('1', 2).shln(32).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "1",
            "I is not correct"
        )
    });

    it("should traverse west", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('11', 2))

        let result = await gwCoor.traverse(makeCoord(1, 0), direction, new BN(0), new BN(0), new BN(1))

        assert.equal(
            result.destination.toString(2),
            new BN('0', 2).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "0",
            "I is not correct"
        )
    });

    it("should traverse north into new word", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('00', 2))

        let result = await gwCoor.traverse(makeCoord(8, 15), direction, new BN(0), new BN(0), new BN(248))

        assert.equal(
            result.destination.toString(2),
            makeCoord(8, 16).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "1",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "8",
            "I is not correct"
        )
    });

    it("should traverse south into new word", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('01', 2))

        let result = await gwCoor.traverse(makeCoord(8, 16), direction, new BN(0), new BN(1), new BN(8))

        assert.equal(
            result.destination.toString(2),
            makeCoord(8, 15).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "248",
            "I is not correct"
        )
    });

    it("should traverse east into new word", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('10', 2))

        let result = await gwCoor.traverse(makeCoord(15, 8), direction, new BN(0), new BN(0), new BN(143))

        assert.equal(
            result.destination.toString(2),
            makeCoord(16, 8).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "1",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "128",
            "I is not correct"
        )
    });

    it("should traverse west into new word", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('11', 2))

        let result = await gwCoor.traverse(makeCoord(16, 8), direction, new BN(1), new BN(0), new BN(128))

        assert.equal(
            result.destination.toString(2),
            makeCoord(15, 8).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "143",
            "I is not correct"
        )
    });

    it("should not traverse too far north", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('00', 2))

        var err
        try {
            await gwCoor.traverse(makeCoord(0, (2**23)-1), direction, new BN(0), new BN(((2**23)-1)/16), new BN(240))
        } catch (error) {
            err = error
        }

        assert(err, "Expected an error but did not get one");
    });

    it("should not traverse too far south", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('01', 2))

        var err
        try {
            await gwCoor.traverse(makeCoord(0, 0), direction, new BN(0), new BN(0), new BN(0))
        } catch (error) {
            err = error
        }

        assert(err, "Expected an error but did not get one");
    });

    it("should traverse meridian east -> west", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('10', 2))

        let result = await gwCoor.traverse(makeCoord((2**24)-1, 0), direction, new BN(((2**24)-1)/16), new BN(0), new BN(15))

        assert.equal(
            result.destination.toString(2),
            makeCoord(0, 0).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(10),
            "0",
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "0",
            "I is not correct"
        )
    });

    it("should traverse meridian west -> east", async () => {
        let gwCoor = await GeoWebCoordinate.deployed();

        let direction = (new BN('11', 2))

        let result = await gwCoor.traverse(makeCoord(0, 0), direction, new BN(0), new BN(0), new BN(0))

        assert.equal(
            result.destination.toString(2),
            makeCoord((2**24)-1, 0).toString(2),
            "Destination is not correct"
        )

        assert.equal(
            result.i_x.toString(2),
            new BN(((2**24)-1)/16).toString(2),
            "X is not correct"
        )

        assert.equal(
            result.i_y.toString(10),
            "0",
            "Y is not correct"
        )

        assert.equal(
            result.i.toString(10),
            "15",
            "I is not correct"
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