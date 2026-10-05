/**
 * The open map's look, shared by the full map (OpenMap) and the small maps on the home page
 * (MapThumb): OpenFreeMap's Positron style (https://openfreemap.org, OpenStreetMap data, no key)
 * recoloured to MONTHLIV's palette, with labels in the page's language and subway stations.
 */
import type { ExpressionSpecification, FilterSpecification, Map as MapLibreMap } from "maplibre-gl";

export const styleUrl = "https://tiles.openfreemap.org/styles/positron";

// The Positron style, recoloured to MONTHLIV's warm palette: a light beige ground, white
// streets with a beige edge, soft green parks and grey-blue water.
const palette: Record<string, Record<string, string>> = {
  background: { "background-color": "#f6eee7" },
  park: { "fill-color": "#dfe6d4" },
  landcover_wood: { "fill-color": "#d8e1cd" },
  landcover_grass: { "fill-color": "#e2e8d8" },
  water: { "fill-color": "#cfdde0" },
  waterway: { "line-color": "#c2d3d7" },
  landuse_residential: { "fill-color": "#f2e7de" },
  building: { "fill-color": "#ecdfd5", "fill-outline-color": "#e2d1c4" },
  highway_major_casing: { "line-color": "#e5d5c9" },
  highway_motorway_casing: { "line-color": "#e5d5c9" },
  highway_major_inner: { "line-color": "#ffffff" },
  highway_motorway_inner: { "line-color": "#ffffff" },
  highway_minor: { "line-color": "#ffffff" },
  highway_path: { "line-color": "#fbf6f1" },
  highway_major_subtle: { "line-color": "#e8dace" },
  highway_motorway_subtle: { "line-color": "#e8dace" },
  highway_motorway_bridge_casing: { "line-color": "#e5d5c9" },
  highway_motorway_bridge_inner: { "line-color": "#ffffff" },
  tunnel_motorway_casing: { "line-color": "#e5d5c9" },
  tunnel_motorway_inner: { "line-color": "#f3e5db" },
  road_area_pier: { "fill-color": "#f6eee7" },
  road_pier: { "line-color": "#f6eee7" },
  railway: { "line-color": "#dccbbf" },
  railway_transit: { "line-color": "#dccbbf" },
  railway_service: { "line-color": "#dccbbf" },
};

const stationFilter: FilterSpecification = [
  "all",
  ["==", ["get", "class"], "railway"],
  ["in", ["get", "subclass"], ["literal", ["station", "subway", "halt"]]],
];

/** Place names in the page's language, falling back to the local (Korean) name. */
function labelField(locale: string): ExpressionSpecification {
  const keys =
    locale === "ko"
      ? ["name:ko", "name"]
      : locale.startsWith("zh")
        ? [locale === "zh-TW" ? "name:zh-Hant" : "name:zh-Hans", "name:zh", "name:en", "name:latin", "name"]
        : [`name:${locale}`, `name_${locale}`, "name:en", "name_en", "name:latin", "name"];
  return ["coalesce", ...keys.map((key): ExpressionSpecification => ["get", key])];
}

export function restyle(map: MapLibreMap, locale: string) {
  for (const [id, paint] of Object.entries(palette)) {
    if (!map.getLayer(id)) continue;
    for (const [property, value] of Object.entries(paint)) map.setPaintProperty(id, property, value);
  }

  const field = labelField(locale);
  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    const current = map.getLayoutProperty(layer.id, "text-field");
    // Road shields show route numbers; every other label is a name.
    if (current && JSON.stringify(current).includes("name")) {
      map.setLayoutProperty(layer.id, "text-field", field);
    }
  }

  // Subway and rail stations: the style leaves them out, and stays are found by station.
  if (map.getSource("openmaptiles") && !map.getLayer("lv-stations")) {
    map.addLayer({
      id: "lv-stations-dot",
      type: "circle",
      source: "openmaptiles",
      "source-layer": "poi",
      minzoom: 13,
      filter: stationFilter,
      paint: {
        "circle-radius": 4,
        "circle-color": "#1c1a17",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: "lv-stations",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "poi",
      minzoom: 13,
      filter: stationFilter,
      layout: {
        "text-field": field,
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.7],
        "text-optional": true,
      },
      paint: {
        "text-color": "#4b362c",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    });
  }
}
