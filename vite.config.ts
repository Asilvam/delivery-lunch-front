import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));
const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

function readGit(args: string[]) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, root, "");
  const deployedCommit = process.env.CF_PAGES_COMMIT_SHA?.trim();
  const commit = deployedCommit || readGit(["rev-parse", "HEAD"]) || "local";
  const localBuild =
    command === "serve" ||
    commit === "local" ||
    (!deployedCommit && Boolean(readGit(["status", "--porcelain"])));

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/auth": {
          target:
            process.env.VITE_API_BASE_URL ||
            env.VITE_API_BASE_URL ||
            "http://localhost:3500",
          changeOrigin: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    define: {
      "import.meta.env.APP_VERSION": JSON.stringify(version),
      "import.meta.env.BUILD_COMMIT": JSON.stringify(commit),
      "import.meta.env.BUILD_LOCAL": JSON.stringify(localBuild),
    },
  };
});
