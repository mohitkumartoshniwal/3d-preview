import { build, context } from "esbuild";

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outdir: "./out",
  external: ["vscode"],
};

/** @type {import('esbuild').BuildOptions} */
const appConfig = {
  ...baseConfig,
  target: "es2020",
  format: "esm",
  // entryPoints: ["./src/app/main.js"],
  entryPoints: ["./src/app/main.mts"],
  outdir: "./out/app",
  platform: "browser",
};

try {
  if (process.argv.includes("--watch")) {
    console.log("[watch] build started");

    await (await context(extensionConfig)).watch();
    await (await context(appConfig)).watch();

    console.log("[watch] build finished");
  } else {
    await build(extensionConfig);
    await build(appConfig);
  }
} catch (error) {
  if (error) {
    error.errors?.forEach((error) =>
      console.error(
        `> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`
      )
    ) || console.log(error);
  }

  process.stderr.write(error.stderr);
  process.exit(1);
}
