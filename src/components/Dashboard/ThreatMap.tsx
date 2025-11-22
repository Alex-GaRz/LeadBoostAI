import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// URL TopoJSON estándar (mapa mundial simplificado)
const GEO_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const ThreatMap: React.FC = () => {
  // Simulación de señales globales (En v2 esto vendrá del BFF/Bloque 1)
  const signals = [
    { name: "New York", coordinates: [-74.006, 40.7128], value: 45 },
    { name: "London", coordinates: [-0.1276, 51.5074], value: 30 },
    { name: "Tokyo", coordinates: [139.6917, 35.6895], value: 80 },
    { name: "Berlin", coordinates: [13.4050, 52.5200], value: 25 },
    { name: "Mexico City", coordinates: [-99.1332, 19.4326], value: 60 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-full min-h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest">Global Signal Source</h3>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500 border border-slate-700">REAL-TIME</span>
      </div>
      
      <div className="flex-grow w-full h-full">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 100 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b" // slate-800
                  stroke="#0f172a" // slate-900
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#334155", outline: "none" }, // slate-700
                    pressed: { fill: "#475569", outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {signals.map(({ name, coordinates, value }) => (
            <Marker key={name} coordinates={coordinates as [number, number]}>
              <circle r={4} fill="#10b981" stroke="#064e3b" strokeWidth={2} className="animate-pulse" />
              <title>{name}: {value} signals detected</title>
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  );
};

export default ThreatMap;
