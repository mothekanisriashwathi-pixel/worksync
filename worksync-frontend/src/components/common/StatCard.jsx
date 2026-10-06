/**
 * StatCard — metric card for dashboards.
 *
 * Props:
 *   label        {string}   metric name
 *   value        {string|number}
 *   change       {string}   optional sub-label, e.g. "+2 this month"
 *   trend        {'up'|'down'|null}  positive = up, negative = down
 *   icon         {ReactComponent}  icon component
 *   iconBgVar    {string}  CSS variable name, e.g. '--color-primary-50'
 *   iconColorVar {string}  CSS variable name, e.g. '--color-primary-600'
 */
export default function StatCard({ label, value, change, trend, icon: Icon, iconBgVar, iconColorVar }) {
  return (
    <div className="stat-card">
      {Icon && (
        <div
          className="stat-card-icon"
          style={{ backgroundColor: `var(${iconBgVar ?? '--color-primary-50'})` }}
          aria-hidden="true"
        >
          <Icon size={20} style={{ color: `var(${iconColorVar ?? '--color-primary-600'})` }} />
        </div>
      )}
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
      {change && (
        <div
          className={`stat-card-change${
            trend === 'up'   ? ' positive' :
            trend === 'down' ? ' negative' : ''
          }`}
        >
          {change}
        </div>
      )}
    </div>
  )
}
