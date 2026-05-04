interface Props {
  label: string
  current: number
  target: number
  dailyAvg: number
  reachable: boolean
  daysLeft: number | null
  reachDate: Date | null
}

const fmt = (n: number) => n.toLocaleString()
const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

export function ForecastCard({ label, current, target, dailyAvg, reachable, daysLeft, reachDate }: Props) {
  const progress = Math.min(100, Math.round((current / target) * 100))

  const statusColor = !reachable
    ? 'var(--red)'
    : daysLeft === 0
    ? 'var(--green)'
    : 'var(--blue)'

  let statusText: string
  if (!reachable) {
    statusText = '到達不可'
  } else if (daysLeft === 0) {
    statusText = '達成済み'
  } else {
    statusText = `${daysLeft}日後`
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '16px',
    }}>
      {/* ラベルと状態 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-h)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: statusColor }}>{statusText}</span>
      </div>

      {/* 進捗バー */}
      <div style={{
        height: '4px', background: 'var(--border)',
        borderRadius: '2px', overflow: 'hidden', marginBottom: '10px',
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: statusColor, borderRadius: '2px', transition: 'width 0.3s',
        }} />
      </div>

      {/* 数値情報 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-s)' }}>
        <span>{fmt(current)} / {fmt(target)}</span>
        <span style={{ color: dailyAvg >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {dailyAvg >= 0 ? '+' : ''}{fmt(Math.round(dailyAvg))}/日
        </span>
      </div>

      {/* 到達日 */}
      {reachable && reachDate && daysLeft !== 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-s)', textAlign: 'right' }}>
          {fmtDate(reachDate)}
        </div>
      )}
    </div>
  )
}
