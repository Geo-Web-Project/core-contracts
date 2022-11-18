module.exports = {
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
    enableTimeouts: false,
  },
  configureYulOptimizer: true,
  skipFiles: [
    "registry/facets/test/GeoWebParcelFacet.test.sol",
    "registry/facets/test/GeoWebParcelFacetV2.test.sol",
    "registry/facets/test/PCOERC721Facet.test.sol",
    "registry/facets/test/PCOLicenseClaimerFacet.test.sol",
    "registry/facets/test/PCOLicenseClaimerFacetV2.test.sol",
    "registry/facets/test/PCOLicenseParamsFacet.test.sol",
    "pco-license/facets/test/CFABasePCOFacet.test.sol",
    "beneficiary/test/BeneficiarySuperApp.test.sol",
  ],
};
