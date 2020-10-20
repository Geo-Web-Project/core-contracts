const GeoWebParcel = artifacts.require("GeoWebParcel");

const BN = require('bn.js');

contract("GeoWebParcel", async accounts => {

    function makePathPrefix(length) {
        return new BN(length).shln(256-8)
    }

    it("should mint parcel of a single coordinate", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(4, 33) -> Index(0, 2), Local(4, 1)
        let coord = (new BN(4)).shln(32).or(new BN(33))
        
        let mintResult = await GW.mintLandParcel(coord, [new BN(0)])

        let result = await GW.availabilityIndex(0, 2)

        assert.equal(
            result.toString(2),
            (new BN(1).shln(20)).toString(2),
            "Incorrect availability"
        )

        let parcel = await GW.getLandParcel(mintResult.logs[0].args._id)
        assert.equal(
            parcel.baseCoordinate.toString(2),
            coord.toString(2),
            "Stored base coordinate is incorrect"
        )
    })

    it("should mint parcel within one word", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(4, 17) -> Index(0, 1), Local(4, 1)
        let coord = (new BN(4)).shln(32).or(new BN(17))

        // North, North, West
        let mintResult = await GW.mintLandParcel(coord, [makePathPrefix(3).or(new BN('110000', 2))])

        let result = await GW.availabilityIndex(0, 1)

        assert.equal(
            result.toString(2),
            (new BN(1).shln(20)).or(new BN(1).shln(36)).or(new BN(1).shln(52)).or(new BN(1).shln(51)).toString(2),
            "Incorrect availability"
        )

        let parcel = await GW.getLandParcel(mintResult.logs[0].args._id)
        assert.equal(
            parcel.baseCoordinate.toString(2),
            coord.toString(2),
            "Stored base coordinate is incorrect"
        )
    })

    it("should mint parcel that spans multiple words", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(15, 1) -> Index(0, 0), Local(15, 1)
        let coord = (new BN(15)).shln(32).or(new BN(1))

        // East, North
        // East -> Index(1, 0), Local(0, 1)
        let mintResult = await GW.mintLandParcel(coord, [makePathPrefix(2).or(new BN('0010', 2))])

        let result0 = await GW.availabilityIndex(0, 0)
        let result1 = await GW.availabilityIndex(1, 0)

        assert.equal(
            result0.toString(2),
            new BN(1).shln(31).toString(2),
            "Incorrect availability for index 0"
        )

        assert.equal(
            result1.toString(2),
            new BN(1).shln(16).or(new BN(1).shln(32)).toString(2),
            "Incorrect availability for index 1"
        )

        let parcel = await GW.getLandParcel(mintResult.logs[0].args._id)
        assert.equal(
            parcel.baseCoordinate.toString(2),
            coord.toString(2),
            "Stored base coordinate is incorrect"
        )
    })

    it("should mint parcel with a long path", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(511, 0) -> Index(31, 0), Local(15, 0)
        let coord = (new BN(511)).shln(32).or(new BN(0))

        // West 124 times
        let path1 = makePathPrefix(124).or(new BN(2).shln(248-1).sub(new BN(1)))
        // West 3 times
        let path2 = makePathPrefix(3).or(new BN('111111', 2))
        let mintResult = await GW.mintLandParcel(coord, [path1, path2])

        for (let i = 0; i < (128/16); i++) {
            let result = await GW.availabilityIndex(31-i, 0)
            
            assert.equal(
                result.toString(2),
                (new BN(2).shln(15).sub(new BN(1))).toString(2),
                "Incorrect availability for " + i
            )
        }

        let parcel = await GW.getLandParcel(mintResult.logs[0].args._id)
        assert.equal(
            parcel.baseCoordinate.toString(2),
            coord.toString(2),
            "Stored base coordinate is incorrect"
        )
    })

    it("should mint parcel that crosses the meridian", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(0, 160) -> Index(0, 10), Local(0, 0)
        let coord = (new BN(0)).shln(32).or(new BN(160))

        // West -> Index(MAX/16, 10), Local(15, 0)
        let mintResult = await GW.mintLandParcel(coord, [makePathPrefix(1).or(new BN('11', 2))])

        let result0 = await GW.availabilityIndex(0, 10)
        let result1 = await GW.availabilityIndex(((2**24)/16)-1, 10)

        assert.equal(
            result0.toString(2),
            new BN(1).toString(2),
            "Incorrect availability for index 0"
        )

        assert.equal(
            result1.toString(2),
            new BN(1).shln(15).toString(2),
            "Incorrect availability for index 1"
        )

        let parcel = await GW.getLandParcel(mintResult.logs[0].args._id)
        assert.equal(
            parcel.baseCoordinate.toString(2),
            coord.toString(2),
            "Stored base coordinate is incorrect"
        )
    })

    it("should not mint parcel that goes too far north", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(16000, MAX) -> Index(1000, MAX/16), Local(0, 15)
        let coord = (new BN(16000)).shln(32).or(new BN((2**23) - 1))
        
        var err
        try {
            // North
            await GW.mintLandParcel(coord, [makePathPrefix(1).or(new BN('00', 2))])
        } catch (error) {
            err = error
        }

        assert(err, "Expected an error but did not get one");
    })

    it("should not mint parcel that goes too far south", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
        let coord = (new BN(16000)).shln(32).or(new BN(0))
        
        var err
        try {
            // South
            await GW.mintLandParcel(coord, [makePathPrefix(1).or(new BN('01', 2))])
        } catch (error) {
            err = error
        }

        assert(err, "Expected an error but did not get one");
    })

    it("should not mint parcel that repeats coordinates", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
        let coord = (new BN(16000)).shln(32).or(new BN(0))
        
        var err
        try {
            // West, East
            await GW.mintLandParcel(coord, [makePathPrefix(2).or(new BN('1011', 2))])
        } catch (error) {
            err = error
        }

        assert(err, "Expected an error but did not get one");
    })

    it("should not mint parcel if caller is not minter", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(16000, 0) -> Index(1000, 0), Local(0, 0)
        let coord = (new BN(16000)).shln(32).or(new BN(0))
        
        var err
        try {
            // North
            await GW.mintLandParcel(coord, [makePathPrefix(1).or(new BN('00', 2))], {from: accounts[1]})
        } catch (error) {
            err = error
        }

        assert(err, "Expected an error but did not get one");
    })
})