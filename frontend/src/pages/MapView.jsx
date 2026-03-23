import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Layers, AlertTriangle, RefreshCw } from "lucide-react";
import CityMap from "../components/map/CityMap";

// ---------------------------------------------------------------------------
// MapView.jsx â€” Full city map page
//
// Replaces the Phase 3 placeholder.
// Features:
//   â€” Full-height CityMap with filter panel
//   â€” Legend for project type colors and status patterns
//   â€” Click polygon â†’ navigate to project detail
// ---------------------------------------------------------------------------

// Legend data matches ProjectMarker TYPE_COLORS exactly
const TYPE_LEGEND = [
  { label: "Road",        color: "#F59E0B" },
  { label: "Water",       color: "#3B82F6" },
  { label: "Electricity", color: "#F97316" },
  { label: "Sewage",      color: "#8B5CF6" },
  { label: "Parks",       color: "#10B981" },
  { label: "Other",       color: "#6B7280" },
];

const STATUS_LEGEND = [
  { label: "Pending",   style: "border-dashed border-2 border-gray-400 bg-gray-100" },
  { label: "Approved",  style: "bg-emerald-200 border border-emerald-400" },
  { label: "Ongoing",   style: "bg-blue-300 border border-blue-500" },
  { label: "Completed", style: "bg-gray-200 opacity-60 border border-gray-300" },
  { label: "Clashed",   style: "bg-red-200 border-2 border-dashed border-red-400" },
];

const MapView = () => {
  const navigate           = useNavigate();
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Map size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              City Project Map
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All active infrastructure projects across departments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle legend */}
          <button
            onClick={() => setShowLegend((s) => !s)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Layers size={14} />
            {showLegend ? "Hide" : "Show"} Legend
          </button>
        </div>
      </div>

      {/* Main content â€” map + legend */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Map â€” fills remaining space */}
        <div className="flex-1 relative p-4">
          <CityMap
            height="100%"
            showFilters
            onProjectClick={(id) => navigate(`/projects/${id}`)}
          />
        </div>

        {/* Legend sidebar */}
        {showLegend && (
          <div className="w-52 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            {/* Project types */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Project Type
              </p>
              <div className="space-y-2">
                {TYPE_LEGEND.map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-sm flex-shrink-0 border"
                      style={{
                        backgroundColor: color + "55",
                        borderColor:     color,
                      }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status patterns */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Status
              </p>
              <div className="space-y-2">
                {STATUS_LEGEND.map(({ label, style }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-sm flex-shrink-0 ${style}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Click any polygon to view project details.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
