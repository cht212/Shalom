import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL. Crea .env.local en la raíz antes de ejecutar db:push.");
}

const command = process.platform === "win32" ? "node.exe" : "node";
const result = spawnSync(command, ["./node_modules/drizzle-kit/bin.cjs", "push"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
