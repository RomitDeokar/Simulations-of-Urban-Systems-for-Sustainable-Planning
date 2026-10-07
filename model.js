export const cities = {
  chennai: {
    name: "Chennai",
    state: "Tamil Nadu",
    pop: "6.7M",
    area: "426",
    context:
      "A coastal metropolis on the Bay of Bengal. Connect metro mobility, wetland protection and rainwater capture to tackle heat and monsoon vulnerability.",
    carbon: 3.3,
    commute: 46,
    heat: 4.3,
    water: 35,
    demand: 1.024,
  },
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
// Curated landmark locations, not simulation measurements. Map geometry is from OSM.
export const cityGeography = {
  chennai: {
    center: [80.274, 13.048], zoom: 13.6, bearing: -8,
    identity: "Bay of Bengal · Adyar & Cooum rivers · Coastal metropolis",
    landmarks: [
      { name: "Marina Beach", coordinates: [80.2809, 13.0500], kind: "water", detail: "Recognizable eastern shoreline along the Bay of Bengal. Explore coastal resilience and stormwater capture." },
      { name: "Chennai Central", coordinates: [80.2755, 13.0827], kind: "transit", detail: "Historic railway gateway and metro interchange. A focal point for public transport-led planning." },
      { name: "Mylapore", coordinates: [80.2698, 13.0338], kind: "heritage", detail: "A historic, fine-grained neighborhood around the Kapaleeshwarar Temple, with compact streets and mixed uses." },
      { name: "Guindy National Park", coordinates: [80.2377, 13.0067], kind: "green", detail: "An urban forest and important ecological refuge. Green-cover policies complement the existing landscape." },
      { name: "T. Nagar", coordinates: [80.2337, 13.0418], kind: "district", detail: "A dense shopping and residential district. Explore shaded streets, solar rooftops and better connectivity." },
      { name: "Adyar Estuary", coordinates: [80.2722, 13.0167], kind: "water", detail: "Where the Adyar River meets the coast. Wetland protection and flood resilience are connected systems." },
    ],
  },
  pune: {
    center: [73.858, 18.523], zoom: 13.4, bearing: -22,
    identity: "Mutha River · Historic peths · Education & technology hub",
    landmarks: [
      { name: "Shaniwar Wada", coordinates: [73.8553, 18.5195], kind: "heritage", detail: "Historic heart of Pune, surrounded by compact urban blocks and the city's traditional peth neighborhoods." },
      { name: "Pune Junction", coordinates: [73.8743, 18.5289], kind: "transit", detail: "Railway hub linking the old city with regional mobility networks." },
      { name: "Saras Baug", coordinates: [73.8524, 18.5011], kind: "green", detail: "A central park and temple landscape providing shade and public open space." },
      { name: "Deccan Gymkhana", coordinates: [73.8418, 18.5164], kind: "district", detail: "A mixed-use district beside the Mutha River with education, commerce and transit access." },
      { name: "Mutha Riverfront", coordinates: [73.8550, 18.5265], kind: "water", detail: "The city's river corridor connects drainage, ecology and public-space planning." },
    ],
  },
  bengaluru: {
    center: [77.591, 12.973], zoom: 13.4, bearing: -15,
    identity: "Garden city · Connected lakes · Technology capital",
    landmarks: [
      { name: "Cubbon Park", coordinates: [77.5920, 12.9763], kind: "green", detail: "A major green lung at the center of the city, surrounded by civic and commercial districts." },
      { name: "Majestic", coordinates: [77.5713, 12.9767], kind: "transit", detail: "An important metro, bus and railway interchange for citywide mobility." },
      { name: "Vidhana Soudha", coordinates: [77.5907, 12.9797], kind: "heritage", detail: "The landmark legislative complex anchors Bengaluru's civic district." },
      { name: "Lalbagh", coordinates: [77.5846, 12.9507], kind: "green", detail: "Historic botanical gardens demonstrate the value of established canopy and water bodies." },
      { name: "Ulsoor Lake", coordinates: [77.6191, 12.9815], kind: "water", detail: "A central lake illustrating the link between water storage, urban ecology and recreation." },
    ],
  },
  delhi: {
    center: [77.215, 28.622], zoom: 13.1, bearing: -20,
    identity: "Yamuna River · Civic avenues · Historic capital region",
    landmarks: [
      { name: "India Gate", coordinates: [77.2295, 28.6129], kind: "heritage", detail: "A landmark on the capital's ceremonial avenue, with a recognizable planned street network." },
      { name: "Connaught Place", coordinates: [77.2195, 28.6315], kind: "district", detail: "A distinctive concentric commercial district and major transit destination." },
      { name: "New Delhi Station", coordinates: [77.2194, 28.6429], kind: "transit", detail: "A major regional railway hub close to the historic city." },
      { name: "Lodhi Garden", coordinates: [77.2200, 28.5933], kind: "green", detail: "Historic gardens combine shade, heritage and public recreation." },
      { name: "Yamuna River", coordinates: [77.2630, 28.6270], kind: "water", detail: "The river and its floodplain are crucial to ecology and flood-sensitive urban planning." },
    ],
  },
  mumbai: {
    center: [72.832, 18.947], zoom: 13.4, bearing: -25,
    identity: "Arabian Sea · Island city · Rail-oriented urban fabric",
    landmarks: [
      { name: "Marine Drive", coordinates: [72.8237, 18.9432], kind: "water", detail: "A recognizable curved waterfront on the Arabian Sea, connecting dense neighborhoods with the coast." },
      { name: "CSMT", coordinates: [72.8356, 18.9402], kind: "transit", detail: "Historic railway terminus and an anchor of Mumbai's suburban transport system." },
      { name: "Gateway of India", coordinates: [72.8347, 18.9220], kind: "heritage", detail: "A landmark waterfront precinct in the compact historic city." },
      { name: "Oval Maidan", coordinates: [72.8304, 18.9284], kind: "green", detail: "A large open ground surrounded by the city's historic architectural district." },
      { name: "Girgaon", coordinates: [72.8270, 18.9570], kind: "district", detail: "A dense mixed-use neighborhood with small blocks and narrow streets, distinct from a generic grid." },
    ],
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
