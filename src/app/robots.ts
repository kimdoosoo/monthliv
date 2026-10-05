import type { MetadataRoute } from "next";

// Search engines stay out until launch (the first build shows sample places).
// Set NEXT_PUBLIC_ALLOW_INDEXING=true when real listings are live.
export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    // Signed-in screens: My page, the host centre (not the public /host page) and the admin.
    rules: { userAgent: "*", allow: "/", disallow: ["/*/account", "/*/language", "/*/host/", "/*/admin", "/*/my-stays", "/*/messages", "/*/saved"] },
    host: site,
  };
}
