import { Link }      from "react-router-dom";
import { MapPin, AlertTriangle, BarChart2, GitMerge, ArrowRight, Shield } from "lucide-react";
import Logo            from "../components/common/Logo";

// ---------------------------------------------------------------------------
// Landing.jsx â€” Public marketing/landing page
// No authentication required
// Links to /login and /citizen-report
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: <MapPin size={22} className="text-emerald-600" />,
    title: "Geo-Aware Projects",
    desc:  "Every infrastructure project is pinned to an exact map polygon. Overlaps are caught automatically.",
  },
  {
    icon: <AlertTriangle size={22} className="text-amber-500" />,
    title: "Conflict Detection",
    desc:  "Two departments digging the same road? The system detects it before a single rupee is wasted.",
  },
  {
    icon: <BarChart2 size={22} className="text-blue-500" />,
    title: "MCDM Scoring",
    desc:  "TOPSIS algorithm scores projects on urgency, impact, cost, and feasibility to recommend priority.",
  },
  {
    icon: <GitMerge size={22} className="text-purple-500" />,
    title: "Execution Ordering",
    desc:  "A dependency graph determines the correct sequence so no project blocks another unnecessarily.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
            Urban Nexus
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/citizen-report"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition-colors"
          >
            Report Issue
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
          >
            Staff Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-6">
          <Shield size={12} />
          Smart Urban Infrastructure Coordination
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          Stop Departments
          <br />
          <span className="text-emerald-600">Working in Silos</span>
        </h1>

        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Urban Nexus coordinates infrastructure projects across PWD, Water Board, Electricity,
          and Parks â€” detecting conflicts before they waste public money and disrupt citizens.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/citizen-report"
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <MapPin size={16} />
            Report an Issue
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl"
            >
              <div className="w-11 h-11 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-6 text-center text-xs text-gray-400">
        Urban Nexus â€” Smart City Infrastructure Platform
      </footer>
    </div>
  );
};

export default Landing;
