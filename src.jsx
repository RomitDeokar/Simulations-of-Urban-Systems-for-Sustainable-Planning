import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Leaf,
  TrainFront,
  Sun,
  Droplets,
  MapPin,
  Layers,
  Info,
  Download,
  Maximize2,
  X,
  Check,
  Building2,
  SlidersHorizontal,
  ChartNoAxesCombined,
  BookOpen,
  Wind,
  Clock,
  Thermometer,
  ShieldCheck,
} from "lucide-react";
import { cities, cityGeography, baseline, presets, simulate } from "./model.js";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "./style.css";
import { Protocol } from "pmtiles";
const buildingProtocol = new Protocol();
maplibregl.addProtocol("pmtiles", buildingProtocol.tile);
const buildingArchive = "pmtiles://https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/2026-09-23.1/buildings.pmtiles";
maplibregl.setWorkerUrl(mapWorkerUrl);
maplibregl.setWorkerCount(2);
const fmt = (n, d = 1) => n.toFixed(d);
// Geography remains fixed as policies change: only illustrative overlays change.
function CityMap({ policy, layer, running, city }) {
  const host = useRef(null), mapRef = useRef(null), markers = useRef([]);
  const latest = useRef({ policy, layer, city });
  latest.current = { policy, layer, city };
  const [status, setStatus] = useState("loading"), [selected, setSelected] = useState(-1);
  const [perspective, setPerspective] = useState(true), [tour, setTour] = useState(false);
  const [fallback, setFallback] = useState(false), [retry, setRetry] = useState(0);
  const geo = cityGeography[city];
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const focus = (index) => {
    setSelected(index);
    const g = cityGeography[latest.current.city];
    const place = g.landmarks[index];
    mapRef.current?.flyTo({
      center: place ? place.coordinates : g.center,
      zoom: place ? 16 : g.zoom,
      pitch: perspective ? (place ? 58 : 45) : 0,
      bearing: perspective ? g.bearing : 0,
      duration: reduced() ? 0 : 1800,
    });
  };
  const syncOverlays = (map) => {
    if (!map.getLayer("building-3d")) return;
    const { policy: p, layer: l, city: key } = latest.current;
    const height = ["max", 3, ["coalesce", ["get", "height"], ["get", "render_height"], 8]];
    // Stable illustrative rooftop cohorts; never generate or move building geometry.
    const cohort = ["match", ["slice", ["coalesce", ["get", "id"], "0"], 0, 1],
      "0", 3, "1", 9, "2", 16, "3", 22, "4", 28, "5", 34, "6", 41, "7", 47,
      "8", 53, "9", 59, "a", 66, "b", 72, "c", 78, "d", 84, "e", 91, "f", 97, 50];
    const solarCohort = ["<", cohort, p.solar];
    const buildingColor = l === "heat"
      ? (p.green >= 30 ? "#edbd83" : "#d98561")
      : l === "energy" ? ["case", solarCohort, "#327d92", "#d1d9d6"]
      : l === "water" ? "#bbd0d2" : "#d3d8d5";
    for (const id of ["building-3d", "dense-city-buildings"]) {
      if (!map.getLayer(id)) continue;
      map.setPaintProperty(id, "fill-extrusion-color", buildingColor);
      map.setPaintProperty(id, "fill-extrusion-height", height);
      map.setPaintProperty(id, "fill-extrusion-opacity", 0.94);
      map.setLayerZoomRange(id, 13, 24);
    }
    const g = cityGeography[key];
    const features = g.landmarks.map((place, i) => ({
      type: "Feature", properties: { kind: place.kind, index: i },
      geometry: { type: "Point", coordinates: place.coordinates },
    }));
    map.getSource("planning-sites")?.setData({ type: "FeatureCollection", features });
    map.setPaintProperty("planning-halos", "circle-radius", [
      "interpolate", ["linear"], ["zoom"], 11, 7, 16,
      l === "water" ? 22 + p.water * 0.4 : l === "heat" ? 18 + p.green * 0.7 : 18 + p.transit * 0.2,
    ]);
    map.setPaintProperty("planning-halos", "circle-color", l === "water" ? "#498da4" : l === "heat" ? "#4c985b" : "#4e8e79");
    map.setPaintProperty("planning-halos", "circle-opacity", l === "overview" ? 0.08 : 0.22);
    map.setFilter("planning-halos", l === "heat" ? ["==", "kind", "green"] : l === "water"
      ? ["==", "kind", "water"] : ["==", "kind", "transit"]);
  };
  useEffect(() => {
    if (fallback) return;
    let disposed = false, timer, observer;
    setStatus("loading");
    let map;
    try {
      const g = cityGeography[latest.current.city];
      map = new maplibregl.Map({
        container: host.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: g.center, zoom: g.zoom, pitch: perspective ? 45 : 0, bearing: perspective ? g.bearing : 0,
        maxPitch: 70, minZoom: 10, maxZoom: 18.5,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 90 }), "bottom-left");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      observer = new ResizeObserver(() => map.resize());
      observer.observe(host.current);
      timer = setTimeout(() => { if (!disposed && !map.isStyleLoaded()) setStatus("error"); }, 22000);
      map.on("load", () => {
        if (disposed) return;
        clearTimeout(timer);
        map.addSource("overture-buildings", {
          type: "vector", url: buildingArchive, minzoom: 13, maxzoom: 14,
          attribution: '<a href="https://docs.overturemaps.org/attribution" target="_blank">© Overture Maps Foundation &amp; contributors</a>',
        });
        const firstLabel = map.getStyle().layers.find((entry) => entry.type === "symbol")?.id;
        map.addLayer({
          id: "dense-city-buildings", type: "fill-extrusion", source: "overture-buildings",
          "source-layer": "building", minzoom: 13,
          filter: ["!=", ["get", "is_underground"], true],
          paint: { "fill-extrusion-color": "#d3d8d5", "fill-extrusion-height": ["coalesce", ["get", "height"], 8],
            "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0], "fill-extrusion-opacity": 0.94 },
        }, firstLabel);
        map.on("click", "dense-city-buildings", (event) => {
          const properties = event.features?.[0]?.properties;
          if (!properties) return;
          const content = document.createElement("div");
          content.className = "building-inspector";
          const title = document.createElement("strong");
          title.textContent = properties["@name"] || "Mapped building footprint";
          const detail = document.createElement("p");
          const height = Math.max(3, properties.height == null ? 8 : Number(properties.height));
          detail.textContent = `Rendered height: ${Number(height).toFixed(0)} m${properties.height ? " (dataset value)" : " (illustrative default)"}. Geometry: ${properties["@geometry_source"] || "Overture Maps"}.`;
          const note = document.createElement("small");
          note.textContent = "Policy colors are hypothetical interventions, not this building’s measured performance.";
          content.append(title, detail, note);
          new maplibregl.Popup({ maxWidth: "260px" }).setLngLat(event.lngLat).setDOMContent(content).addTo(map);
        });
        map.on("mouseenter", "dense-city-buildings", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "dense-city-buildings", () => { map.getCanvas().style.cursor = ""; });
        map.on("sourcedata", (event) => {
          if (event.sourceId === "overture-buildings" && event.sourceDataType === "content" && map.getLayer("building-3d")) {
            map.setLayoutProperty("building-3d", "visibility", "none");
          }
        });
        map.addSource("planning-sites", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "planning-halos", type: "circle", source: "planning-sites", paint: {
          "circle-radius": 30, "circle-color": "#4e8e79", "circle-opacity": 0.12,
          "circle-stroke-color": "#579985", "circle-stroke-width": 1, "circle-stroke-opacity": 0.4,
        } });
        syncOverlays(map);
        setStatus("ready");
      });
      map.on("error", (event) => {
        if (!disposed && !map.isStyleLoaded() && /style|worker/i.test(event.error?.message || "")) setStatus("error");
      });
    } catch {
      setStatus("error");
    }
    return () => {
      disposed = true; clearTimeout(timer); observer?.disconnect();
      markers.current.forEach((m) => m.remove()); markers.current = [];
      map?.remove(); mapRef.current = null;
    };
  }, [fallback, retry]);
  useEffect(() => {
    setSelected(-1); setTour(false);
    if (!mapRef.current) return;
    const map = mapRef.current, g = cityGeography[city];
    map.flyTo({ center: g.center, zoom: g.zoom, pitch: perspective ? 45 : 0,
      bearing: perspective ? g.bearing : 0, duration: reduced() ? 0 : 1600 });
  }, [city]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    markers.current.forEach((m) => m.remove());
    markers.current = geo.landmarks.map((place, index) => {
      const button = document.createElement("button");
      button.className = `geo-pin ${place.kind}${selected === index ? " selected" : ""}`;
      button.textContent = String(index + 1);
      button.title = place.name;
      button.setAttribute("aria-label", `Explore ${place.name}`);
      button.addEventListener("click", () => { setTour(false); focus(index); });
      return new maplibregl.Marker({ element: button }).setLngLat(place.coordinates).addTo(map);
    });
    syncOverlays(map);
  }, [city, status, selected, policy, layer]);
  useEffect(() => {
    if (!tour) return;
    let index = selected;
    const timer = setInterval(() => {
      index = (index + 1) % geo.landmarks.length; focus(index);
    }, 6500);
    return () => clearInterval(timer);
  }, [tour, city, perspective]);
  const chosen = geo.landmarks[selected];
  const fallbackCenter = chosen?.coordinates || geo.center;
  const fallbackExtent = chosen ? 0.007 : 0.04;
  return (
    <div className="geographic-city" aria-label={`Geographic map of ${cities[city].name}`}>
      {fallback ? <iframe title={`2D street map of ${cities[city].name}`}
        className="geographic-host" src={`https://www.openstreetmap.org/export/embed.html?bbox=${fallbackCenter[0] - fallbackExtent}%2C${fallbackCenter[1] - fallbackExtent * 0.7}%2C${fallbackCenter[0] + fallbackExtent}%2C${fallbackCenter[1] + fallbackExtent * 0.7}&layer=mapnik`} />
        : <div className="geographic-host" ref={host} />}
      {!fallback && status !== "ready" && <div className="map-loading" role="status">
        <MapPin size={28} />
        <strong>{status === "error" ? "Map couldn't load on this device" : `Loading real ${cities[city].name} geography…`}</strong>
        <span>{status === "error" ? "Try again or open the lighter 2D map. Internet is required." : "Street networks · coastlines · dense mapped building footprints"}</span>
        {status === "error" && <div>
          <button className="outline" onClick={() => setRetry((v) => v + 1)}>Retry map</button>
          <button className="run-button" onClick={() => { setTour(false); setFallback(true); }}>Use 2D fallback</button>
        </div>}
      </div>}
      <div className="geo-controls">
        <button onClick={() => { setTour(false); focus(-1); }}><RotateCcw size={12} /> City overview</button>
        {!fallback && <>
          <button className={perspective ? "active" : ""} onClick={() => {
            const next = !perspective; setPerspective(next);
            mapRef.current?.easeTo({ pitch: next ? 58 : 0, bearing: next ? geo.bearing : 0, duration: reduced() ? 0 : 900 });
          }}>{perspective ? "3D buildings" : "2D street map"}</button>
          <button className={tour ? "active" : ""} onClick={() => { if (!tour) focus(0); setTour(!tour); }}>
            {tour ? <Pause size={12} /> : <Play size={12} />} {tour ? "Stop tour" : "Landmark tour"}
          </button>
        </>}
        {fallback && <button onClick={() => setFallback(false)}>Retry 3D map</button>}
      </div>
      <div className="geo-explorer">
        <div className="geo-place-title"><span>{chosen ? "EXPLORE THE NEIGHBORHOOD" : "REAL GEOGRAPHY. CONNECTED SYSTEMS."}</span>
          <strong>{chosen ? chosen.name : geo.identity}</strong></div>
        <div className="landmark-chips">{geo.landmarks.map((place, index) => (
          <button key={place.name} className={selected === index ? "active" : ""}
            onClick={() => { setTour(false); focus(index); }}><span>{index + 1}</span>{place.name}</button>
        ))}</div>
        <p>{chosen ? chosen.detail : "Select a landmark to explore its streets. Click a building to inspect it. Drag to pan, scroll to zoom, right-drag to rotate."}</p>
        <div className="geography-note">OSM streets + Overture footprints · heights mapped/estimated, default 8m if missing · conceptual policy layers
          {running && <span> · Planning horizon advancing</span>}</div>
      </div>
    </div>
  );
}
function Trend({ city, policy, year }) {
  const years = [2026, 2028, 2030, 2032, 2035, 2040],
    base = years.map((y) => simulate(city, baseline, y).carbon),
    plan = years.map((y) => simulate(city, policy, y).carbon),
    max = Math.max(...base) * 1.08,
    min = Math.min(...plan) * 0.8;
  const point = (v, i) =>
    `${40 + ((years[i] - 2026) / 14) * 325},${130 - ((v - min) / (max - min)) * 100}`;
  return (
    <svg
      viewBox="0 0 400 165"
      role="img"
      aria-label="Annual carbon emissions trajectory comparing your scenario with no intervention"
    >
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#61866a" stopOpacity=".16" />
          <stop offset="1" stopColor="#61866a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 65, 100, 130].map((y, i) => (
        <g key={y}>
          <line
            x1="40"
            x2="370"
            y1={y}
            y2={y}
            stroke="#e9ece6"
            strokeDasharray="3 4"
          />
          <text x="3" y={y + 3} fill="#8a918a" fontSize="9">
            {fmt(min + ((130 - y) / 100) * (max - min))}
          </text>
        </g>
      ))}
      <polygon
        points={`40,130 ${plan.map(point).join(" ")} 365,130`}
        fill="url(#fill)"
      />
      <polyline
        points={base.map(point).join(" ")}
        fill="none"
        stroke="#b5bdb2"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <polyline
        points={plan.map(point).join(" ")}
        fill="none"
        stroke="#3c7155"
        strokeWidth="2.5"
      />
      {years.map((y, i) => (
        <text
          key={y}
          x={40 + ((y - 2026) / 14) * 325}
          y="154"
          textAnchor="middle"
          fontSize="10"
          fill="#8a918a"
        >
          {y}
        </text>
      ))}
      <circle
        cx={40 + ((Math.min(year, 2040) - 2026) / 14) * 325}
        cy={
          130 -
          ((simulate(city, policy, year).carbon - min) / (max - min)) * 100
        }
        r="4"
        fill="#3c7155"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
}
function App() {
  const [city, setCity] = useState("chennai"),
    [policy, setPolicy] = useState({ ...baseline }),
    [year, setYear] = useState(2035),
    [running, setRunning] = useState(false),
    [layer, setLayer] = useState("overview"),
    [preset, setPreset] = useState("custom"),
    [tab, setTab] = useState("lab"),
    [modal, setModal] = useState(null),
    [compare, setCompare] = useState(false),
    [demo, setDemo] = useState(-1),
    [toast, setToast] = useState("");
  const m = simulate(city, policy, year),
    b = simulate(city, baseline, year),
    c = cities[city],
    score = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          35 +
            m.reduction * 0.95 +
            (b.heat - m.heat) * 7 +
            (b.water - m.water) * 0.65,
        ),
      ),
    ),
    budget = 5000;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () =>
        setYear((y) => {
          if (y >= 2040) {
            setRunning(false);
            return 2040;
          }
          return y + 1;
        }),
      850,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") {
        setModal(null);
        setDemo(-1);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const apply = (k) => {
    setPolicy({ ...presets[k] });
    setPreset(k);
  };
  const reset = () => {
    setPolicy({ ...baseline });
    setPreset("custom");
    setYear(2035);
    setRunning(false);
    setCompare(false);
  };
  const steps = [
    {
      title: "A city is a connected system.",
      body: `Start with ${c.name}’s real street map and illustrative baseline. Its transport, buildings, green spaces and water systems affect one another.`,
      policy: baseline,
      layer: "overview",
    },
    {
      title: "Move people, not just cars.",
      body: "Raise public transport adoption to 80%. Explore the mapped transport hubs and see estimated commute times improve.",
      policy: presets.mobility,
      layer: "overview",
    },
    {
      title: "Make room for nature.",
      body: "More trees, rooftop solar and rainwater capture reduce heat, carbon emissions and water stress together.",
      policy: presets.climate,
      layer: "heat",
    },
    {
      title: "Choose a balanced future.",
      body: "A balanced plan stays within the ₹5,000 crore demonstration budget. Compare it with doing nothing, then explore your own scenario.",
      policy: presets.balanced,
      layer: "overview",
    },
  ];
  const demoStep = (i) => {
    setDemo(i);
    setYear(2035);
    setPolicy({ ...steps[i].policy });
    setLayer(steps[i].layer);
    setPreset(i === 3 ? "balanced" : "custom");
    setCompare(i === 3);
    setTab("lab");
    setRunning(false);
  };
  const exportReport = () => {
    const report = {
      project: "UrbanScope India",
      disclaimer:
        "Illustrative educational model; not live data or a validated forecast.",
      city: c.name,
      year,
      policy,
      scenario: m,
      baseline: b,
      assumptions:
        "See the Methodology tab. Baseline is illustrative and adoption ramps linearly from 2026 to 2035.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `UrbanScope-${city}-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Scenario report downloaded");
  };
  const metrics = [
    {
      label: "Carbon emissions",
      value: fmt(m.carbon),
      unit: "tCO₂ / person / yr",
      icon: Wind,
      delta: ((b.carbon - m.carbon) / b.carbon) * 100,
      desc: "Lower annual footprint",
      key: "carbon",
    },
    {
      label: "Average commute",
      value: fmt(m.commute, 0),
      unit: "minutes / trip",
      icon: Clock,
      delta: ((b.commute - m.commute) / b.commute) * 100,
      desc: "More time, less traffic",
      key: "commute",
    },
    {
      label: "Urban heat island",
      value: `+${fmt(m.heat)}`,
      unit: "°C above surroundings",
      icon: Thermometer,
      delta: ((b.heat - m.heat) / b.heat) * 100,
      desc: "A cooler urban district",
      key: "heat",
    },
    {
      label: "Water supply gap",
      value: fmt(m.water, 0),
      unit: "% of estimated demand",
      icon: Droplets,
      delta: ((b.water - m.water) / b.water) * 100,
      desc: "Greater water resilience",
      key: "water",
    },
  ];
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("lab");
          }}
        >
          <span className="brand-icon">
            <Building2 size={22} />
          </span>
          <span>
            urban<span className="brand-light">scope</span>
            <small>INDIA · URBAN SYSTEMS LAB</small>
          </span>
        </a>
        <nav>
          {[
            ["lab", "Simulation lab"],
            ["scenarios", "Scenarios"],
            ["method", "Methodology"],
          ].map(([id, label]) => (
            <button
              className={tab === id ? "active" : ""}
              key={id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="outline presentation" onClick={() => demoStep(0)}>
          <Play size={14} /> Presentation mode <ArrowUpRight size={14} />
        </button>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">
              <span /> A BETTER FUTURE, BY DESIGN
            </div>
            <h1>
              Small decisions. <span>Better cities.</span>
            </h1>
            <p>
              Explore how today’s planning choices shape tomorrow’s Indian
              cities.
            </p>
          </div>
          <div className="intro-meta">
            <span className="pill">
              <span className="live-dot" /> Interactive planning sandbox
            </span>
            <span className="model-label">
              ILLUSTRATIVE MODEL{" "}
              <Info
                size={12}
                onClick={() => setModal("method")}
                style={{ cursor: "pointer" }}
              />
            </span>
          </div>
        </div>
        {tab === "lab" ? (
          <>
            <div className="workspace-head">
              <div className="city-picker">
                <MapPin size={18} />
                <select
                  aria-label="Select Indian city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setRunning(false);
                  }}
                >
                  {Object.entries(cities).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}, {v.state}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
                <span className="divider" />
                <span className="district-label">
                  Geographic city simulation
                </span>
              </div>
              <div className="toolbar">
                <button onClick={reset} title="Reset all scenario settings">
                  <RotateCcw size={14} /> Reset
                </button>
                <button onClick={exportReport}>
                  <Download size={14} /> Export scenario
                </button>
              </div>
            </div>
            <div className="workspace">
              <aside className="policy-panel">
                <div className="panel-title">
                  <h2>
                    <SlidersHorizontal size={16} /> Your planning levers
                  </h2>
                  <button
                    className="icon-button"
                    aria-label="About planning levers"
                    onClick={() => setModal("levers")}
                  >
                    <Info size={15} />
                  </button>
                </div>
                <p className="small muted">
                  Adjust the inputs. See the ripple effects.
                </p>
                <div className="preset-label">START WITH A SCENARIO</div>
                <div className="preset-buttons">
                  {[
                    ["balanced", "Balanced"],
                    ["mobility", "Transit-first"],
                    ["climate", "Climate-first"],
                  ].map(([k, n]) => (
                    <button
                      key={k}
                      className={preset === k ? "selected" : ""}
                      onClick={() => apply(k)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="controls">
                  {[
                    {
                      key: "transit",
                      name: "Public transport",
                      description: "Share of trips by public transit",
                      icon: TrainFront,
                      color: "#527765",
                    },
                    {
                      key: "green",
                      name: "Green cover",
                      description: "Share of district with green space",
                      icon: Leaf,
                      color: "#849a60",
                    },
                    {
                      key: "solar",
                      name: "Rooftop solar",
                      description: "Share of eligible rooftops equipped",
                      icon: Sun,
                      color: "#c49b58",
                    },
                    {
                      key: "water",
                      name: "Rainwater harvesting",
                      description: "Share of buildings with capture systems",
                      icon: Droplets,
                      color: "#7298a3",
                    },
                  ].map(({ key, name, description, icon: Icon, color }) => (
                    <div className="control" key={key}>
                      <div className="control-heading">
                        <span>
                          <span
                            className="control-icon"
                            style={{ color, background: `${color}15` }}
                          >
                            <Icon size={17} />
                          </span>
                          {name}
                        </span>
                        <strong>
                          {policy[key]}
                          <small>%</small>
                        </strong>
                      </div>
                      <p>{description}</p>
                      <input
                        aria-label={name}
                        type="range"
                        min="0"
                        max={key === "green" ? 60 : 100}
                        value={policy[key]}
                        style={{
                          "--range-color": color,
                          "--fill": `${(policy[key] / (key === "green" ? 60 : 100)) * 100}%`,
                        }}
                        onChange={(e) => {
                          setPolicy((p) => ({ ...p, [key]: +e.target.value }));
                          setPreset("custom");
                        }}
                      />
                      <div className="range-labels">
                        <span>0%</span>
                        <span>{key === "green" ? 60 : 100}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`budget ${m.cost > budget ? "over" : ""}`}>
                  <div>
                    <span>
                      Estimated investment <Info size={11} />
                    </span>
                    <strong>
                      ₹{m.cost.toLocaleString("en-IN")} <small>Cr</small>
                    </strong>
                  </div>
                  <div className="budget-track">
                    <span
                      style={{
                        width: `${Math.min(100, (m.cost / budget) * 100)}%`,
                      }}
                    />
                  </div>
                  <p>
                    {m.cost > budget
                      ? "Above demonstration budget"
                      : "Within demonstration budget"}
                    <span>₹5,000 Cr</span>
                  </p>
                </div>
              </aside>
              <section className="city-panel">
                <div className="city-top">
                  <div>
                    <span className="section-label">REAL CITY · FUTURE POSSIBILITIES</span>
                    <h2>
                      {c.name} <span>· {year}</span>
                    </h2>
                  </div>
                  <div className="map-tools">
                    <button
                      className={compare ? "selected" : ""}
                      onClick={() => setCompare((v) => !v)}
                    >
                      <Layers size={13} />{" "}
                      {compare ? "Hide baseline" : "Compare baseline"}
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Expand city view"
                      onClick={() => setModal("city")}
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="layer-tabs">
                  {[
                    ["overview", "City overview", Building2],
                    ["heat", "Heat map", Thermometer],
                    ["energy", "Energy", Sun],
                    ["water", "Water", Droplets],
                  ].map(([k, n, Icon]) => (
                    <button
                      className={layer === k ? "active" : ""}
                      key={k}
                      onClick={() => setLayer(k)}
                    >
                      <Icon size={13} />
                      {n}
                    </button>
                  ))}
                </div>
                <div className="city-stage">
                  <div className="map-badge">
                    <span className="live-dot" />{" "}
                    {running ? "SIMULATION RUNNING" : "SCENARIO PREVIEW"}
                  </div>
                  <CityMap
                    city={city}
                    policy={policy}
                    layer={layer}
                    running={running}
                  />
                  <div className="map-legend">
                    {layer === "heat" ? (
                      <>
                        <span
                          className="legend-dot"
                          style={{ background: "#d9b49c" }}
                        />{" "}
                        Built-up heat{" "}
                        <span
                          className="legend-dot"
                          style={{ background: "#8daa79" }}
                        />{" "}
                        Green cooling
                      </>
                    ) : layer === "energy" ? (
                      <>
                        <span
                          className="legend-dot"
                          style={{ background: "#526f7c" }}
                        />{" "}
                        Solar rooftops{" "}
                        <span
                          className="legend-dot"
                          style={{ background: "#8eaab7" }}
                        />{" "}
                        Clean energy
                      </>
                    ) : layer === "water" ? (
                      <>
                        <span
                          className="legend-dot"
                          style={{ background: "#b9d5d7" }}
                        />{" "}
                        Water network{" "}
                        <span
                          className="legend-dot"
                          style={{ background: "#8daa79" }}
                        />{" "}
                        Permeable land
                      </>
                    ) : (
                      <>
                        <span
                          className="legend-dot"
                          style={{ background: "#638c76" }}
                        />{" "}
                        Public transit{" "}
                        <span
                          className="legend-dot"
                          style={{ background: "#8daa79" }}
                        />{" "}
                        Green spaces{" "}
                        <span
                          className="legend-dot"
                          style={{ background: "#b9d5d7" }}
                        />{" "}
                        Water
                      </>
                    )}
                  </div>
                  <span className="schematic">
                    REAL MAP · ILLUSTRATIVE POLICIES
                  </span>
                </div>
                <div className="timeline">
                  <button
                    className="run-button"
                    onClick={() => {
                      if (!running && year >= 2040) setYear(2026);
                      setRunning((v) => !v);
                    }}
                  >
                    {running ? (
                      <Pause size={14} />
                    ) : (
                      <Play size={14} fill="currentColor" />
                    )}
                    {running ? "Pause" : "Run simulation"}
                  </button>
                  <div className="year-control">
                    <div>
                      <span>Planning horizon</span>
                      <strong>{year}</strong>
                    </div>
                    <input
                      aria-label="Planning year"
                      type="range"
                      min="2026"
                      max="2040"
                      value={year}
                      onChange={(e) => {
                        setYear(+e.target.value);
                        setRunning(false);
                      }}
                    />
                    <div className="years">
                      <span>2026</span>
                      <span>2030</span>
                      <span>2035</span>
                      <span>2040</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="impact-heading">
              <h2>
                Your decisions, <span>their impact.</span>
              </h2>
              <span>
                Estimated outcomes in {year} <span className="comparison-dot" />{" "}
                vs. no intervention
              </span>
            </div>
            <div className="metrics">
              {metrics.map(
                ({ label, value, unit, icon: Icon, delta, desc, key }) => (
                  <article className="metric" key={label}>
                    <div className="metric-title">
                      {label}
                      <Icon size={17} />
                    </div>
                    <div className="metric-value">
                      {value}
                      <span>{unit}</span>
                    </div>
                    <div className={`delta ${delta < 0 ? "negative" : ""}`}>
                      {delta >= 0 ? (
                        <ArrowDownRight size={14} />
                      ) : (
                        <ArrowUpRight size={14} />
                      )}{" "}
                      {fmt(Math.abs(delta), 0)}%{" "}
                      {delta >= 0 ? "lower" : "higher"}
                      <span>{desc}</span>
                    </div>
                    {compare && (
                      <div className="baseline-row">
                        No intervention{" "}
                        <strong>
                          {fmt(
                            b[key],
                            key === "commute" || key === "water" ? 0 : 1,
                          )}{" "}
                          {key === "heat"
                            ? "°C"
                            : key === "commute"
                              ? "min"
                              : key === "water"
                                ? "%"
                                : "tCO₂"}
                        </strong>
                      </div>
                    )}
                  </article>
                ),
              )}
            </div>
            <div className="bottom-grid">
              <section className="trajectory card">
                <div className="card-heading">
                  <h3>Carbon, on a different trajectory</h3>
                  <span>tCO₂ / person / year</span>
                </div>
                <div className="chart-legend">
                  <span>
                    <i /> Your scenario
                  </span>
                  <span>
                    <i /> No intervention
                  </span>
                </div>
                <Trend city={city} policy={policy} year={year} />
              </section>
              <section className="score-card card">
                <div className="score-top">
                  <div
                    className="score-circle"
                    style={{ "--score": `${score}%` }}
                  >
                    <span>
                      {score}
                      <small>/ 100</small>
                    </span>
                  </div>
                  <div>
                    <span className="section-label">SUSTAINABILITY INDEX</span>
                    <h3>
                      {score >= 65
                        ? "A more resilient tomorrow."
                        : score >= 45
                          ? "Moving in the right direction."
                          : "There’s room to rethink."}
                    </h3>
                    <p>
                      {score >= 65
                        ? "Your interventions work together to build a cleaner, cooler city."
                        : "Try a balanced scenario to explore the benefits of connected planning."}
                    </p>
                  </div>
                </div>
                <div className="score-note">
                  <Leaf size={14} />
                  <span>Connected systems. Compounding benefits.</span>
                  <button
                    aria-label="Read index methodology"
                    onClick={() => setModal("method")}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </section>
            </div>
          </>
        ) : tab === "scenarios" ? (
          <section className="page-content">
            <div className="section-label">THREE PATHS. ONE CITY.</div>
            <h2>What kind of future would you build?</h2>
            <p className="muted">
              Choose a policy package, then refine it in the simulation lab.
            </p>
            <div className="scenario-grid">
              {[
                [
                  "balanced",
                  "01",
                  "The balanced city",
                  "Invest across connected systems. A pragmatic combination of cleaner mobility, urban nature and resilient infrastructure.",
                  Leaf,
                ],
                [
                  "mobility",
                  "02",
                  "People-first mobility",
                  "Make public transit the backbone of the city. Explore the impact of shifting more trips away from private vehicles.",
                  TrainFront,
                ],
                [
                  "climate",
                  "03",
                  "A climate-ready district",
                  "Prioritise urban cooling, clean energy and water capture. See the sustainability benefits—and the investment trade-off.",
                  Sun,
                ],
              ].map(([key, num, name, desc, Icon]) => {
                const r = simulate(city, presets[key]);
                return (
                  <article className="scenario-card" key={key}>
                    <div className="scenario-art">
                      <Icon size={66} strokeWidth={1} />
                      <span>{num}</span>
                    </div>
                    <h3>{name}</h3>
                    <p>{desc}</p>
                    <div className="scenario-stat">
                      <strong>
                        {fmt(r.reduction, 0)}%
                        <small>lower carbon in 2035</small>
                      </strong>
                      <strong>
                        ₹{r.cost.toLocaleString("en-IN")}
                        <small>crore investment</small>
                      </strong>
                    </div>
                    <button
                      className="run-button"
                      onClick={() => {
                        apply(key);
                        setYear(2035);
                        setTab("lab");
                      }}
                    >
                      Explore this scenario <ArrowRight size={15} />
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="context-note">
              <MapPin size={20} />
              <div>
                <strong>
                  Currently exploring {c.name}, {c.state}
                </strong>
                <p>
                  {c.context} All presets use the same transparent educational
                  model.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="page-content methodology">
            <span className="section-label">TRANSPARENT BY DESIGN</span>
            <h2>
              A model to start a conversation.
              <br />
              Not a prediction to end one.
            </h2>
            <p className="method-intro">
              Inspired by your presentation on urban systems simulation, this
              lab demonstrates how policy choices ripple across a city. It is a
              simplified deterministic scenario model—not a sensor-fed digital
              twin, SUMO traffic simulation or validated city forecast.
            </p>
            <div className="method-grid">
              <article className="card">
                <BookOpen size={24} />
                <h3>What the model does</h3>
                <p>
                  Four policy levers drive linked outcomes: transit reduces
                  carbon and commute time; green cover reduces heat and water
                  stress; rooftop solar lowers carbon and heat; rainwater
                  capture reduces the supply gap.
                </p>
                <p>
                  Baseline values and city profiles are illustrative inputs
                  chosen for classroom comparison. Population and area are
                  approximate context values, not model calibration data.
                </p>
              </article>
              <article className="card">
                <ChartNoAxesCombined size={24} />
                <h3>How outcomes are calculated</h3>
                <p>
                  Policy changes are measured against 25% transit, 15% green
                  cover, 10% rooftop solar and 15% rainwater capture. Adoption
                  increases linearly from 2026 to 2035, then holds steady.
                </p>
                <p>
                  Carbon demand grows by 1.8–3% annually depending on the city.
                  Mobility and climate benefits multiply against that
                  trajectory; results are bounded to avoid impossible values.
                </p>
              </article>
              <article className="card">
                <ShieldCheck size={24} />
                <h3>Costs & sustainability index</h3>
                <p>
                  Illustrative investment uses ₹5,600 Cr per 100 percentage
                  points of additional transit, ₹4,200 Cr for green cover,
                  ₹2,800 Cr for solar and ₹1,800 Cr for capture systems.
                </p>
                <p>
                  Index = 35 + 0.95 × carbon reduction (%) + 7 × heat reduction
                  (°C) + 0.65 × water-gap reduction (percentage points), capped
                  at 100. It is a demo index, not an official rating.
                </p>
              </article>
              <article className="card">
                <Layers size={24} />
                <h3>What a real deployment needs</h3>
                <p>
                  Ward-level GIS, traffic counts, energy demand, rainfall and
                  building inventories; calibrated models; sensitivity analysis;
                  and consultation with residents.
                </p>
                <p>
                  Streets, water bodies, parks and building footprints come from
                  OpenStreetMap via OpenFreeMap. Dense building footprints come from
                  Overture Maps (September 2026 release), including satellite-derived
                  footprints. Heights use mapped or dataset-estimated values, with an
                  illustrative 8 m default where missing. Colored
                  policy overlays illustrate scenarios, not measured spatial
                  conditions or exact infrastructure proposals. Map tiles require
                  internet access; this is not a live city digital twin.
                </p>
              </article>
            </div>
            <details className="equations">
              <summary>View the model equations and assumptions</summary>
              <pre>{`T = (transit − 25) / 100; G = (green − 15) / 100\nS = (solar − 10) / 100; W = (capture − 15) / 100\nA = clamp((year − 2026) / 9, 0, 1)\nR = clamp(A × (0.48T + 0.32S + 0.22G + 0.08TG), −0.3, 0.8)\nCarbon = baseline carbon × demand growth^(year − 2026) × (1 − R)\nCommute = baseline commute × (1 + 0.009 × elapsed years) × (1 − A(0.52T + 0.12G))\nHeat = max(0.5, baseline heat + 0.04 × elapsed years − A(5G + 0.65S))\nWater gap = max(3, baseline gap + 0.65 × elapsed years − A(31W + 14G))\nInvestment = 5600 × max(0,T) + 4200 × max(0,G) + 2800 × max(0,S) + 1800 × max(0,W)`}</pre>
            </details>
            <div className="references">
              <h3>Further reading · tools from your presentation</h3>
              <a
                href="https://www.mdpi.com/2071-1050/12/6/2307"
                target="_blank"
                rel="noreferrer"
              >
                Dembski et al. (2020) · Herrenberg Urban Digital Twin{" "}
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://eclipse.dev/sumo/"
                target="_blank"
                rel="noreferrer"
              >
                Eclipse SUMO · microscopic traffic simulation{" "}
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://www.matsim.org/"
                target="_blank"
                rel="noreferrer"
              >
                MATSim · agent-based transport modelling{" "}
                <ArrowUpRight size={14} />
              </a>
              <p>
                These resources inspire the project; they are not engines
                running inside this application.
              </p>
            </div>
          </section>
        )}
        <footer>
          <span>
            <span className="footer-symbol">◈</span> Built for better urban
            conversations.
          </span>
          <span>
            INDIA FOCUSED <i /> EDUCATIONAL SIMULATION{" "}
            <button
              onClick={() => {
                setTab("method");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              About the model <ArrowUpRight size={12} />
            </button>
          </span>
        </footer>
      </main>
      {demo >= 0 && (
        <div className="demo-overlay">
          <div className="demo-progress">
            {steps.map((_, i) => (
              <button
                key={i}
                aria-label={`Demo step ${i + 1}`}
                className={i <= demo ? "active" : ""}
                onClick={() => demoStep(i)}
              />
            ))}
          </div>
          <div className="demo-copy">
            <span>LIVE DEMO · {demo + 1} OF 4</span>
            <h3>{steps[demo].title}</h3>
            <p>{steps[demo].body}</p>
          </div>
          <div className="demo-actions">
            {demo > 0 && (
              <button className="outline" onClick={() => demoStep(demo - 1)}>
                Back
              </button>
            )}
            <button
              className="run-button"
              onClick={() => (demo < 3 ? demoStep(demo + 1) : setDemo(-1))}
            >
              {demo < 3 ? "Next step" : "Explore the lab"}{" "}
              <ArrowRight size={14} />
            </button>
            <button
              className="icon-button"
              aria-label="Close presentation mode"
              onClick={() => setDemo(-1)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className={`modal ${modal === "city" ? "big" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Simulation information"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "city" ? (
              <>
                <span className="section-label">URBAN SYSTEMS LAB</span>
                <h2>
                  {c.name} · {year}
                </h2>
                <div className="expanded-city">
                  <CityMap
                    policy={policy}
                    layer={layer}
                    running={running}
                    city={city}
                  />
                </div>
                <p className="muted">
                  Real geography / illustrative scenario · {policy.transit}% public transit ·{" "}
                  {policy.green}% green cover · {policy.solar}% solar rooftops
                </p>
              </>
            ) : (
              <>
                <span className="section-label">ABOUT THIS SIMULATION</span>
                <h2>
                  {modal === "levers"
                    ? "Four levers. One connected city."
                    : "Explore possibilities, not predictions."}
                </h2>
                <p>
                  Adjust policies to understand their connected effects on
                  mobility, carbon, urban heat and water resilience. Compare
                  each scenario against a no-intervention baseline in the same
                  year.
                </p>
                <p>
                  All city inputs, cost coefficients and outcomes are
                  illustrative classroom assumptions. This is not an official
                  city forecast or a live digital twin.
                </p>
                <button
                  className="run-button"
                  onClick={() => {
                    setModal(null);
                    setTab("method");
                  }}
                >
                  Read full methodology <ArrowRight size={15} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
