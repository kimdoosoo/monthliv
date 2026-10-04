// Cloudflare adapter settings (https://opennext.js.org/cloudflare).
// Every page is built ahead of time for now, so the cache is read-only and lives with the
// static files: no extra Cloudflare storage to set up. Switch to the R2 cache when pages
// need to refresh on their own (e.g. listings from the database).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
