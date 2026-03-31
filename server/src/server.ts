import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const app = createApp();
const env = getEnv();

app.listen(env.SERVER_PORT, () => {
  console.log(`Server listening on http://localhost:${env.SERVER_PORT}`);
});
