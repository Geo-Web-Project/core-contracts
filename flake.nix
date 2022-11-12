{
  description = "A basic flake with a shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-22.05-darwin";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: 
      let pkgs = import nixpkgs {
        overlays = [ (final: prev: {
              nodejs = prev.nodejs-14_x;
        }) ];
        inherit system;
      };
    in {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.yarn pkgs.nodejs-14_x pkgs.python310Packages.crytic-compile pkgs.solc-select pkgs.slither-analyzer ];
        buildInputs = [ ];
      };
    });
}
