#!/usr/bin/env node
/**
 * Starts api/serve.py so PYTHON_PATH works cross-platform without relying on shell defaults.
 *
 * Loads .env.local / .env the same way `next dev` does. Without this, the Python process would
 * not see API keys only defined in those files.
 */
import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

nextEnv.loadEnvConfig(root, true);

const python = process.env.PYTHON_PATH?.trim() || "python3";
const serve = path.join(root, "api", "serve.py");

const child = spawn(python, [serve], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
