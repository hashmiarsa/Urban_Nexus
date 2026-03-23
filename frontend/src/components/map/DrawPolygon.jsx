import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// DrawPolygon.jsx
//
// A self-contained Leaflet map widget used inside ProjectForm.jsx.
// Lets officers draw a polygon on the map to define their project's location.
//
// Uses Leaflet's built-in editing API directly (no leaflet-draw dependency)
// via a custom draw-mode that tracks clicks and builds a polygon.
//
// Props:
//   value    â€” current GeoJSON Polygon geometry { type, coordinates } or null
//   onChange â€” called with GeoJSON Polygon geometry when polygon is finalised
//   center   â€” [lat, lng] map center default (default: Ghaziabad, UP)
// ---------------------------------------------------------------------------

// Default center: Ghaziabad, Uttar Pradesh
const DEFAULT_CENTER = [28.6692, 77.4538];
const DEFAULT_ZOOM   = 14;

// Fixes Leaflet marker icon issue in Vite/webpack builds
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// ---------------------------------------------------------------------------
// Inner component â€” has access to Leaflet map instance via useMap()
// ---------------------------------------------------------------------------
const DrawControl = ({ isDrawing, onPolygonComplete, existingPolygon }) => {
  const map         = useMap();
  const pointsRef   = useRef([]);
  const markersRef  = useRef([]);
  const polylineRef = useRef(null);
  const polygonRef  = useRef(null);

  // Render existing polygon on mount / value change
  useEffect(() => {
    // Clear any existing rendered polygon
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (!existingPolygon?.coordinates?.[0]) return;

    const coords = existingPolygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
    polygonRef.current = L.polygon(coords, {
      color:       "#10B981",
      fillColor:   "#10B981",
      fillOpacity: 0.25,
      weight:      2,
    }).addTo(map);

    // Fit map to polygon bounds
    map.fitBounds(polygonRef.current.getBounds(), { padding: [30, 30] });
  }, [existingPolygon, map]);

  // Manage click-to-draw when isDrawing changes
  useEffect(() => {
    if (!isDrawing) {
      // Clean up drawing state
      map.off("click", handleClick);
      clearDrawing();
      return;
    }

    // Clear previous polygon display while drawing
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    map.getContainer().style.cursor = "crosshair";
    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.getContainer().style.cursor = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing]);

  const handleClick = (e) => {
    const { lat, lng } = e.latlng;
    pointsRef.current.push([lat, lng]);

    // Place a small circle marker at each vertex
    const marker = L.circleMarker([lat, lng], {
      radius:      5,
      color:       "#10B981",
      fillColor:   "#10B981",
      fillOpacity: 1,
      weight:      2,
    }).addTo(map);
    markersRef.current.push(marker);

    // Draw/update preview polyline
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (pointsRef.current.length > 1) {
      polylineRef.current = L.polyline(pointsRef.current, {
        color: "#10B981",
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);
    }
  };

  const clearDrawing = () => {
    pointsRef.current = [];
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    map.getContainer().style.cursor = "";
  };

  // Exposed via ref by parent â€” "finalise" current drawing
  const finalise = () => {
    const pts = pointsRef.current;
    if (pts.length < 3) return null;

    // Close the polygon by repeating the first point
    const closed = [...pts, pts[0]];
    // Convert [lat, lng] â†’ [lng, lat] for GeoJSON
    const geoCoords = [closed.map(([lat, lng]) => [lng, lat])];

    const geoJson = {
      type:        "Polygon",
      coordinates: geoCoords,
    };

    // Render the finalised polygon
    if (polygonRef.current) map.removeLayer(polygonRef.current);
    polygonRef.current = L.polygon(pts, {
      color:       "#10B981",
      fillColor:   "#10B981",
      fillOpacity: 0.25,
      weight:      2,
    }).addTo(map);

    clearDrawing();
    onPolygonComplete(geoJson);
    return geoJson;
  };

  // Expose finalise and getPoints via a ref trick
  useEffect(() => {
    if (window.__drawControlRef) {
      window.__drawControlRef.finalise   = finalise;
      window.__drawControlRef.getPoints  = () => pointsRef.current;
      window.__drawControlRef.clearDrawing = clearDrawing;
    }
  });

  return null;
};

// ---------------------------------------------------------------------------
// Public DrawPolygon component
// ---------------------------------------------------------------------------
const DrawPolygon = ({ value, onChange, center = DEFAULT_CENTER }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const controlRef = useRef({});

  // Register ref so DrawControl can expose methods
  window.__drawControlRef = controlRef.current;

  const startDrawing = () => {
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    const geo = controlRef.current.finalise?.();
    if (!geo) {
      // Not enough points â€” stay in draw mode
      return;
    }
    setIsDrawing(false);
    onChange?.(geo);
  };

  const clearPolygon = () => {
    controlRef.current.clearDrawing?.();
    setIsDrawing(false);
    onChange?.(null);
  };

  const hasPolygon = Boolean(value?.coordinates?.[0]?.length >= 3);

  return (
    <div className="space-y-2">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: "320px", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <DrawControl
            isDrawing={isDrawing}
            onPolygonComplete={(geo) => {
              setIsDrawing(false);
              onChange?.(geo);
            }}
            existingPolygon={value}
          />
        </MapContainer>

        {/* Drawing mode indicator */}
        {isDrawing && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-medium">
            Click to add vertices Â· 3 minimum
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isDrawing && !hasPolygon && (
          <button
            type="button"
            onClick={startDrawing}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            <Pencil size={14} />
            Draw Area
          </button>
        )}

        {isDrawing && (
          <button
            type="button"
            onClick={finishDrawing}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            <CheckCircle size={14} />
            Finish Drawing
          </button>
        )}

        {hasPolygon && !isDrawing && (
          <>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle size={13} />
              Area defined
            </span>
            <button
              type="button"
              onClick={() => { clearPolygon(); startDrawing(); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors ml-2"
            >
              <Pencil size={12} />
              Redraw
            </button>
            <button
              type="button"
              onClick={clearPolygon}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DrawPolygon;
