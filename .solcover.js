module.exports = {
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
    enableTimeouts: false,
  },
  configureYulOptimizer: true,
  skipFiles: [
    "registry/facets/GeoWebParcelFacet.test.sol",
    "registry/facets/PCOLicenseClaimerFacet.test.sol",
    "registry/facets/PCOLicenseParamsFacet.test.sol",
    "pco-license/facets/CFABasePCOFacet.test.sol",
  ],
};
