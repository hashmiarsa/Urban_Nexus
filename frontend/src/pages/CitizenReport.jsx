import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Send, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icons in Vite builds
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

import reportApi from "../api/report.api";

// ---------------------------------------------------------------------------
// CitizenReport.jsx â€” Public page, no authentication required
//
// Two sections:
//   1. Submit Report â€” type, description, photo, map pin drop
//   2. Track Report  â€” enter CNR-XXXXXX tracking ID
//
// Map pin drop: citizen taps/clicks the map to set their location.
// Coordinates feed into the form submission as latitude/longitude.
// ---------------------------------------------------------------------------

const REPORT_TYPES = [
  { value: "pothole",     label: "Pothole",       emoji: "ðŸ•³ï¸" },
  { value: "streetlight", label: "Streetlight",   emoji: "ðŸ’¡" },
  { value: "water_leak",  label: "Water Leak",    emoji: "ðŸ’§" },
  { value: "garbage",     label: "Garbage",       emoji: "ðŸ—‘ï¸" },
  { value: "other",       label: "Other",         emoji: "ðŸ“‹" },
];

const STATUS_STEPS = ["submitted", "acknowledged", "in_progress", "resolved"];
const STATUS_LABELS = {
  submitted:    "Submitted",
  acknowledged: "Acknowledged",
  in_progress:  "In Progress",
  resolved:     "Resolved",
};

const DEFAULT_CENTER = [28.6692, 77.4538]; // Ghaziabad, UP

// ---------------------------------------------------------------------------
// PinDropper â€” inner Leaflet component that handles map click to drop pin
// ---------------------------------------------------------------------------
const PinDropper = ({ onPinDrop }) => {
  useMapEvents({
    click(e) {
      onPinDrop({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// ---------------------------------------------------------------------------
// Submit Form
// ---------------------------------------------------------------------------
const SubmitForm = () => {
  const [form, setForm]         = useState({
    type:        "",
    description: "",
    photo:       null,
  });
  const [pin, setPin]           = useState(null); // { lat, lng }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null); // { success, trackingId, error }

  const handlePinDrop = useCallback((coords) => {
    setPin(coords);
  }, []);

  const handleSubmit = async () => {
    if (!form.type) {
      alert("Please select a report type.");
      return;
    }
    if (!pin) {
      alert("Please drop a pin on the map to mark the location.");
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      // Build FormData â€” matches multipart/form-data spec in API_CONTRACT
      const fd = new FormData();
      fd.append("type",        form.type);
      fd.append("description", form.description);
      fd.append("latitude",    String(pin.lat));
      fd.append("longitude",   String(pin.lng));
      if (form.photo) fd.append("photo", form.photo);

      const res = await reportApi.submit(fd);

      setResult({
        success:    true,
        trackingId: res.data.trackingId,
      });

      // Reset form
      setForm({ type: "", description: "", photo: null });
      setPin(null);
    } catch (err) {
      setResult({
        success: false,
        error:   err?.response?.data?.message || "Submission failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Report Submitted
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your tracking ID is:
        </p>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl px-6 py-4">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">
            {result.trackingId}
          </p>
        </div>
        <p className="text-xs text-gray-400 max-w-xs">
          Save this ID to track the status of your report.
        </p>
        <button
          onClick={() => setResult(null)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {result?.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
        </div>
      )}

      {/* Report type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Issue Type *
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {REPORT_TYPES.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: value }))}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                form.type === value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Describe the issue in detailâ€¦"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right mt-1">
          {form.description.length}/500
        </p>
      </div>

      {/* Map pin drop */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Location *{" "}
          <span className="font-normal text-gray-400">(tap the map to drop a pin)</span>
        </label>

        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 relative">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={14}
            style={{ height: "260px", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />
            <PinDropper onPinDrop={handlePinDrop} />
            {pin && <Marker position={[pin.lat, pin.lng]} />}
          </MapContainer>

          {!pin && (
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-4">
              <div className="bg-white/90 dark:bg-gray-800/90 text-xs font-medium text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full shadow">
                <MapPin size={11} className="inline mr-1 text-emerald-500" />
                Tap to mark location
              </div>
            </div>
          )}
        </div>

        {pin && (
          <p className="text-xs text-emerald-600 mt-1.5 font-medium">
            ðŸ“ {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            <button
              type="button"
              onClick={() => setPin(null)}
              className="ml-2 text-gray-400 hover:text-red-500"
            >
              Ã—
            </button>
          </p>
        )}
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Photo <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files[0] || null }))}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400"
        />
        {form.photo && (
          <p className="text-xs text-gray-400 mt-1">{form.photo.name}</p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {submitting ? "Submittingâ€¦" : "Submit Report"}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Track Report
// ---------------------------------------------------------------------------
const TrackReport = () => {
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [report, setReport]         = useState(null);
  const [error, setError]           = useState(null);

  const handleTrack = async () => {
    const id = trackingId.trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await reportApi.track(id);
      setReport(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Report not found. Check your tracking ID.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = report
    ? STATUS_STEPS.indexOf(report.status)
    : -1;

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter tracking ID (CNR-XXXXXX)"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
          className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          maxLength={10}
        />
        <button
          type="button"
          onClick={handleTrack}
          disabled={loading || !trackingId.trim()}
          className="flex items-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Track
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <AlertCircle size={15} className="text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {report && (
        <div className="space-y-4">
          {/* Report info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-base tracking-widest">
                  {report.trackingId}
                </p>
                <p className="text-sm text-gray-500 capitalize mt-0.5">
                  {report.type?.replace("_", " ")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                report.status === "resolved"
                  ? "bg-emerald-100 text-emerald-700"
                  : report.status === "in_progress"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {STATUS_LABELS[report.status] || report.status}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
            )}
            {report.assignedTo && (
              <p className="text-xs text-gray-400 mt-2">
                Assigned to: {report.assignedTo.name}
              </p>
            )}
          </div>

          {/* Progress stepper */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Progress
            </p>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, idx) => {
                const done    = idx <= currentStep;
                const isLast  = idx === STATUS_STEPS.length - 1;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        done
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-400"
                      }`}>
                        {done ? "âœ“" : idx + 1}
                      </div>
                      <span className={`text-[10px] font-medium whitespace-nowrap ${
                        done ? "text-emerald-600" : "text-gray-400"
                      }`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 ${
                        idx < currentStep ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main CitizenReport page
// ---------------------------------------------------------------------------
const CitizenReport = () => {
  const [tab, setTab] = useState("submit"); // "submit" | "track"

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MapPin size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Citizen Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Report infrastructure issues or track your existing complaint
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
          {[
            { key: "submit", label: "Submit Report" },
            { key: "track",  label: "Track Report" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === key
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {tab === "submit" ? <SubmitForm /> : <TrackReport />}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          No account required Â· Your location is only used to route your report
        </p>
      </div>
    </div>
  );
};

export default CitizenReport;


