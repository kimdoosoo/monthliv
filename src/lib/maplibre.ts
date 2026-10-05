/**
 * MapLibre, loaded in the browser from /vendor/maplibre-gl.js (copied there by
 * scripts/vendor.mjs) the first time a map needs it. Only types come from the package here, so
 * the library stays out of the server bundle.
 */
import type MapLibreModule from "maplibre-gl";

export type MapLibre = typeof MapLibreModule;

let loading: Promise<MapLibre> | null = null;

export function loadMapLibre(): Promise<MapLibre> {
  const scope = window as unknown as { maplibregl?: MapLibre };
  if (scope.maplibregl) return Promise.resolve(scope.maplibregl);
  loading ??= new Promise<MapLibre>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/maplibre-gl.js";
    script.async = true;
    script.onload = () => (scope.maplibregl ? resolve(scope.maplibregl) : reject(new Error("MapLibre did not start")));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("MapLibre could not be loaded"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
