import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home }   from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-gray-200 dark:text-gray-700 mb-2 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            Go back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <Home size={15} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
