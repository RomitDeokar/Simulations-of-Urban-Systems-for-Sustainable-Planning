import { test } from "node:test";
import assert from "node:assert/strict";
import { cities, cityGeography, baseline, presets, simulate } from "./model.js";
test("Chennai is a complete coastal city scenario", () => {
  assert.equal(cities.chennai.name, "Chennai");
  assert.equal(cities.chennai.state, "Tamil Nadu");
  assert.match(cityGeography.chennai.identity, /Bay of Bengal/);
  for (const name of ["Marina Beach", "Chennai Central", "Mylapore", "Guindy National Park", "T. Nagar", "Adyar Estuary"])
    assert.ok(cityGeography.chennai.landmarks.some((place) => place.name === name));
});
test("each city has distinct geographic coordinates and valid landmark coverage", () => {
  assert.deepEqual(Object.keys(cityGeography).sort(), Object.keys(cities).sort());
  const centers = new Set();
  for (const [key, geo] of Object.entries(cityGeography)) {
    centers.add(geo.center.join(","));
    assert.ok(geo.landmarks.length >= 5, key);
    assert.ok(geo.zoom >= 10 && geo.zoom <= 18.5);
    assert.equal(new Set(geo.landmarks.map((place) => place.name)).size, geo.landmarks.length);
    for (const coordinates of [geo.center, ...geo.landmarks.map((place) => place.coordinates)]) {
      assert.equal(coordinates.length, 2);
      assert.ok(coordinates.every(Number.isFinite));
      assert.ok(coordinates[0] >= 67 && coordinates[0] <= 98);
      assert.ok(coordinates[1] >= 6 && coordinates[1] <= 38);
    }
  }
  assert.equal(centers.size, Object.keys(cities).length);
});
test("planning changes never alter real city geometry", () => {
  const before = JSON.stringify(cityGeography);
  for (const city of Object.keys(cities))
    for (const policy of [baseline, ...Object.values(presets)]) simulate(city, policy, 2040);
  assert.equal(JSON.stringify(cityGeography), before);
});
test("all cities reproduce baseline in 2026", () => {
  for (const [key, c] of Object.entries(cities)) {
    const m = simulate(key, baseline, 2026);
    assert.equal(m.carbon, c.carbon);
    assert.equal(m.commute, c.commute);
    assert.equal(m.cost, 0);
  }
});
test("balanced interventions improve all sustainability metrics", () => {
  for (const key of Object.keys(cities)) {
    const a = simulate(key, baseline),
      b = simulate(key, presets.balanced);
    for (const k of ["carbon", "commute", "heat", "water"])
      assert.ok(b[k] < a[k]);
    assert.ok(b.cost > 0);
  }
});
test("policy extremes remain finite and bounded", () => {
  for (const year of [2026, 2030, 2035, 2040])
    for (const key of Object.keys(cities)) {
      const m = simulate(
        key,
        { transit: 100, green: 100, solar: 100, water: 100 },
        year,
      );
      for (const v of Object.values(m)) assert.ok(Number.isFinite(v) && v >= 0);
    }
});
test("adoption grows through 2035 and solar cuts emissions", () => {
  assert.ok(
    simulate("pune", presets.balanced, 2035).reduction >
      simulate("pune", presets.balanced, 2030).reduction,
  );
  assert.ok(
    simulate("pune", { ...baseline, solar: 80 }).carbon <
      simulate("pune", baseline).carbon,
  );
});
