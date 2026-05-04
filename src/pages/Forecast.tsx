import { useState, useMemo } from 'react'
import { useResourceStore } from '../stores/resourceStore'
import { ForecastCard } from '../components/forecast/ForecastCard'
import { ForecastChart } from '../components/forecast/ForecastChart'
import { calcDailyAvg, calcForecast, type HistoryResourceId } from '../lib/forecastCalc'
import { buildChartData } from '../lib/forecastChartData'

// 予測対象資材の定義
const FORECAST_RESOURCES: { id: HistoryResourceId; label: string; defaultTarget: number }[] = [
  { id: 'fuel',          label: '燃料',       defaultTarget: 350000 },
  { id: 'ammo',          label: '弾薬',       defaultTarget: 350000 },
  { id: 'steel',         label: '鋼材',       defaultTarget: 350000 },
  { id: 'baux',          label: 'ボーキサイト', defaultTarget: 350000 },
  { id: 'instantRepair', label: '高速修復材',  defaultTarget: 3000 },
  { id: 'instantBuild',  label: '高速建造材',  defaultTarget: 3000 },
  { id: 'devMaterial',   label: '開発資材',    defaultTarget: 3000 },
  { id: 'improveMaterial',label: '改修資材',   defaultTarget: 3000 },
]

const DAY_OPTIONS = [7, 14, 30] as const
type DayOption = typeof DAY_OPTIONS[number]

export function Forecast() {
  const { history, basicResources, specialResources } = useResourceStore()

  const [days, setDays]             = useState<DayOption>(7)
  const [selected, setSelected]     = useState<Set<HistoryResourceId>>(
    new Set(FORECAST_RESOURCES.map(r => r.id))
  )
  const [targets, setTargets]       = useState<Record<string, number>>(
    Object.fromEntries(FORECAST_RESOURCES.map(r => [r.id, r.defaultTarget]))
  )
  const [editingTarget, setEditingTarget] = useState<HistoryResourceId | null>(null)

  const today = useMemo(() => new Date(), [])

  // 現在値の取得
  const currentValues = useMemo(() => {
    const map: Record<string, number> = {}
    basicResources.forEach(r => { map[r.id] = r.value })
    specialResources.forEach(r => { map[r.id] = r.value })
    return map
  }, [basicResources, specialResources])

  // 選択切り替え
  const toggleResource = (id: HistoryResourceId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const selectedResources = FORECAST_RESOURCES.filter(r => selected.has(r.id))

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

      {/* コントロールバー */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>

        {/* 期間選択 */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-s)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            計算期間
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {DAY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                  background: days === d ? 'var(--blue)' : 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: days === d ? '#fff' : 'var(--text-m)', cursor: 'pointer',
                }}
              >
                {d}日
              </button>
            ))}
          </div>
        </div>

        {/* 資材選択 */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-s)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            表示資材
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FORECAST_RESOURCES.map(r => (
              <button
                key={r.id}
                onClick={() => toggleResource(r.id)}
                style={{
                  padding: '5px 12px', fontSize: '12px', fontWeight: 600,
                  background: selected.has(r.id) ? 'var(--blue)' : 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: selected.has(r.id) ? '#fff' : 'var(--text-m)', cursor: 'pointer',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 履歴データなし */}
      {history.length < 2 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-s)', fontSize: '13px',
          border: '1px dashed var(--border)', borderRadius: '10px',
        }}>
          予測にはダッシュボードから2日分以上の資材履歴のインポートが必要です。
        </div>
      )}

      {/* 予測カードグリッド */}
      {history.length >= 2 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px',
        }}>
          {selectedResources.map(r => {
            const dailyAvg = calcDailyAvg(history, r.id, days)
            const current  = currentValues[r.id] ?? 0
            const target   = targets[r.id] ?? r.defaultTarget
            const forecast = calcForecast({ current, target, dailyAvg, fromDate: today })

            return (
              <div key={r.id}>
                <ForecastCard
                  label={r.label}
                  current={current}
                  target={target}
                  dailyAvg={dailyAvg}
                  reachable={forecast.reachable}
                  daysLeft={forecast.daysLeft}
                  reachDate={forecast.reachDate}
                />
                {/* 目標値編集 */}
                <div style={{ marginTop: '6px', textAlign: 'right' }}>
                  {editingTarget === r.id ? (
                    <input
                      type="number"
                      defaultValue={target}
                      autoFocus
                      onBlur={e => {
                        const val = Number(e.target.value)
                        if (val > 0) setTargets(prev => ({ ...prev, [r.id]: val }))
                        setEditingTarget(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') setEditingTarget(null)
                      }}
                      style={{
                        width: '120px', padding: '4px 8px',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '6px', color: 'var(--text-h)',
                        fontSize: '12px', textAlign: 'right', fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingTarget(r.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '11px', color: 'var(--text-s)',
                      }}
                    >
                      目標: {target.toLocaleString()} ✎
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 予測グラフ */}
      {history.length >= 2 && selectedResources.length > 0 && (() => {
        const chartResources = selectedResources.map(r => ({
          id: r.id,
          label: r.label,
          target: targets[r.id] ?? r.defaultTarget,
        }))
        const chartData = buildChartData({ history, resources: chartResources, days, today })
        return (
          <div style={{ marginTop: '24px' }}>
            <ForecastChart data={chartData} resources={chartResources} />
          </div>
        )
      })()}
    </main>
  )
}
