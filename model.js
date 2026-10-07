export const cities = {
  pune: {
    name: "Pune",
    state: "Maharashtra",
    pop: "4.5M",
    area: "516",
    context:
      "A growing IT and education hub. Balance rising travel demand with a cooler, greener city.",
    carbon: 3.2,
    commute: 42,
    heat: 4.1,
    water: 28,
    demand: 1.025,
  },
  bengaluru: {
    name: "Bengaluru",
    state: "Karnataka",
    pop: "13.6M",
    area: "741",
    context:
      "A technology capital under pressure. Test the connections between traffic, heat and water stress.",
    carbon: 3.8,
    commute: 54,
    heat: 4.5,
    water: 38,
    demand: 1.03,
  },
  delhi: {
    name: "New Delhi",
    state: "Delhi NCR",
    pop: "20.0M",
    area: "1484",
    context:
      "A dense capital region. Explore clean mobility and green infrastructure in a hotter climate.",
    carbon: 4.4,
    commute: 48,
    heat: 5.2,
    water: 32,
    demand: 1.02,
  },
  mumbai: {
    name: "Mumbai",
    state: "Maharashtra",
    pop: "12.5M",
    area: "603",
    context:
      "A coastal megacity. Strengthen public transport and monsoon resilience within limited urban space.",
    carbon: 3.0,
    commute: 51,
    heat: 3.8,
    water: 22,
    demand: 1.018,
  },
};
export const baseline = { transit: 25, green: 15, solar: 10, water: 15 };
export const presets = {
  balanced: { transit: 55, green: 32, solar: 45, water: 50 },
  mobility: { transit: 80, green: 22, solar: 25, water: 30 },
  climate: { transit: 45, green: 45, solar: 75, water: 75 },
};
export function simulate(city, policy, year = 2035) {
  const c = cities[city];
  const p = Object.fromEntries(
    Object.keys(baseline).map((k) => [
      k,
      Math.min(100, Math.max(0, Number(policy[k]))),
    ]),
  );
  const t = (p.transit - 25) / 100,
    g = (p.green - 15) / 100,
    s = (p.solar - 10) / 100,
    w = (p.water - 15) / 100;
  const adoption = Math.min(1, Math.max(0, (year - 2026) / 9)),
    growth = c.demand ** (year - 2026);
  const reduction = Math.min(
    0.8,
    Math.max(-0.3, adoption * (0.48 * t + 0.32 * s + 0.22 * g + 0.08 * t * g)),
  );
  return {
    carbon: c.carbon * growth * (1 - reduction),
    commute:
      c.commute *
      (1 + 0.009 * (year - 2026)) *
      (1 - adoption * (0.52 * t + 0.12 * g)),
    heat: Math.max(
      0.5,
      c.heat + 0.04 * (year - 2026) - adoption * (5 * g + 0.65 * s),
    ),
    water: Math.max(
      3,
      c.water + 0.65 * (year - 2026) - adoption * (31 * w + 14 * g),
    ),
    cost: Math.max(
      0,
      Math.round(
        5600 * Math.max(0, t) +
          4200 * Math.max(0, g) +
          2800 * Math.max(0, s) +
          1800 * Math.max(0, w),
      ),
    ),
    reduction: reduction * 100,
  };
}
