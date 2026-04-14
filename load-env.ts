/**
 * Must be imported first from server.ts so process.env is populated before
 * any module that touches Supabase (e.g. cron → notify → lib/supabase).
 */
import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

const root = process.cwd();
const envLocal = resolve(root, ".env.local");
const envFile = resolve(root, ".env");

if (existsSync(envLocal)) {
  config({ path: envLocal });
} else if (existsSync(envFile)) {
  config({ path: envFile });
}
