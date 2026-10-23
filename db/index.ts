import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is unavailable. Configure it in Vercel or .env.local.");
  return drizzle(postgres(url, { prepare: false, max: 1 }), { schema });
}
