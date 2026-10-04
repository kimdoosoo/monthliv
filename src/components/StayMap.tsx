"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { House } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  AdvancedMarker,
  APIProvider,
  Circle,
  Map as GoogleMap,
} from "@vis.gl/react-google-maps";
import { useRouter } from "@/i18n/navigation";
import type { MapText } from "./OpenMap";

/** A price pin. Text is formatted on the server so it matches the rest of the page. */
export type PricePin = {
  id: string;
  /** The 1-night price, e.g. "30,000원" or "₩30,000". */
  label: string;
  /** Name read out by screen readers, e.g. "Studio with a desk by the window, ₩30,000 a night". */
  title: string;
  lat: number;
  lng: number;
  /** Listing page, when the place has one. */
  href?: string;
  /** "place" pins mark everyday places (market, laundry); "home" is the stay itself. */
  kind?: "price" | "place" | "home";
};

type ResultsProps = {
  mode: "results";
  pins: PricePin[];
  activeId?: string | null;
  /** Show "search as I move the map" (results only). */
  searchAsMove?: boolean;
  /** Accessible name of the map. Defaults to "Map". */
  label?: string;
};

/**
 * Where a place is. Pass approximate coordinates only: the exact address is
 * shared after the contract is signed, so the map shows an area, not a door.
 */
type PlaceProps = {
  mode: "place";
  lat: number;
  lng: number;
  /** Accessible description of the map, e.g. "Seongsu-dong, 4 min walk from Seongsu Stn". */
  caption: string;
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// Google's demo map ID works for development; create a real one in Google Cloud for launch.
const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID";

// The open map needs the browser (WebGL), so it loads there only, after the page.
const OpenMap = dynamic(() => import("./OpenMap"), { ssr: false });

/** Google Maps language codes; British English for "en". */
function mapsLanguage(locale: string): string {
  return locale === "en" ? "en-GB" : locale;
}

/**
 * Map with price pins (search) or an approximate area (listing page).
 * With a Google Maps key it is Google Maps; without one, an OpenStreetMap map that needs no key.
 */
export function StayMap(props: ResultsProps | PlaceProps) {
  const locale = useLocale();

  if (!apiKey) {
    return props.mode === "results" ? <OpenResults {...props} /> : <OpenPlace {...props} />;
  }

  return (
    <APIProvider apiKey={apiKey} language={mapsLanguage(locale)} region="KR">
      {props.mode === "results" ? <GoogleResults {...props} /> : <GooglePlace {...props} />}
    </APIProvider>
  );
}

/* ---------- OpenStreetMap (no key) ---------- */

function useMapText(): MapText {
  const t = useTranslations("map");
  return {
    label: t("label"),
    zoomIn: t("zoomIn"),
    zoomOut: t("zoomOut"),
    attribution: t("attribution"),
    twoFingers: t("twoFingers"),
    ctrlScroll: t("ctrlScroll"),
    cmdScroll: t("cmdScroll"),
    unavailable: t("unavailable"),
  };
}

function OpenResults({ pins, activeId, searchAsMove = true, label }: ResultsProps) {
  const t = useTranslations("map");
  const locale = useLocale();
  const text = useMapText();

  // Only the search page has the "search as I move" pill.
  return (
    <div className="lv-map" role="region" aria-label={label ?? t("label")}>
      <OpenMap
        mode="results"
        pins={pins}
        activeId={activeId}
        searchPage={searchAsMove}
        locale={locale}
        text={text}
      />
      {searchAsMove && <SearchAsMove />}
    </div>
  );
}

function OpenPlace({ lat, lng, caption }: PlaceProps) {
  const locale = useLocale();
  const text = useMapText();

  return (
    <div className="lv-map lv-map--place" role="region" aria-label={caption}>
      <OpenMap mode="place" lat={lat} lng={lng} locale={locale} text={text} />
    </div>
  );
}

/* ---------- Google Maps ---------- */

function GoogleResults({ pins, activeId, searchAsMove = true, label }: ResultsProps) {
  const t = useTranslations("map");
  const router = useRouter();
  // The search page's side map on a wide screen scrolls freely; elsewhere the map sits in a page
  // that scrolls, so one finger (or a plain scroll wheel) keeps scrolling the page.
  const [gestures] = useState(() =>
    searchAsMove &&
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 901px) and (pointer: fine)").matches
      ? "greedy"
      : "cooperative",
  );
  const bounds = useMemo(() => {
    const lats = pins.map((pin) => pin.lat);
    const lngs = pins.map((pin) => pin.lng);
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
      padding: 56,
    };
  }, [pins]);

  return (
    <div className="lv-map" role="region" aria-label={label ?? t("label")}>
      <GoogleMap
        className="lv-gmap"
        mapId={mapId}
        defaultBounds={bounds}
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        gestureHandling={gestures}
      >
        {pins.map((pin) => {
          const on = pin.id === activeId;
          const href = pin.href;
          return (
            <AdvancedMarker
              key={pin.id}
              position={{ lat: pin.lat, lng: pin.lng }}
              anchorLeft="-50%"
              anchorTop="-50%"
              zIndex={on ? 2 : 1}
              title={pin.title}
              onClick={href ? () => router.push(href) : undefined}
            >
              {pin.kind === "home" ? (
                <span className="lv-homepin lv-homepin--marker" title={pin.title}>
                  <House size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
              ) : (
                <span className={pinClass(pin, on)}>{pin.label}</span>
              )}
            </AdvancedMarker>
          );
        })}
      </GoogleMap>
      {searchAsMove && <SearchAsMove />}
    </div>
  );
}

function GooglePlace({ lat, lng, caption }: PlaceProps) {
  const center = { lat, lng };
  return (
    <div className="lv-map lv-map--place" role="region" aria-label={caption}>
      <GoogleMap
        className="lv-gmap"
        mapId={mapId}
        defaultCenter={center}
        defaultZoom={15}
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        gestureHandling="cooperative"
      >
        <Circle
          center={center}
          radius={250}
          clickable={false}
          strokeColor="#881c21"
          strokeOpacity={0.8}
          strokeWeight={2}
          fillColor="#881c21"
          fillOpacity={0.12}
        />
        <AdvancedMarker position={center} anchorLeft="-50%" anchorTop="-50%">
          <span className="lv-homepin lv-homepin--marker">
            <House size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
        </AdvancedMarker>
      </GoogleMap>
    </div>
  );
}

function pinClass(pin: PricePin, on: boolean): string {
  return `lv-pin${pin.kind === "place" ? " lv-pin--place" : ""}${on ? " is-on" : ""}`;
}

function SearchAsMove() {
  const t = useTranslations("map");
  const [on, setOn] = useState(true);
  return (
    <label className="lv-mapcheck">
      <input type="checkbox" checked={on} onChange={(event) => setOn(event.target.checked)} />
      {t("searchAsMove")}
    </label>
  );
}
