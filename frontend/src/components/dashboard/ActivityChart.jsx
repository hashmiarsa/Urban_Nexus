import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const STATUS_COLORS = {
  pending:   '#EAB308',
  approved:  '#3B82F6',
  ongoing:   '#0E9F6E',
  completed: '#22C55E',
  rejected:  '#EF4444',
}

export default function ActivityChart({ data = [], loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-6 shadow-card">
        <div className="skeleton h-4 w-40 mb-6" />
        <div className="skeleton h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-6 shadow-card">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">
        Projects by Department
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="department"
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1E293B',
              border: 'none',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '13px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
          <Bar dataKey="count" name="Projects" fill="#1A56DB" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}