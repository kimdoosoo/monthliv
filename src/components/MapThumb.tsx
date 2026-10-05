"use client";

import { useEffect, useRef, useState } from "react";
import { loadMapLibre } from "@/lib/maplibre";
import { restyle, styleUrl } from "./mapStyle";

/**
 * A small, still map of a neighbourhood with a moon dot in the middle (home page cards).
 * When the card comes near the screen, the open map draws once off to the side, the drawing is
 * kept as a picture and the map is closed again, so a page of thumbnails holds no live maps.
 * Without WebGL the card keeps its sand background and the dot.
 */
export function MapThumb({ lat, lng, zoom = 14.2 }: { lat: number; lng: number; zoom?: number }) {
  const box = useRef<HTMLSpanElement>(null);
  const [picture, setPicture] = useState<string | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    let done = false;
    let cleanup = () => {};

    async function draw() {
      if (!element) return;
      const { width, height } = element.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      let maplibregl;
      try {
        maplibregl = await loadMapLibre();
      } catch {
        return;
      }
      if (done) return;
      const holder = document.createElement("div");
      holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${Math.round(width)}px;height:${Math.round(height)}px;`;
      document.body.appendChild(holder);
      let map: import("maplibre-gl").Map;
      try {
        map = new maplibregl.Map({
          container: holder,
          style: styleUrl,
          center: [lng, lat],
          zoom,
          interactive: false,
          attributionControl: false,
          fadeDuration: 0,
          canvasContextAttributes: { preserveDrawingBuffer: true },
        });
      } catch {
        holder.remove();
        return;
      }
      const close = () => {
        map.remove();
        holder.remove();
      };
      cleanup = close;
      map.on("style.load", () => {
        try {
          restyle(map, "ko");
          // A thumbnail shows streets, parks and water only.
          for (const layer of map.getStyle().layers) {
            if (layer.type === "symbol" || layer.id === "lv-stations-dot") {
              map.setLayoutProperty(layer.id, "visibility", "none");
            }
          }
        } catch {
          // The style's own colours are fine too.
        }
      });
      map.once("idle", () => {
        if (!done) {
          try {
            setPicture(map.getCanvas().toDataURL("image/png"));
          } catch {
            // Leave the plain background.
          }
        }
        close();
        cleanup = () => {};
      });
      map.on("error", () => {
        close();
        cleanup = () => {};
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void draw();
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => {
      done = true;
      observer.disconnect();
      cleanup();
    };
  }, [lat, lng, zoom]);

  return (
    <span ref={box} className="lv-mapthumb">
      {picture && (
        // A drawn map, kept as a picture; the card's text says which neighbourhood it is.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lv-mapthumb__img" src={picture} alt="" />
      )}
      <span className="lv-mapthumb__dot" aria-hidden="true" />
      {picture && <span className="lv-mapthumb__credit">© OpenStreetMap</span>}
    </span>
  );
}
