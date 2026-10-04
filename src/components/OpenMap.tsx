"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap, MapOptions } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { House, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { loadMapLibre, type MapLibre } from "@/lib/maplibre";
import { restyle, styleUrl } from "./mapStyle";
import type { PricePin } from "./StayMap";

/** Labels for the map's own controls, translated on the page. */
export type MapText = {
  label: string;
  zoomIn: string;
  zoomOut: string;
  attribution: string;
  twoFingers: string;
  ctrlScroll: string;
  cmdScroll: string;
  unavailable: string;
};

export type OpenMapProps =
  | {
      mode: "results";
      pins: PricePin[];
      activeId?: string | null;
      /** The search page: the "search as I move" pill sits on the map, and the map starts below the fold. */
      searchPage?: boolean;
      locale: string;
      text: MapText;
    }
  | {
      mode: "place";
      lat: number;
      lng: number;
      locale: string;
      text: MapText;
    };

/**
 * OpenStreetMap vector map for when no Google Maps key is set: free, no key, served by
 * OpenFreeMap (https://openfreemap.org). Price pins are page elements placed on the map,
 * so they keep the site's type, colours and links.
 */

// Seoul City Hall, for a results map with nothing on it.
const seoul: [number, number] = [126.978, 37.5665];

/** A circle of `meters` around a point, as a polygon (the map shows an area, never a door). */
function circle(lng: number, lat: number, meters: number) {
  const steps = 64;
  const dLat = meters / 111_320;
  const dLng = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [ring] },
  };
}

function pinClass(pin: PricePin, on: boolean): string {
  return `lv-pin${pin.kind === "place" ? " lv-pin--place" : ""}${on ? " is-on" : ""}`;
}

/**
 * Puts an element on the map. MapLibre labels the wrapper "Map marker" with a button role;
 * ours only positions what is inside it (a link with its own name, or a picture).
 */
function addMarker(maplibregl: MapLibre, map: MapLibreMap, element: HTMLElement, lng: number, lat: number) {
  const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
  element.removeAttribute("role");
  element.removeAttribute("aria-label");
  return marker;
}

