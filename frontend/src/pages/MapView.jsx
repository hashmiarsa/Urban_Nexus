import { motion } from 'framer-motion'
import { Map } from 'lucide-react'

export default function MapView() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-400">
        <Map size={48} className="mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">Map View</p>
        <p className="text-sm mt-1">Coming in Phase 4 — Leaflet map with project polygons</p>
      </motion.div>
    </div>
  )
}