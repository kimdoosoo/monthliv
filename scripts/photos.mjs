// Turns a place's original photos into the sizes the site uses.
//
//   node scripts/photos.mjs <listing-id> <photo> [<photo> …]
//
// Photos are numbered in the order given (01, 02, …; the first is the cover) and saved as WebP,
// 640, 1280 and 1920 px wide, in public/photos/<listing-id>/. Camera data (date, camera model,
// GPS position) is left out, so a photo never gives away the exact address.
// Then list the photos on the listing in src/data/listings.ts, with a description for each.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const widths = [640, 1280, 1920];
const [id, ...files] = process.argv.slice(2);

if (!id || files.length === 0) {
  console.error("Usage: node scripts/photos.mjs <listing-id> <photo> [<photo> …]");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(id)) {
  console.error(`"${id}" is not a listing id (lowercase letters, numbers and hyphens).`);
  process.exit(1);
}

const out = path.join("public", "photos", id);
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

for (const [index, file] of files.entries()) {
  const name = String(index + 1).padStart(2, "0");
  let size = "";
  for (const width of widths) {
    // rotate() turns the photo the way the camera held it; sharp writes no metadata by default.
    const info = await sharp(file)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 76, effort: 6 })
      .toFile(path.join(out, `${name}-${width}.webp`));
    size = `${info.width}×${info.height}`;
  }
  console.log(`${name}  ${path.basename(file)}  →  ${out}/${name}-{${widths.join(",")}}.webp  (${size})`);
}
