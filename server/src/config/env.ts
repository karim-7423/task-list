import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  CLIENT_PORT: z.coerce.number().default(5173),
  SERVER_PORT: z.coerce.number().default(3001),
  SESSION_SECRET: z.string().min(8),
  DATA_FILE: z.string().min(1).default("./data/app.json"),
  APP_ORIGIN: z.string().url().optional(),
  DATABASE_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional()
  )
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