export default function OpenMap(props: OpenMapProps) {
  const box = useRef<HTMLDivElement>(null);
  // The map is made once, from the first props; pins and the active pin update it later.
  const first = useRef(props);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  // The library itself, once loaded (markers need it too).
  const lib = useRef<MapLibre | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = box.current;
    if (!container) return;
    const initial = first.current;
    // Only the search page's side map (wide screens, mouse) takes the plain scroll wheel and one
    // finger. Elsewhere the map sits in a page that scrolls, so those keep scrolling the page.
    const free =
      initial.mode === "results" &&
      initial.searchPage === true &&
      window.matchMedia("(min-width: 901px) and (pointer: fine)").matches;
    const options: MapOptions = {
      container,
      style: styleUrl,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      // A list can reach from Seoul to Jeju, so results may zoom out to the whole country.
      minZoom: initial.mode === "results" ? 5 : 9,
      maxZoom: 18,
      cooperativeGestures: !free,
      locale: {
        "Map.Title": initial.text.label,
        "NavigationControl.ZoomIn": initial.text.zoomIn,
        "NavigationControl.ZoomOut": initial.text.zoomOut,
        "AttributionControl.ToggleAttribution": initial.text.attribution,
        "CooperativeGesturesHandler.MobileHelpText": initial.text.twoFingers,
        "CooperativeGesturesHandler.WindowsHelpText": initial.text.ctrlScroll,
        "CooperativeGesturesHandler.MacHelpText": initial.text.cmdScroll,
      },
    };

    if (initial.mode === "place") {
      options.center = [initial.lng, initial.lat];
      options.zoom = 15;
    } else if (initial.pins.length > 0) {
      const lngs = initial.pins.map((pin) => pin.lng);
      const lats = initial.pins.map((pin) => pin.lat);
      const bounds: LngLatBoundsLike = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      // The search page's map is as tall as the screen but starts below the header and filters,
      // so at first its bottom is below the fold: fit the pins into the part that shows.
      const rect = container.getBoundingClientRect();
      const offscreen = initial.searchPage
        ? Math.max(0, Math.min(rect.height / 2, rect.bottom - window.innerHeight))
        : 0;
      // Pins are centred on their spot, so leave half a pin and some air on every side, plus
      // room for the "search as I move" pill at the top and the zoom buttons on the right.
      // Phone-sized maps keep less, so more pins have room to show their price.
      const small = rect.width < 480;
      const edge = small ? 40 : 48;
      options.bounds = bounds;
      options.fitBoundsOptions = {
        padding: {
          top: initial.searchPage ? 76 : edge,
          bottom: edge + offscreen,
          left: small ? 40 : 56,
          right: small ? 48 : 72,
        },
        maxZoom: 15,
      };
    } else {
      options.center = seoul;
      options.zoom = 11;
    }

    let instance: MapLibreMap | null = null;
    let cancelled = false;
    let styled = false;
    let removed = false;
    const remove = () => {
      if (removed || !instance) return;
      removed = true;
      instance.remove();
    };

    loadMapLibre()
      .then((maplibregl) => {
        if (cancelled) return;
        lib.current = maplibregl;
        let created: MapLibreMap;
        try {
          created = new maplibregl.Map(options);
        } catch {
          // No WebGL (switched off, or a very old device): show the message instead of the map.
          setFailed(true);
          return;
        }
        instance = created;
        created.touchZoomRotate.disableRotation();
        created.keyboard.disableRotation();
        // Top right: on the search page the bottom of the map starts below the fold.
        created.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        created.on("style.load", () => {
          styled = true;
          try {
            restyle(created, initial.locale);
          } catch {
            // The map still works in the style's own colours and labels.
          }
          setMap(created);
        });
        // Before the style has loaded, an error means the map can't be shown at all.
        created.on("error", () => {
          if (styled) return;
          setFailed(true);
          remove();
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      setMap(null);
      remove();
    };
  }, []);

  /* ---------- results: price pins ---------- */

  const pins = props.mode === "results" ? props.pins : null;
  const activeId = props.mode === "results" ? props.activeId : null;
  // One element per pin; React renders the pin into it and the map moves it.
  const holders = useMemo(
    () => new Map((pins ?? []).map((pin) => [pin.id, document.createElement("div")])),
    [pins],
  );

  useEffect(() => {
    if (!map || !pins) return;
    const markers = pins.flatMap((pin) => {
      const element = holders.get(pin.id);
      return element && lib.current ? [addMarker(lib.current, map, element, pin.lng, pin.lat)] : [];
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [map, pins, holders]);

  // A pin that would cover another shrinks to a dot until there is room (zoom in, or point at
  // it). The active pin goes first, then pins in list order, so the first results keep their price.
  const activeRef = useRef(activeId);
  const relayout = useRef(() => {});

  useEffect(() => {
    if (!map || !pins) return;
    const sizes = new Map<string, { width: number; height: number }>();
    let frame = 0;

    const layout = () => {
      frame = 0;
      // Measure pins at full size once (again after the web font arrives).
      const unmeasured = pins.filter((pin) => !sizes.has(pin.id));
      for (const pin of unmeasured) delete holders.get(pin.id)?.dataset.dot;
      for (const pin of unmeasured) {
        const element = holders.get(pin.id)?.firstElementChild;
        if (element instanceof HTMLElement && element.offsetWidth > 0) {
          sizes.set(pin.id, { width: element.offsetWidth, height: element.offsetHeight });
        }
      }

      const active = activeRef.current;
      const order = active
        ? [...pins.filter((pin) => pin.id === active), ...pins.filter((pin) => pin.id !== active)]
        : pins;
      const taken: { left: number; top: number; right: number; bottom: number }[] = [];
      for (const pin of order) {
        const holder = holders.get(pin.id);
        const size = sizes.get(pin.id);
        if (!holder || !size) continue;
        const point = map.project([pin.lng, pin.lat]);
        const box = {
          left: point.x - size.width / 2 - 2,
          top: point.y - size.height / 2 - 2,
          right: point.x + size.width / 2 + 2,
          bottom: point.y + size.height / 2 + 2,
        };
        const covered = taken.some(
          (other) =>
            box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top,
        );
        if (covered) {
          holder.dataset.dot = "";
        } else {
          delete holder.dataset.dot;
          taken.push(box);
        }
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout);
    };

    relayout.current = schedule;
    schedule();
    map.on("move", schedule);
    map.on("resize", schedule);
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      sizes.clear();
      schedule();
    });
    return () => {
      live = false;
      map.off("move", schedule);
      map.off("resize", schedule);
      cancelAnimationFrame(frame);
      relayout.current = () => {};
    };
  }, [map, pins, holders]);

  useEffect(() => {
    activeRef.current = activeId;
    holders.forEach((element, id) => {
      if (id === activeId) element.dataset.on = "";
      else delete element.dataset.on;
    });
    relayout.current();
  }, [holders, activeId]);

  /* ---------- place: the area and the house ---------- */

  const place = props.mode === "place" ? { lat: props.lat, lng: props.lng } : null;
  const placeLat = place?.lat;
  const placeLng = place?.lng;
  const home = useMemo(() => document.createElement("div"), []);

  useEffect(() => {
    if (!map || placeLat === undefined || placeLng === undefined) return;
    const data = circle(placeLng, placeLat, 250);
    const source = map.getSource("lv-area");
    if (source && "setData" in source) {
      (source as GeoJSONSource).setData(data);
    } else {
      map.addSource("lv-area", { type: "geojson", data });
      map.addLayer({
        id: "lv-area-fill",
        type: "fill",
        source: "lv-area",
        paint: { "fill-color": "#881c21", "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: "lv-area-line",
        type: "line",
        source: "lv-area",
        paint: { "line-color": "#881c21", "line-opacity": 0.8, "line-width": 2 },
      });
    }
    if (!lib.current) return;
    const marker = addMarker(lib.current, map, home, placeLng, placeLat);
    return () => {
      marker.remove();
    };
  }, [map, placeLat, placeLng, home]);

  // Keys keep React from reusing the map's element (and the canvas inside it) for the message.
  if (failed) {
    return (
      <div key="failed" className="lv-map--empty lv-map__fill">
        <MapPin size={24} strokeWidth={1.75} aria-hidden="true" />
        <span>{props.text.unavailable}</span>
      </div>
    );
  }

  return (
    <>
      <div key="map" ref={box} className="lv-map__fill" />
      {pins?.map((pin) => {
        const holder = holders.get(pin.id);
        if (!holder) return null;
        const className = pinClass(pin, pin.id === activeId);
        if (pin.kind === "home") {
          return createPortal(
            <span className="lv-homepin lv-homepin--marker" role="img" aria-label={pin.title}>
              <House size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>,
            holder,
            pin.id,
          );
        }
        return createPortal(
          pin.href ? (
            <Link className={className} href={pin.href} aria-label={pin.title}>
              {pin.label}
            </Link>
          ) : (
            <span className={className} title={pin.title}>
              {pin.label}
            </span>
          ),
          holder,
          pin.id,
        );
      })}
      {place &&
        createPortal(
          <span className="lv-homepin lv-homepin--marker">
            <House size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>,
          home,
        )}
    </>
  );
}
