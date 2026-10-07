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
  MoveUpRight,
  Wind,
  Clock,
  Thermometer,
  ShieldCheck,
} from "lucide-react";
import { cities, baseline, presets, simulate } from "./model.js";
import "./style.css";
const fmt = (n, d = 1) => n.toFixed(d);
function CityCanvas({ policy, layer, running, city }) {
  const canvas = useRef(null),
    params = useRef({ policy, layer, running, city });
  params.current = { policy, layer, running, city };
  useEffect(() => {
    let frame,
      phase = 0;
    const el = canvas.current,
      ctx = el.getContext("2d");
    function render() {
      const box = el.getBoundingClientRect(),
        dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (el.width !== box.width * dpr || el.height !== box.height * dpr) {
        el.width = box.width * dpr;
        el.height = box.height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = box.width,
        H = box.height;
      ctx.clearRect(0, 0, W, H);
      const { policy: p, layer: l, running: r, city: c } = params.current;
      phase += window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : r
          ? 0.014
          : 0.003;
      const size = Math.min(W / 21, H / 15),
        ox = W * 0.5,
        oy = H * 0.22;
      const pt = (x, y, z = 0) => [
        ox + (x - y) * size,
        oy + (x + y) * size * 0.49 - z,
      ];
      const poly = (points, fill, stroke) => {
        ctx.beginPath();
        points.forEach((v, i) => (i ? ctx.lineTo(...v) : ctx.moveTo(...v)));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      };
      const tile = (x, y, w, d, color) =>
        poly([pt(x, y), pt(x + w, y), pt(x + w, y + d), pt(x, y + d)], color);
      const line = (a, b, col, width) => {
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.strokeStyle = col;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      const building = (x, y, w, d, h, col) => {
        const a = pt(x, y),
          b = pt(x + w, y),
          cc = pt(x + w, y + d),
          dd = pt(x, y + d);
        const top = (v) => [v[0], v[1] - h];
        poly([dd, cc, top(cc), top(dd)], col[1]);
        poly([b, cc, top(cc), top(b)], col[2]);
        poly([top(a), top(b), top(cc), top(dd)], col[0], "#ffffff70");
        for (let z = 8; z < h - 4; z += 9) {
          line([dd[0] + 3, dd[1] - z], [cc[0] - 3, cc[1] - z], "#ffffff60", 1);
          line([b[0] + 2, b[1] - z], [cc[0] - 2, cc[1] - z], "#ffffff40", 1);
        }
        if ((Math.round(x) * 17 + Math.round(y) * 31) % 100 < p.solar) {
          poly(
            [
              pt(x + 0.08, y + 0.08, h + 1),
              pt(x + w * 0.85, y + 0.08, h + 1),
              pt(x + w * 0.85, y + d * 0.65, h + 1),
              pt(x + 0.08, y + d * 0.65, h + 1),
            ],
            "#526f7c",
          );
        }
      };
      const tree = (x, y, k = 1) => {
        const a = pt(x, y);
        line(a, [a[0], a[1] - 12 * k], "#8e9b83", 2);
        ctx.fillStyle = "#8daa79";
        ctx.beginPath();
        ctx.ellipse(a[0], a[1] - 17 * k, 8 * k, 11 * k, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#a1bc8d";
        ctx.beginPath();
        ctx.ellipse(
          a[0] - 2 * k,
          a[1] - 20 * k,
          5 * k,
          7 * k,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      };
      ctx.save();
      ctx.shadowColor = "#273c3020";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 20;
      tile(-0.4, -0.4, 10.8, 10.8, "#e1e7df");
      ctx.restore();
      poly(
        [
          pt(-0.4, 10.4),
          pt(10.4, 10.4),
          pt(10.4, 10.4, -9),
          pt(-0.4, 10.4, -9),
        ],
        "#cfd7cc",
      );
      poly(
        [
          pt(10.4, -0.4),
          pt(10.4, 10.4),
          pt(10.4, 10.4, -9),
          pt(10.4, -0.4, -9),
        ],
        "#d8dfd3",
      );
      for (let i = 0; i < 10; i++) {
        tile(i, 0, 0.23, 10, "#f9faf5");
        tile(0, i, 10, 0.23, "#f9faf5");
        if (i === 3 || i === 7) {
          tile(i, 0, 0.27, 10, "#d0d8d1");
          tile(0, i, 10, 0.27, "#d0d8d1");
        }
      }
      // A schematic river, not a geographic map.
      poly(
        [
          pt(-0.4, 7.4),
          pt(2.5, 7.1),
          pt(4.8, 8.5),
          pt(7.5, 8.7),
          pt(10.4, 8),
          pt(10.4, 8.65),
          pt(7.5, 9.35),
          pt(4.6, 9.1),
          pt(2.4, 7.75),
          pt(-0.4, 8.05),
        ],
        "#b9d5d7",
      );
      for (let sum = 0; sum < 19; sum++)
        for (let x = 0; x < 10; x++) {
          const y = sum - x;
          if (
            y < 0 ||
            y >= 10 ||
            x === 3 ||
            x === 7 ||
            y === 3 ||
            y === 7 ||
            y === 8
          )
            continue;
          const seed = (x * 17 + y * 31 + c.length * 7) % 23,
            park =
              seed < p.green / 7 ||
              ((x === 4 || x === 5) && (y === 4 || y === 5));
          if (park) {
            tile(x + 0.25, y + 0.25, 0.7, 0.7, "#c4d5b3");
            tree(x + 0.47, y + 0.45, 0.85);
            tree(x + 0.77, y + 0.72, 0.7);
            continue;
          }
          let col = ["#e7e8e1", "#cdd2c9", "#b9c2b8"];
          if (l === "heat")
            col =
              seed % 3 === 0
                ? ["#e6bea1", "#d9b49c", "#c89c88"]
                : ["#ead4b4", "#d7c4a8", "#cbb797"];
          if (l === "energy")
            col = seed < p.solar / 4 ? ["#b2cbd5", "#a1b9c4", "#8eaab7"] : col;
          const h =
            seed % 5 === 0 ? size * 2.1 : size * (0.4 + (seed / 23) * 0.9);
          building(x + 0.28, y + 0.28, 0.56, 0.56, h, col);
          if (seed % 4 === 0) tree(x + 0.85, y + 0.4, 0.65);
        }
      // Metro/BRT spine and animated transport agents.
      if (p.transit > 35) {
        line(pt(3.12, 0.05, 4), pt(3.12, 9.9, 4), "#638c76", 3);
        for (const y of [1.5, 4.5, 6.5, 9.3]) {
          const a = pt(3.12, y, 4);
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(...a, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#638c76";
          ctx.stroke();
        }
      }
      for (let i = 0; i < 22; i++) {
        const t = (phase * ((i % 3) + 1) * 0.35 + i * 0.43) % 9.6;
        const bus = i < Math.floor(p.transit / 13);
        const a = i % 2 ? pt(t, 7.12, 2) : pt(3.12, t, 6);
        ctx.save();
        ctx.translate(...a);
        ctx.rotate(i % 2 ? Math.atan(0.49) : -Math.atan(0.49));
        ctx.fillStyle = bus ? "#356a50" : "#bb8f63";
        ctx.fillRect(-3, -2, bus ? 12 : 6, 3);
        ctx.restore();
      }
      if (l === "water")
        for (let i = 0; i < 5; i++) {
          const a = pt(2 + i * 1.3, 8.8);
          ctx.beginPath();
          ctx.arc(...a, 12 + Math.sin(phase + i) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = "#7aaeb988";
          ctx.stroke();
        }
      frame = requestAnimationFrame(render);
    }
    render();
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <canvas
      ref={canvas}
      aria-label={`Animated schematic urban district of ${cities[city].name}; ${layer} view. Not a geographic map.`}
    />
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
  const [city, setCity] = useState("pune"),
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
      body: "Start with Pune’s illustrative baseline. Its transport, buildings, green spaces and water systems affect one another.",
      policy: baseline,
      layer: "overview",
    },
    {
      title: "Move people, not just cars.",
      body: "Raise public transport adoption to 80%. Watch the transit corridor appear and commute times improve.",
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
    setCity("pune");
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
                  Urban district simulation
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
                    <span className="section-label">THE CITY, REIMAGINED</span>
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
                  <CityCanvas
                    city={city}
                    policy={policy}
                    layer={layer}
                    running={running}
                  />
                  <div className="compass">
                    N<MoveUpRight size={19} />
                  </div>
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
                    CONCEPTUAL DISTRICT · NOT TO SCALE
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
                  The animated district is schematic. Moving vehicles are visual
                  agents, not simulated congestion. Layers illustrate
                  interventions, not measured spatial conditions.
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
                  <CityCanvas
                    policy={policy}
                    layer={layer}
                    running={running}
                    city={city}
                  />
                </div>
                <p className="muted">
                  Schematic visualisation · {policy.transit}% public transit ·{" "}
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
