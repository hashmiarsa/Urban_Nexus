import { useState, useEffect } from "react";
import { useNavigate }    from "react-router-dom";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import DrawPolygon        from "../map/DrawPolygon";
import projectApi         from "../../api/project.api";
import useAuthStore       from "../../store/authStore";

const TYPE_OPTIONS = [
  { value: "road",        label: "Road" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sewage",      label: "Sewage" },
  { value: "parks",       label: "Parks" },
  { value: "other",       label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Critical" },
];

const CRITERIA_META = [
  { key: "urgency",           label: "Urgency",            hint: "How urgently is this needed?" },
  { key: "socialImpact",      label: "Social Impact",      hint: "How many citizens are affected?" },
  { key: "estimatedCost",     label: "Cost Efficiency",    hint: "Higher = lower / better cost" },
  { key: "feasibility",       label: "Feasibility",        hint: "How achievable is this?" },
  { key: "environmentImpact", label: "Env. Impact",        hint: "Higher = less environmental harm" },
];

const DEFAULT_FORM = {
  title: "", type: "road", description: "", address: "",
  startDate: "", endDate: "", estimatedCost: "", priority: "medium",
  location: null, department: "",
  criteria: { urgency: 5, socialImpact: 5, estimatedCost: 5, feasibility: 5, environmentImpact: 5 },
  dependencies: [],
};

const ProjectForm = ({ onCancel }) => {
  const navigate      = useNavigate();
  const { user }      = useAuthStore();
  const isAdmin       = user?.role === "admin";
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState(null);
  const [errors, setErrors]           = useState({});
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      projectApi.getDepartments().then(res => setDepartments(res.data?.data || res.data || [])).catch(() => {});
    }
  }, [isAdmin]);

  const setField    = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setCriteria = (key, value) => setForm((f) => ({ ...f, criteria: { ...f.criteria, [key]: value } }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.startDate)    e.startDate = "Start date is required";
    if (!form.endDate)      e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      e.endDate = "End date must be after start date";
    if (!form.location)     e.location = "Please draw the project area on the map";
    if (isAdmin && !form.department) e.department = "Department is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(), type: form.type,
        description: form.description.trim(), address: form.address.trim(),
        startDate: form.startDate, endDate: form.endDate,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        priority: form.priority, location: form.location,
        criteria: form.criteria, dependencies: form.dependencies,
      };
      if (isAdmin && form.department) payload.department = form.department;
      const res = await projectApi.create(payload);
      const { project, clashesDetected, conflicts } = res.data.data;
      if (clashesDetected > 0) {
        setResult({ project, clashesDetected, conflicts });
      } else {
        navigate(`/projects/${project._id}`);
      }
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-600 rounded-xl">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {result.clashesDetected} Conflict{result.clashesDetected > 1 ? "s" : ""} Detected
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              Your project was saved, but it conflicts with existing projects. Review the conflicts below.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {result.conflicts.map((c) => (
            <div key={c._id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Conflicts with: {c.projectB?.title || "Unknown project"}
              </p>
              {c.overlapDates?.start && (
                <p className="text-xs text-gray-500 mt-1">
                  Overlap: {new Date(c.overlapDates.start).toLocaleDateString("en-IN")} — {new Date(c.overlapDates.end).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/projects/${result.project._id}`)}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
            View Project
          </button>
          <button onClick={() => navigate("/conflicts")}
            className="flex-1 py-2.5 border border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold rounded-xl text-sm transition-colors">
            View Conflicts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project Title *</label>
            <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. MG Road Resurfacing Phase 2"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setField("type", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setField("priority", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {PRIORITY_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department *</label>
              <select value={form.department}
                onChange={(e) => { setField("department", e.target.value); setErrors((err) => ({ ...err, department: undefined })); }}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.department ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`}>
                <option value="">Select department…</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
              </select>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe the scope of work…"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
            <input type="text" value={form.address} onChange={(e) => setField("address", e.target.value)}
              placeholder="Street address or landmark"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date *</label>
              <input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.startDate ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`} />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date *</label>
              <input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.endDate ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`} />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estimated Cost (₹)</label>
            <input type="number" min="0" value={form.estimatedCost} onChange={(e) => setField("estimatedCost", e.target.value)}
              placeholder="500000"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Area *</h3>
        <DrawPolygon value={form.location}
          onChange={(geo) => { setField("location", geo); setErrors((e) => ({ ...e, location: undefined })); }} />
        {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Priority Criteria</h3>
        <p className="text-xs text-gray-400 mb-4">Rate each criterion 1-10. These are used by the MCDM engine to score conflicting projects.</p>
        <div className="space-y-4">
          {CRITERIA_META.map(({ key, label, hint }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <span className="text-sm font-bold text-emerald-600 w-6 text-right">{form.criteria[key]}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={form.criteria[key]}
                onChange={(e) => setCriteria(key, Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>1 - Low</span>
                <span className="text-center text-gray-400 text-[10px]">{hint}</span>
                <span>10 - High</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
        )}
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {submitting ? "Submitting..." : "Submit Project"}
        </button>
      </div>
    </div>
  );
};

export default ProjectForm;
