// Copies browser-only libraries into public/vendor/ before a build or dev server starts.
// MapLibre is loaded in the browser from there (src/lib/maplibre.ts) instead of being bundled:
// bundled, it also lands in the server's code, and the Cloudflare Worker has a size limit.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "public", "vendor");
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(
  path.join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl.js"),
  path.join(target, "maplibre-gl.js"),
);
console.log("vendor: public/vendor/maplibre-gl.js");
