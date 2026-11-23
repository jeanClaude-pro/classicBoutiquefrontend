// Runs before every build. On Netlify, refuses to build while netlify.toml
// still forwards /api to the placeholder address: the site would deploy
// without a working API.
import { readFileSync } from "node:fs";

if (process.env.NETLIFY === "true") {
  const config = readFileSync(new URL("../netlify.toml", import.meta.url), "utf8");
  if (config.includes("YOUR-API-HOST")) {
    console.error("netlify.toml: replace https://YOUR-API-HOST.onrender.com with your server's address in the /api/* redirect.");
    process.exit(1);
  }
}
