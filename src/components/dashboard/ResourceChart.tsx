import { useState, useMemo, useCallback, memo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ResourceHistoryRecord } from '../../types/resource'

interface Props {
  history: ResourceHistoryRecord[]
}

const SERIES = [
  { key: 'fuel',            name: '燃料',       color: 'var(--fuel)',   defaultVisible: true  },
  { key: 'ammo',            name: '弾薬',       color: 'var(--ammo)',   defaultVisible: true  },
  { key: 'steel',           name: '鋼材',       color: 'var(--steel)',  defaultVisible: true  },
  { key: 'baux',            name: 'ボーキ',     color: 'var(--baux)',   defaultVisible: true  },
  { key: 'instantRepair',   name: '高速修復材', color: 'var(--purple)', defaultVisible: true  },
  { key: 'instantBuild',    name: '高速建造材', color: 'var(--teal)',   defaultVisible: false },
  { key: 'devMaterial',     name: '開発資材',   color: 'var(--orange)', defaultVisible: false },
  { key: 'improveMaterial', name: '改修資材',   color: 'var(--pink)',   defaultVisible: false },
] as const

const fmt = (n: number) => n.toLocaleString('ja-JP')

export const ResourceChart = memo(function ResourceChart({ history }: Props) {
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(SERIES.map(s => [s.key, s.defaultVisible]))
  )

  const toggleSeries = useCallback((key: string) => {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const chartData = useMemo(
    () => history.slice(-14).map(r => ({
      ...r,
      label: r.date.slice(5).replace('-', '/'),
    })),
    [history]
  )

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-m)', fontSize: '13px' }}>
        履歴データがありません。CSVをインポートしてください。
      </div>
    )
  }

  return (
    <div>
      {/* 凡例 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {SERIES.map(s => (
          <button
            key={s.key}
            onClick={() => toggleSeries(s.key)}
            aria-label={`${s.name}の表示を切替`}
            aria-pressed={visible[s.key]}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-s)',
              cursor: 'pointer',
              opacity: visible[s.key] ? 1 : 0.35,
              userSelect: 'none',
              transition: 'opacity 0.15s',
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              borderRadius: '4px',
            }}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: s.color,
              display: 'block',
            }} />
            {s.name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,106,0.4)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-s)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-s)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : String(v)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-s)', marginBottom: '4px' }}
            formatter={(value, name) => [fmt(Number(value)), String(name)]}
          />
          {SERIES.map(s => (
            visible[s.key] && (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color }}
                activeDot={{ r: 5 }}
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
