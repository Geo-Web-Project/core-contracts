// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ILicenseValidator.sol";

/// @title A smart contract that stores accounting information for an always-for-sale license.
contract Accountant is AccessControl {
    bytes32 public constant MODIFY_CONTRIBUTION_ROLE =
        keccak256("MODIFY_CONTRIBUTION_ROLE");

    /// @notice The numerator of the network-wide per second contribution fee.
    uint256 public perSecondFeeNumerator;
    /// @notice The denominator of the network-wide per second contribution fee.
    uint256 public perSecondFeeDenominator;

    /// @notice Stores the contribution rate for each license.
    mapping(uint256 => uint256) public contributionRates;

    /// @notice Where to find if a license's account is still valid.
    ILicenseValidator public validator;

    /// @notice Emitted when a contribution rate is updated
    event ContributionRateUpdated(uint256 indexed id, uint256 newRate);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyRole(bytes32 role) {
        require(
            hasRole(role, _msgSender()),
            "AccessControl: account is missing role"
        );
        _;
    }

    /**
     * @notice Admin can update the global contribution fee.
     * @param _perSecondFeeNumerator The numerator of the network-wide per second contribution fee
     * @param _perSecondFeeDenominator The denominator of the network-wide per second contribution fee
     */
    function setPerSecondFee(
        uint256 _perSecondFeeNumerator,
        uint256 _perSecondFeeDenominator
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        perSecondFeeNumerator = _perSecondFeeNumerator;
        perSecondFeeDenominator = _perSecondFeeDenominator;
    }

    /**
     * @notice Admin can update the validator.
     * @param _validator The new validator address
     */
    function setValidator(address _validator)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        validator = ILicenseValidator(_validator);
    }

    /**
     * @notice Update contribution rate for a license with permissions.
     * @param id The id of the license to update
     * @param newRate The new per second contribution rate for the license
     */
    function setContributionRate(uint256 id, uint256 newRate)
        external
        onlyRole(MODIFY_CONTRIBUTION_ROLE)
    {
        contributionRates[id] = newRate;

        emit ContributionRateUpdated(id, newRate);
    }

    /**
     * @notice Check if a license is valid.
     * @param id The id of the license
     * @return If the license is valid
     */
    function isValid(uint256 id) external view returns (bool) {
        return validator.isValid(id);
    }
}
