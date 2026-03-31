import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  CLIENT_PORT: z.coerce.number().default(5173),
  SERVER_PORT: z.coerce.number().default(3001),
  SESSION_SECRET: z.string().min(8),
  DATA_FILE: z.string().min(1).default("./data/app.json")
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
