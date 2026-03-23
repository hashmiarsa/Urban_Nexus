import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Send, CheckCircle, AlertCircle, Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import reportApi from "../../api/report.api";

// ---------------------------------------------------------------------------
// ReportForm.jsx â€” citizen report submission with map pin drop
// Standalone component usable in CitizenReport.jsx or any page
// ---------------------------------------------------------------------------

const REPORT_TYPES = [
  { value: "pothole",     label: "Pothole",     emoji: "ðŸ•³ï¸" },
  { value: "streetlight", label: "Streetlight", emoji: "ðŸ’¡" },
  { value: "water_leak",  label: "Water Leak",  emoji: "ðŸ’§" },
  { value: "garbage",     label: "Garbage",     emoji: "ðŸ—‘ï¸" },
  { value: "other",       label: "Other",       emoji: "ðŸ“‹" },
];

const DEFAULT_CENTER = [28.6692, 77.4538];

const PinDropper = ({ onPinDrop }) => {
  useMapEvents({ click: (e) => onPinDrop({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

const ReportForm = ({ onSuccess }) => {
  const [form, setForm]     = useState({ type: "", description: "", photo: null });
  const [pin,  setPin]      = useState(null);
  const [busy, setBusy]     = useState(false);
  const [err,  setErr]      = useState(null);

  const handlePinDrop = useCallback((coords) => setPin(coords), []);

  const handleSubmit = async () => {
    if (!form.type) { setErr("Please select a report type."); return; }
    if (!pin)       { setErr("Please drop a pin on the map."); return; }

    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("type",        form.type);
      fd.append("description", form.description);
      fd.append("latitude",    String(pin.lat));
      fd.append("longitude",   String(pin.lng));
      if (form.photo) fd.append("photo", form.photo);

      const res = await reportApi.submit(fd);
      onSuccess?.(res.data);
      setForm({ type: "", description: "", photo: null });
      setPin(null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {err && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}

      {/* Type selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Issue Type *
        </label>
        <div className="grid grid-cols-5 gap-2">
          {REPORT_TYPES.map(({ value, label, emoji }) => (
            <button key={value} type="button"
              onClick={() => setForm((f) => ({ ...f, type: value }))}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                form.type === value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea rows={2} value={form.description} maxLength={500}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe the issueâ€¦"
          className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      {/* Map pin drop */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Location * <span className="font-normal text-gray-400">(tap map)</span>
        </label>
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
          <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: 220, width: "100%" }} scrollWheelZoom>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
            <PinDropper onPinDrop={handlePinDrop} />
            {pin && <Marker position={[pin.lat, pin.lng]} />}
          </MapContainer>
        </div>
        {pin && (
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            <MapPin size={11} className="inline mr-1" />
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
            <button type="button" onClick={() => setPin(null)} className="ml-2 text-gray-400 hover:text-red-500">Ã—</button>
          </p>
        )}
      </div>

      {/* Photo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Photo (optional)</label>
        <input type="file" accept="image/*"
          onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files[0] || null }))}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
        />
      </div>

      <button type="button" onClick={handleSubmit} disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {busy ? "Submittingâ€¦" : "Submit Report"}
      </button>
    </div>
  );
};

export default ReportForm;


