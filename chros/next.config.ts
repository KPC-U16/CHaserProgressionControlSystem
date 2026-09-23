import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // monorepo のルートを基点にトレースさせる（chros/ 配下だけを見ると workspace 依存を取り逃がす）
  outputFileTracingRoot: path.join(__dirname, ".."),
  // packages/* はビルド済み JS を持たず TS ソースを直接公開しているため、Next 側で変換する
  transpilePackages: ["@chros/shared", "@chros/scoring"],
};

export default nextConfig;
