import { useState, useEffect } from "react";
import { useNavigate }        from "react-router-dom";
import { AlertTriangle, CheckCircle, ChevronRight, Clock } from "lucide-react";
import Skeleton               from "../common/Skeleton";
import Badge                  from "../common/Badge";
import conflictApi from "../../api/conflict.api";;

// ---------------------------------------------------------------------------
// ConflictList.jsx â€” paginated list of conflicts
// Used on /conflicts page.
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { key: "all",      label: "All" },
  { key: "open",     label: "Open" },
  { key: "resolved", label: "Resolved" },
];

const ConflictList = () => {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await conflictApi.getAll();
        setConflicts(res.data || []);
      } catch (err) {
        console.error("[ConflictList] fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = activeTab === "all"
    ? conflicts
    : conflicts.filter((c) => c.status === activeTab);

  const openCount     = conflicts.filter((c) => c.status === "open").length;
  const resolvedCount = conflicts.filter((c) => c.status === "resolved").length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === key
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {label}{" "}
            {key === "open" && openCount > 0 && (
              <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {openCount}
              </span>
            )}
            {key === "resolved" && resolvedCount > 0 && (
              <span className="ml-1 text-xs bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-full px-1.5 py-0.5">
                {resolvedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Skeleton.List rows={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">âœ…</div>
          <p className="text-sm font-medium">No {activeTab === "all" ? "" : activeTab} conflicts</p>
          <p className="text-xs mt-1">All projects are running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((conflict) => (
            <button
              key={conflict._id}
              onClick={() => navigate(`/conflicts/${conflict._id}`)}
              className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  conflict.status === "open"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}>
                  {conflict.status === "open"
                    ? <AlertTriangle size={18} className="text-red-500" />
                    : <CheckCircle  size={18} className="text-emerald-500" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {conflict.projectA?.title || "Project A"}
                    </p>
                    <span className="text-gray-400 text-xs">vs</span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {conflict.projectB?.title || "Project B"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {conflict.overlapDates?.start
                        ? `Overlap: ${new Date(conflict.overlapDates.start).toLocaleDateString("en-IN")} â€“ ${new Date(conflict.overlapDates.end).toLocaleDateString("en-IN")}`
                        : "Date overlap detected"}
                    </span>
                    <Badge
                      variant={conflict.status === "open" ? "danger" : "success"}
                      size="sm"
                    >
                      {conflict.status === "open" ? "Open" : "Resolved"}
                    </Badge>
                    {conflict.recommendation?.scores && (
                      <span className="text-[11px] text-gray-400">
                        MCDM scored
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-1 transition-colors"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictList;




