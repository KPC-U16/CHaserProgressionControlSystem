{
  description = "CHroS (CHaserProgressionControlSystem) 開発環境";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      # x86_64-darwin (Intel Mac) は nixpkgs 26.11 以降サポート対象外のため含めない
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (
        pkgs:
        let
          nodejs = pkgs.nodejs_22; # package.json engines: node >= 22 / Dockerfile: node:22-slim
          pnpm = pkgs.callPackage ./nix/pnpm.nix { inherit nodejs; };
        in
        {
          default = pkgs.mkShell {
            name = "chros";
            packages = [
              nodejs
              pnpm
              pkgs.postgresql_17 # psql / pg_isready（docker-compose.yaml の db と同じメジャー）
              pkgs.openssl # Prisma query engine が参照する
            ];
          };
        }
      );

      packages = forAllSystems (pkgs: {
        pnpm = pkgs.callPackage ./nix/pnpm.nix { nodejs = pkgs.nodejs_22; };
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt-tree);
    };
}
