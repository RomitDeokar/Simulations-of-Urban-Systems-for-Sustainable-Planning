import { test } from "node:test";
import assert from "node:assert/strict";
import { cities, baseline, presets, simulate } from "./model.js";
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
