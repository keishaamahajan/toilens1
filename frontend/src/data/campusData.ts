import type { ApiLocation } from "../api/client";

export interface CampusBuilding { id: string; name: string; lat: number; lng: number; floors: number; }
export interface ToiletRecord {
  id: string; buildingId: string; buildingName: string; floor: number; toiletNumber: number; label: string;
  lat: number; lng: number; gender: "male" | "female" | "unisex"; thiScore: number; predictedThi: number;
  complaints: number; footfall: number; lastCleaned: string; priority: "OK" | "Monitor" | "Urgent";
  accessibility: { wheelchairAccessible: boolean; handrails: boolean }; description: string; category: string;
}
function priority(thi: number): ToiletRecord["priority"] { return thi >= 75 ? "OK" : thi >= 50 ? "Monitor" : "Urgent"; }

// Locations are API data. The supplied API has no operational-health fields, so
// neutral UI defaults retain the Figma health surfaces without inventing sites.
export function locationsToToilets(locations: ApiLocation[]): ToiletRecord[] {
  return locations.map((location, index) => {
    const thiScore = 70;
    return { id: location.id, buildingId: location.id, buildingName: location.name, floor: 1, toiletNumber: index + 1,
      label: location.category, lat: location.lat, lng: location.lng, gender: "unisex", thiScore, predictedThi: thiScore,
      complaints: 0, footfall: 0, lastCleaned: new Date().toISOString(), priority: priority(thiScore),
      accessibility: { wheelchairAccessible: false, handrails: false }, description: location.description, category: location.category };
  });
}
export function locationsToBuildings(locations: ApiLocation[]): CampusBuilding[] {
  return locations.map((location) => ({ id: location.id, name: location.name, lat: location.lat, lng: location.lng, floors: 1 }));
}
