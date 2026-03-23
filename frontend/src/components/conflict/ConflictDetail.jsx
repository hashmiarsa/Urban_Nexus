import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, ArrowRight, Trophy,
  BarChart2, ChevronLeft, Loader2,
} from "lucide-react";
import Skeleton              from "../common/Skeleton";
import Badge                 from "../common/Badge";
import conflictApi from "../../api/conflict.api";
import useAuthStore          from "../../store/authStore";

// ---------------------------------------------------------------------------
// ConflictDetail.jsx
//
// Full conflict detail:
//   â€” Both projects side-by-side with MCDM scores
//   â€” Recommended execution order with explanation
//   â€” Resolve form (admin only)
// ---------------------------------------------------------------------------

// Horizontal MCDM score bar
const ScoreBar = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">MCDM Score</span>
        <span className="font-bold text-emerald-600">{(score || 0).toFixed(3)}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// Project card for side-by-side comparison
const ProjectSummary = ({ project, score, isWinner, label }) => (
  <div className={`p-4 rounded-2xl border-2 flex-1 ${
    isWinner
      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
  }`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {isWinner && (
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
          <Trophy size={11} /> Execute First
        </span>
      )}
    </div>
    <p className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
      {project?.title || "â€”"}
    </p>
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <Badge variant="neutral" size="sm">{project?.type}</Badge>
      <span className="text-xs text-gray-500">{project?.department?.name || project?.department}</span>
    </div>
    {score != null && <ScoreBar score={score} />}
  </div>
);

const ConflictDetail = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuthStore();
  const isAdmin       = user?.role === "admin";

  const [conflict,  setConflict]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving]   = useState(false);
  const [resolved,  setResolved]    = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await conflictApi.getById(id);
        setConflict(res.data);
      } catch (err) {
        console.error("[ConflictDetail] fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    setResolving(true);
    try {
      const res = await conflictApi.resolve(id, { resolution, status: "resolved" });
      setConflict(res.data);
      setResolved(true);
    } catch (err) {
      console.error("[ConflictDetail] resolve error", err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!conflict) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Conflict not found.</p>
      </div>
    );
  }

  const scores  = conflict.recommendation?.scores || {};
  const order   = conflict.recommendation?.order  || [];
  const winnerId = order[0];
  const isAWinner = String(conflict.projectA?._id) === String(winnerId);

  const scoreA = scores.projectA ?? scores[String(conflict.projectA?._id)];
  const scoreB = scores.projectB ?? scores[String(conflict.projectB?._id)];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
      >
        <ChevronLeft size={16} />
        Back to Conflicts
      </button>

      {/* Status header */}
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          conflict.status === "open"
            ? "bg-red-100 dark:bg-red-900/30"
            : "bg-emerald-100 dark:bg-emerald-900/30"
        }`}>
          {conflict.status === "open"
            ? <AlertTriangle size={20} className="text-red-500" />
            : <CheckCircle  size={20} className="text-emerald-500" />
          }
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Project Conflict
          </h2>
          <p className="text-sm text-gray-500">
            {conflict.overlapDates?.start
              ? `Overlap: ${new Date(conflict.overlapDates.start).toLocaleDateString("en-IN")} â€“ ${new Date(conflict.overlapDates.end).toLocaleDateString("en-IN")}`
              : "Spatial and temporal overlap detected"}
            {" Â· "}
            <Badge
              variant={conflict.status === "open" ? "danger" : "success"}
              size="sm"
            >
              {conflict.status}
            </Badge>
          </p>
        </div>
      </div>

      {/* Project comparison */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={16} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            MCDM Comparison
          </h3>
        </div>
        <div className="flex items-stretch gap-3">
          <ProjectSummary
            project={conflict.projectA}
            score={scoreA}
            isWinner={isAWinner}
            label="Project A"
          />
          <div className="flex items-center flex-shrink-0">
            <ArrowRight size={20} className="text-gray-300" />
          </div>
          <ProjectSummary
            project={conflict.projectB}
            score={scoreB}
            isWinner={!isAWinner}
            label="Project B"
          />
        </div>
      </div>

      {/* Recommendation */}
      {conflict.recommendation?.explanation && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">
            Recommendation
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            {conflict.recommendation.explanation}
          </p>
        </div>
      )}

      {/* Resolution section */}
      {conflict.status === "resolved" ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
            Resolution
          </p>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            {conflict.resolution}
          </p>
        </div>
      ) : isAdmin && !resolved ? (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Resolve this Conflict
          </p>
          <textarea
            rows={3}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe the resolution â€” e.g. Pipeline to proceed first. Road repair rescheduled to July 1."
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <button
            onClick={handleResolve}
            disabled={resolving || !resolution.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {resolving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {resolving ? "Resolvingâ€¦" : "Mark as Resolved"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ConflictDetail;




