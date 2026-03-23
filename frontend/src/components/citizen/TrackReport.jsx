import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import reportApi from "../../api/report.api";

// ---------------------------------------------------------------------------
// TrackReport.jsx â€” citizen report status tracker
// Standalone component â€” accepts trackingId input, shows stepper
// ---------------------------------------------------------------------------

const STEPS = ["submitted", "acknowledged", "in_progress", "resolved"];
const STEP_LABELS = {
  submitted:    "Submitted",
  acknowledged: "Acknowledged",
  in_progress:  "In Progress",
  resolved:     "Resolved",
};
const STATUS_COLORS = {
  submitted:    "bg-yellow-100 text-yellow-800",
  acknowledged: "bg-blue-100   text-blue-800",
  in_progress:  "bg-orange-100 text-orange-800",
  resolved:     "bg-emerald-100 text-emerald-800",
};

const TrackReport = ({ initialId = "" }) => {
  const [id,      setId]      = useState(initialId);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleTrack = async () => {
    const tid = id.trim().toUpperCase();
    if (!tid) return;
    setLoading(true); setError(null); setReport(null);
    try {
      const res = await reportApi.track(tid);
      setReport(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Report not found.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = report ? STEPS.indexOf(report.status) : -1;

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="flex gap-2">
        <input type="text" placeholder="CNR-XXXXXX"
          value={id}
          onChange={(e) => setId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          maxLength={10}
          className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="button" onClick={handleTrack} disabled={loading || !id.trim()}
          className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Track
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* Report info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-900 dark:text-white tracking-widest text-base">
                  {report.trackingId}
                </p>
                <p className="text-sm text-gray-500 capitalize mt-0.5">
                  {report.type?.replace("_", " ")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[report.status] || "bg-gray-100 text-gray-600"}`}>
                {STEP_LABELS[report.status] || report.status}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
            )}
            {report.assignedTo && (
              <p className="text-xs text-gray-400 mt-2">Assigned: {report.assignedTo.name}</p>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const done   = idx <= currentStep;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      done
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-400"
                    }`}>
                      {done ? "âœ“" : idx + 1}
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${done ? "text-emerald-600" : "text-gray-400"}`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 ${idx < currentStep ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackReport;


