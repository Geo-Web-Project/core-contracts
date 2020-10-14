pragma solidity ^0.6.0;

library H3 {
    /** Hardcoding a resolution */
    uint64 constant STATIC_RESOLUTION = 11;

    uint64 constant MAX_H3_RES = 15;

    /** The bit offset of the base cell in an H3 index. */
    uint64 constant H3_BC_OFFSET = 45;

    /** The bit offset of the resolution in an H3 index. */
    uint64 constant H3_RES_OFFSET = 52;

    /** The number of bits in a single H3 resolution digit. */
    uint64 constant H3_PER_DIGIT_OFFSET = 3;

    /** 1's in the 7 base cell bits, 0's everywhere else. */
    uint64 constant H3_BC_MASK = uint64(127) << H3_BC_OFFSET;

    /** 1's in the 4 resolution bits, 0's everywhere else. */
    uint64 constant H3_RES_MASK = uint64(15) << H3_RES_OFFSET;

    /** 0's in the 7 base cell bits, 1's everywhere else. */
    uint64 constant H3_BC_MASK_NEGATIVE = ~H3_BC_MASK;

    /** 1's in the 3 bits of res 15 digit bits, 0's everywhere else. */
    uint64 constant H3_DIGIT_MASK = 7;

    function nextDirection(uint256 path)
        public
        pure
        returns (uint256 direction, uint256 nextPath)
    {
        direction = (path >> (256 - 3)); // Take first 3 bits of path
        nextPath = path << 3; // Trim direction from path
    }

    function traverse(uint64 origin, uint256 direction)
        public
        pure
        returns (uint64 destination)
    {
        destination = origin;
        uint64 oldBaseCell = getBaseCell(destination);

        uint64 r = getResolution(destination) - 1;
        require(
            r + 1 == STATIC_RESOLUTION,
            "Only the specific resolution is supported"
        );
    }

    function getResolution(uint64 h3Index) public pure returns (uint64) {
        return (h3Index & H3_RES_MASK) >> H3_RES_OFFSET;
    }

    function getBaseCell(uint64 h3Index) public pure returns (uint64) {
        return (h3Index & H3_BC_MASK) >> H3_BC_OFFSET;
    }

    function withBaseCell(uint64 h3Index, uint64 baseCell)
        public
        pure
        returns (uint64)
    {
        return (h3Index & H3_BC_MASK_NEGATIVE) | (baseCell << H3_BC_OFFSET);
    }

    function getIndexDigit(uint64 h3Index, uint64 res)
        public
        pure
        returns (uint256)
    {
        return
            (h3Index >> ((MAX_H3_RES - res) * H3_PER_DIGIT_OFFSET)) &
            H3_DIGIT_MASK;
    }

    function withIndexDigit(
        uint64 h3Index,
        uint64 res,
        uint64 digit
    ) public pure returns (uint64) {
        return
            (h3Index &
                ~(H3_DIGIT_MASK <<
                    ((MAX_H3_RES - res) * H3_PER_DIGIT_OFFSET))) |
            (digit << ((MAX_H3_RES - res) * H3_PER_DIGIT_OFFSET));
    }
}
