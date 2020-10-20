const GeoWebParcel = artifacts.require("GeoWebParcel");

const BN = require('bn.js');

contract("GeoWebParcel", async accounts => {
    it("should mint parcel of a single coordinate", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(4, 33) -> Index(0, 2), Local(4, 1)
        let coord = (new BN(4)).shln(32).or(new BN(33))

        await GW.mintLandParcel(coord, [new BN(0)])

        let result = await GW.availabilityIndex(0, 2)

        assert.equal(
            result.toString(2),
            (new BN(1).shln(20)).toString(2),
            "Incorrect availability"
        )
    })

    it("should mint parcel within one word", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(4, 17) -> Index(0, 1), Local(4, 1)
        let coord = (new BN(4)).shln(32).or(new BN(17))

        // North, North, West
        await GW.mintLandParcel(coord, [(new BN(3)).shln(256-8).or(new BN('110000', 2))])

        let result = await GW.availabilityIndex(0, 1)

        assert.equal(
            result.toString(2),
            (new BN(1).shln(20)).or(new BN(1).shln(36)).or(new BN(1).shln(52)).or(new BN(1).shln(51)).toString(2),
            "Incorrect availability"
        )
    })

    it("should mint parcel that spans multiple words", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(15, 1) -> Index(0, 0), Local(15, 1)
        let coord = (new BN(15)).shln(32).or(new BN(1))

        // East, North
        // East -> Index(1, 0), Local(0, 1)
        await GW.mintLandParcel(coord, [(new BN(2)).shln(256-8).or(new BN('0010', 2))])

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
    })

    it("should mint parcel with a long path", async () => {
        let GW = await GeoWebParcel.deployed()

        // Global(511, 0) -> Index(31, 0), Local(15, 0)
        let coord = (new BN(511)).shln(32).or(new BN(0))

        // West 124 times
        let path1 = (new BN(124)).shln(256-8).or(new BN(2).shln(248-1).sub(new BN(1)))
        // West 3 times
        let path2 = (new BN(3)).shln(256-8).or(new BN('111111', 2))
        await GW.mintLandParcel(coord, [path1, path2])

        for (let i = 0; i < (128/16); i++) {
            let result = await GW.availabilityIndex(31-i, 0)
            
            assert.equal(
                result.toString(2),
                (new BN(2).shln(15).sub(new BN(1))).toString(2),
                "Incorrect availability for " + i
            )
        }
    })

    it("should mint parcel that crosses the meridian", async () => {
    })

    it("should not mint parcel that goes too far north", async () => {
    })

    it("should not mint parcel that goes too far south", async () => {
    })

    it("should not mint parcel that repeats coordinates", async () => {
    })

    it("should not mint parcel with invalid base coordinate", async () => {
    })

    it("should not mint parcel if caller is not minter", async () => {
    })
})