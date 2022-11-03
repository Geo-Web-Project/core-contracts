{
  description = "A basic flake with a shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.echidna.url = "github:crytic/echidna";

  outputs = { self, nixpkgs, flake-utils, echidna }:
    flake-utils.lib.eachDefaultSystem (system: 
      let pkgs = import nixpkgs {
        overlays = [ (final: prev: {
              nodejs = prev.nodejs-14_x;
        }) ];
        inherit system;
      };
    in {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.yarn pkgs.nodejs-14_x ];
        buildInputs = [ ];
      };
    });
}
