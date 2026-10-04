/**
 * Everyday places around Seongsu for the neighbourhood guide and the stay page: approximate
 * positions, a kind for the guide's chips, and walking minutes from the sample studio.
 * Names and notes are in messages (guide.places.*).
 */
export const seongsuPlaces = [
  { key: "market", category: "groceries", lat: 37.5446, lng: 127.0597, minutes: 4 },
  { key: "laundry", category: "laundry", lat: 37.5437, lng: 127.0566, minutes: 2 },
  { key: "clinic", category: "health", lat: 37.5447, lng: 127.0533, minutes: 5 },
  { key: "cafe", category: "work", lat: 37.5421, lng: 127.0581, minutes: 6 },
  { key: "forest", category: "outdoors", lat: 37.5444, lng: 127.0374, minutes: 12 },
] as const;

export type PlaceKey = (typeof seongsuPlaces)[number]["key"];

export const placeCategories = ["all", "groceries", "laundry", "health", "work", "outdoors"] as const;
