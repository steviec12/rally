import { describe, it, expect } from "vitest";
import { haversineKm, filterByDistance } from "./geo";

describe("haversineKm", () => {
  it("returns 0 for the same point", () => {
    expect(haversineKm(34.0522, -118.2437, 34.0522, -118.2437)).toBe(0);
  });

  it("calculates LA to Santa Monica (~25 km)", () => {
    // LA downtown to Santa Monica pier
    const dist = haversineKm(34.0522, -118.2437, 34.0094, -118.4973);
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeLessThan(30);
  });

  it("calculates LA to San Francisco (~560 km)", () => {
    const dist = haversineKm(34.0522, -118.2437, 37.7749, -122.4194);
    expect(dist).toBeGreaterThan(540);
    expect(dist).toBeLessThan(580);
  });

  it("handles antipodal points (~20000 km)", () => {
    const dist = haversineKm(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(19900);
    expect(dist).toBeLessThan(20100);
  });
});

describe("filterByDistance", () => {
  const items = [
    { id: "a", locationLat: 34.0094, locationLng: -118.4973 }, // ~25km from LA
    { id: "b", locationLat: 34.0522, locationLng: -118.2437 }, // 0km (same as user)
    { id: "c", locationLat: 37.7749, locationLng: -122.4194 }, // ~560km (SF)
    { id: "d", locationLat: 0, locationLng: 0 },               // ungeocoded
  ];

  const userLat = 34.0522;
  const userLng = -118.2437;

  it("returns items within the specified distance", () => {
    const result = filterByDistance(items, userLat, userLng, 30);
    expect(result.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("excludes items beyond the specified distance", () => {
    const result = filterByDistance(items, userLat, userLng, 10);
    expect(result.map((i) => i.id)).toEqual(["b"]);
  });

  it("excludes items with (0,0) coordinates", () => {
    const result = filterByDistance(items, userLat, userLng, 100000);
    expect(result.map((i) => i.id)).not.toContain("d");
  });

  it("returns empty array when no items match", () => {
    // Use a location far from all items
    const result = filterByDistance(items, 0.1, 0.1, 5);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    const result = filterByDistance([], userLat, userLng, 50);
    expect(result).toEqual([]);
  });
});
