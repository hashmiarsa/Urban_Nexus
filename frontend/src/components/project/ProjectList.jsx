import { useState, useEffect, useCallback } from "react";
import { useNavigate }   from "react-router-dom";
import { Search, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import ProjectCard       from "./ProjectCard";
import Skeleton          from "../common/Skeleton";
import projectApi from "../../api/project.api";;
import useAuthStore      from "../../store/authStore";

// ---------------------------------------------------------------------------
// ProjectList.jsx
//
// Paginated, filterable list of projects.
// Used on both /projects (admin) and /dept-dashboard (officer).
// Fetches from GET /api/v1/projects with query params.
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "",          label: "All Statuses" },
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "ongoing",   label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "rejected",  label: "Rejected" },
  { value: "clashed",   label: "Clashed" },
];

const TYPE_OPTIONS = [
  { value: "",            label: "All Types" },
  { value: "road",        label: "Road" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sewage",      label: "Sewage" },
  { value: "parks",       label: "Parks" },
  { value: "other",       label: "Other" },
];

const ProjectList = ({ onNewProject, departmentId }) => {
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const canCreate    = user?.role === "officer" || user?.role === "admin";

  const [projects,   setProjects]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("");
  const [type,       setType]       = useState("");
  const [page,       setPage]       = useState(1);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (status)       params.status     = status;
      if (type)         params.type       = type;
      if (departmentId) params.department = departmentId;

      const res  = await projectApi.getAll(params);
      let list   = res.data || [];

      // Client-side title search (backend doesn't support text search in MVP)
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q)
        );
      }

      setProjects(list);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error("[ProjectList] fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, type, search, departmentId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [status, type, search]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projectsâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-7 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* New project button */}
          {canCreate && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={15} />
              New Project
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton.Card key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">ðŸ“‹</div>
          <p className="text-sm font-medium">No projects found</p>
          <p className="text-xs mt-1">Try adjusting your filters or create a new project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => navigate(`/projects/${project._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            {pagination.total} projects Â· Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;


