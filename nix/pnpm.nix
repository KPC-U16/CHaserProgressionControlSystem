# package.json の packageManager フィールドと同じ pnpm を固定で提供する。
# nixpkgs の pnpm は 10.x 系のため、バージョンを揃える目的で npm registry から取得する。
# 更新手順:
#   1. package.json の packageManager を書き換える
#   2. version を同じ値にする
#   3. nix store prefetch-file https://registry.npmjs.org/pnpm/-/pnpm-<version>.tgz
{
  lib,
  stdenvNoCC,
  fetchurl,
  makeBinaryWrapper,
  nodejs,
}:

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "pnpm";
  version = "9.12.0";

  src = fetchurl {
    url = "https://registry.npmjs.org/pnpm/-/pnpm-${finalAttrs.version}.tgz";
    hash = "sha256-phtn/2zJevhkVk9EQlVsIqBPLlp3FPvudqEBE2HZtyY=";
  };

  nativeBuildInputs = [ makeBinaryWrapper ];

  dontBuild = true;

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/lib/pnpm"
    cp -r . "$out/lib/pnpm"

    for cmd in pnpm pnpx; do
      makeBinaryWrapper ${lib.getExe nodejs} "$out/bin/$cmd" \
        --add-flags "$out/lib/pnpm/bin/$cmd.cjs"
    done

    runHook postInstall
  '';

  meta = {
    description = "Fast, disk space efficient package manager (${finalAttrs.version} pinned for this repo)";
    homepage = "https://pnpm.io";
    license = lib.licenses.mit;
    mainProgram = "pnpm";
  };
})
