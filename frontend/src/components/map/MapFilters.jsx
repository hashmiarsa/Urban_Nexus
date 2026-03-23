import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// MapFilters.jsx
//
// Collapsible filter panel that sits on top of the map.
// Emits a `filters` object upward via onChange.
// Parent (MapView / CityMap) applies filters to the GeoJSON features.
//
// Filters:
//   type       â€” road | water | electricity | sewage | parks | other
//   status     â€” pending | approved | ongoing | completed | rejected | clashed
//   department â€” free-text search on department code
// ---------------------------------------------------------------------------

const PROJECT_TYPES = [
  { value: "road",        label: "Road" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sewage",      label: "Sewage" },
  { value: "parks",       label: "Parks" },
  { value: "other",       label: "Other" },
];

const PROJECT_STATUSES = [
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "clashed",   label: "Clashed" },
];

// Status badge colors
const STATUS_COLORS = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved:  "bg-green-100  text-green-800  border-green-300",
  ongoing:   "bg-blue-100   text-blue-800   border-blue-300",
  completed: "bg-gray-100   text-gray-600   border-gray-300",
  clashed:   "bg-red-100    text-red-800    border-red-300",
};

const TYPE_COLORS = {
  road:        "bg-amber-100  text-amber-800  border-amber-300",
  water:       "bg-blue-100   text-blue-800   border-blue-300",
  electricity: "bg-orange-100 text-orange-800 border-orange-300",
  sewage:      "bg-purple-100 text-purple-800 border-purple-300",
  parks:       "bg-emerald-100 text-emerald-800 border-emerald-300",
  other:       "bg-gray-100   text-gray-600   border-gray-300",
};

const DEFAULT_FILTERS = {
  types:      [],  // empty = all types shown
  statuses:   [],  // empty = all statuses shown
  department: "",
};

/**
 * Collapsible filter panel for the city map
 *
 * @param {function} props.onChange  - Called with filters object when any filter changes
 * @param {number}   props.count     - Number of projects currently shown (for display)
 */
const MapFilters = ({ onChange, count = 0 }) => {
  const [filters, setFilters]     = useState(DEFAULT_FILTERS);
  const [expanded, setExpanded]   = useState(false);

  const activeCount =
    filters.types.length + filters.statuses.length + (filters.department ? 1 : 0);

  const update = (newFilters) => {
    setFilters(newFilters);
    onChange?.(newFilters);
  };

  const toggleType = (value) => {
    const updated = filters.types.includes(value)
      ? filters.types.filter((t) => t !== value)
      : [...filters.types, value];
    update({ ...filters, types: updated });
  };

  const toggleStatus = (value) => {
    const updated = filters.statuses.includes(value)
      ? filters.statuses.filter((s) => s !== value)
      : [...filters.statuses, value];
    update({ ...filters, statuses: updated });
  };

  const clearAll = () => {
    update(DEFAULT_FILTERS);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Filters
          </span>
          {activeCount > 0 && (
            <span className="text-xs bg-emerald-600 text-white rounded-full px-1.5 py-0.5 font-medium">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{count} projects</span>
          {expanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded filter body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-3">

          {/* Type filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Project Type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleType(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    filters.types.includes(value)
                      ? TYPE_COLORS[value]
                      : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleStatus(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    filters.statuses.includes(value)
                      ? STATUS_COLORS[value]
                      : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Department filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Department
            </p>
            <input
              type="text"
              placeholder="e.g. PWD, WB, ELEC"
              value={filters.department}
              onChange={(e) =>
                update({ ...filters, department: e.target.value.toUpperCase() })
              }
              className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
            >
              <X size={12} />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MapFilters;
