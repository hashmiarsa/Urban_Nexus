import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import ProjectMarker from "./ProjectMarker";
import MapFilters    from "./MapFilters";
import useThemeStore from "../../store/themeStore";
import projectApi from '../../api/project.api'
// ---------------------------------------------------------------------------
// CityMap.jsx
//
// The full city-wide map showing all active infrastructure projects.
// Features:
//   â€” Fetches GeoJSON from GET /api/v1/projects/map
//   â€” Renders each project as a colored polygon via ProjectMarker
//   â€” MapFilters panel applies client-side filtering without re-fetching
//   â€” Light/dark tile layer switches with theme
//   â€” Clicking a polygon navigates to /projects/:id
//   â€” Conflict overlay: clashed projects pulse red
//
// Map tile providers (from HANDOFF.md Section 18.5):
//   Light: CartoDB Positron
//   Dark:  CartoDB DarkMatter
// ---------------------------------------------------------------------------

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Default center: Ghaziabad, UP
const DEFAULT_CENTER = [28.6692, 77.4538];
const DEFAULT_ZOOM   = 13;

// ---------------------------------------------------------------------------
// TileLayerSwitcher â€” swaps tile URL when theme changes
// Must be inside MapContainer to access useMap()
// ---------------------------------------------------------------------------
const TileLayerSwitcher = ({ isDark }) => {
  const map  = useMap();
  const url  = isDark ? DARK_TILES : LIGHT_TILES;

  useEffect(() => {
    // Invalidate map size after theme switch to force re-render
    setTimeout(() => map.invalidateSize(), 100);
  }, [isDark, map]);

  return (
    <TileLayer
      key={url}       // key change forces React to remount with new tiles
      url={url}
      attribution={ATTRIBUTION}
      maxZoom={19}
    />
  );
};

// ---------------------------------------------------------------------------
// Main CityMap component
// ---------------------------------------------------------------------------
const CityMap = ({ height = "100%", showFilters = true, onProjectClick }) => {
  const navigate       = useNavigate();
  const { isDark }     = useThemeStore();
  const [features, setFeatures] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState({ types: [], statuses: [], department: "" });

  // -------------------------------------------------------------------------
  // Fetch GeoJSON data from backend
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await projectApi.getMapProjects();
        const featureList = res?.data?.data?.features || [];
        setFeatures(featureList);
        setFiltered(featureList);
      } catch (err) {
        setError("Failed to load map data. Please refresh.");
        console.error("[CityMap] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // Apply filters client-side whenever features or filter values change
  // -------------------------------------------------------------------------
  useEffect(() => {
    let result = [...features];

    if (filters.types.length > 0) {
      result = result.filter((f) => filters.types.includes(f.properties?.type));
    }

    if (filters.statuses.length > 0) {
      result = result.filter((f) => filters.statuses.includes(f.properties?.status));
    }

    if (filters.department) {
      result = result.filter((f) =>
        f.properties?.department
          ?.toUpperCase()
          .includes(filters.department.toUpperCase())
      );
    }

    setFiltered(result);
  }, [features, filters]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleProjectClick = useCallback((projectId) => {
    if (onProjectClick) {
      onProjectClick(projectId);
    } else {
      navigate(`/projects/${projectId}`);
    }
  }, [navigate, onProjectClick]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="relative w-full" style={{ height }}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading map dataâ€¦</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-xl">
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <MapFilters onChange={handleFiltersChange} count={filtered.length} />
      )}

      {/* Leaflet map */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        className="rounded-xl"
      >
        <TileLayerSwitcher isDark={isDark} />

        {filtered.map((feature) => (
          <ProjectMarker
            key={feature.properties?._id || Math.random()}
            feature={feature}
            onClick={handleProjectClick}
          />
        ))}
      </MapContainer>

      {/* Project count badge */}
      {!loading && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-600">
          {filtered.length} of {features.length} project{features.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default CityMap;








