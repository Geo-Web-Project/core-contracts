// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./BeneficiarySuperApp.sol";
import "../registry/interfaces/IPCOLicenseParamsStore.sol";
import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) payable ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}

contract MockParamsStore is IPCOLicenseParamsStore {
    ERC20Mock private mockERC20 = new ERC20Mock("ETHx", "ETHx", 0, 0);

    /// @notice Payment token
    function getPaymentToken() external view returns (ISuperToken) {
        return ISuperToken(address(mockERC20));
    }
}

contract FuzzyBeneficiarySuperApp {
    BeneficiarySuperApp private app;

    constructor() {
        app = new BeneficiarySuperApp();
        app.initialize(new MockParamsStore(), address(0x2));
    }

    // solhint-disable-next-line func-name-mixedcase
    function echidna_beneficiary_never_changes() public view returns (bool) {
        return app.getBeneficiary() == address(0x2);
    }
}
