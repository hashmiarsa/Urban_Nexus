import { Polygon, Tooltip, Popup } from "react-leaflet";

// ---------------------------------------------------------------------------
// ProjectMarker.jsx
//
// Renders a single project as a colored Leaflet Polygon.
// Color is determined by project TYPE (primary) and STATUS (opacity/border).
//
// GeoJSON uses [lng, lat] â€” Leaflet Polygon expects [[lat, lng]].
// This component handles the coordinate flip internally.
// ---------------------------------------------------------------------------

// Color palette by project type â€” matches Urban Nexus design system
const TYPE_COLORS = {
  road:        "#F59E0B",  // amber
  water:       "#3B82F6",  // blue
  electricity: "#F97316",  // orange
  sewage:      "#8B5CF6",  // purple
  parks:       "#10B981",  // green
  other:       "#6B7280",  // gray
};

// Border/fill opacity adjustments by status
const STATUS_STYLE = {
  pending:   { fillOpacity: 0.25, weight: 2, dashArray: "6 4" },
  approved:  { fillOpacity: 0.35, weight: 2, dashArray: null },
  ongoing:   { fillOpacity: 0.50, weight: 3, dashArray: null },
  completed: { fillOpacity: 0.15, weight: 1, dashArray: "2 6" },
  rejected:  { fillOpacity: 0.10, weight: 1, dashArray: "2 6" },
  clashed:   { fillOpacity: 0.45, weight: 3, dashArray: "8 4" },
};

const STATUS_LABELS = {
  pending:   "Pending",
  approved:  "Approved",
  ongoing:   "Ongoing",
  completed: "Completed",
  rejected:  "Rejected",
  clashed:   "Clashed",
};

/**
 * Flips GeoJSON [lng, lat] coordinates to Leaflet [lat, lng] format
 * Works for simple Polygon (first ring only â€” no holes needed for MVP)
 */
const flipCoords = (coordinates) => {
  // coordinates is [[[lng, lat], ...]] â€” GeoJSON Polygon outer ring
  const ring = coordinates[0];
  return ring.map(([lng, lat]) => [lat, lng]);
};

/**
 * Renders a project as a colored Leaflet Polygon with tooltip and popup
 *
 * @param {object} props.feature  - GeoJSON Feature with geometry + properties
 * @param {function} props.onClick - Optional click handler (projectId) => void
 */
const ProjectMarker = ({ feature, onClick }) => {
  if (!feature?.geometry?.coordinates) return null;

  const { _id, title, type, status, department, startDate, endDate } =
    feature.properties || {};

  const color       = TYPE_COLORS[type]   || TYPE_COLORS.other;
  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;

  const positions = flipCoords(feature.geometry.coordinates);

  const pathOptions = {
    color,
    fillColor:   color,
    fillOpacity: statusStyle.fillOpacity,
    weight:      statusStyle.weight,
    dashArray:   statusStyle.dashArray,
  };

  const handleClick = () => {
    if (onClick && _id) onClick(_id);
  };

  return (
    <Polygon
      positions={positions}
      pathOptions={pathOptions}
      eventHandlers={{ click: handleClick }}
    >
      {/* Tooltip â€” shows on hover */}
      <Tooltip sticky>
        <div className="text-xs font-medium">
          <p className="font-semibold text-sm mb-0.5">{title}</p>
          <p className="capitalize">{type} Â· {STATUS_LABELS[status] || status}</p>
          {department && <p className="text-gray-500">{department}</p>}
        </div>
      </Tooltip>

      {/* Popup â€” shows on click */}
      <Popup>
        <div className="text-sm min-w-[180px]">
          <p className="font-semibold text-base mb-1">{title}</p>
          <div className="space-y-0.5 text-gray-600">
            <p>
              <span className="font-medium">Type:</span>{" "}
              <span className="capitalize">{type}</span>
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="capitalize">{STATUS_LABELS[status] || status}</span>
            </p>
            {department && (
              <p>
                <span className="font-medium">Dept:</span> {department}
              </p>
            )}
            {startDate && (
              <p>
                <span className="font-medium">Start:</span>{" "}
                {new Date(startDate).toLocaleDateString("en-IN")}
              </p>
            )}
            {endDate && (
              <p>
                <span className="font-medium">End:</span>{" "}
                {new Date(endDate).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
          {onClick && _id && (
            <button
              onClick={handleClick}
              className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              View Details â†’
            </button>
          )}
        </div>
      </Popup>
    </Polygon>
  );
};

export default ProjectMarker;
export { TYPE_COLORS, STATUS_LABELS };
