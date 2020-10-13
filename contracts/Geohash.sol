pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

library Geohash {
    using SafeMath for uint8;
    using SafeMath for uint32;

    function deinterleave(uint64 geohash)
        public
        pure
        returns (uint32 lat, uint32 lon)
    {
        uint8[16] memory boost_lon = [
            uint8(0),
            0,
            1,
            1,
            0,
            0,
            1,
            1,
            2,
            2,
            3,
            3,
            2,
            2,
            3,
            3
        ];

        uint8[16] memory boost_lat = [
            uint8(0),
            1,
            0,
            1,
            2,
            3,
            2,
            3,
            0,
            1,
            0,
            1,
            2,
            3,
            2,
            3
        ];

        lat = 0;
        lon = 0;

        for (uint8 i = 0; i < 16; i++) {
            uint64 p = geohash >> uint8(60).sub(uint8(i.mul(4)).mod(16));

            lon = uint32((lon << 2).add(boost_lon[p]));
            lat = uint32((lat << 2).add(boost_lat[p]));
        }

        return (lat, lon);
    }
}
