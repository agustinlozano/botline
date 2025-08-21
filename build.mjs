import { build } from "esbuild";
import { readdir } from "fs/promises";
import { join } from "path";

async function buildLambda() {
  try {
    await build({
      entryPoints: ["src/handler.ts"],
      bundle: true,
      minify: true,
      platform: "node",
      target: "node20",
      outdir: "dist",
      format: "cjs",
      sourcemap: false,
      external: ["aws-sdk"],
      tsconfig: "tsconfig.json",
    });

    console.log("✅ Build completed successfully");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

buildLambda();
