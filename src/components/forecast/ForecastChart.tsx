import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { ChartDataPoint, ChartResource } from '../../lib/forecastChartData'

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

interface Props {
  data: ChartDataPoint[]
  resources: ChartResource[]
}

export function ForecastChart({ data, resources }: Props) {
  if (data.length === 0) return null

  const firstForecastDate = data.find(p => p.type === 'forecast')?.date

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '20px',
    }}>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-h)' }}>
          推移・予測グラフ（目標比 %）
        </span>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-s)' }}>
          <span>— 実績</span>
          <span>--- 予測</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-s)' }}
            tickFormatter={d => String(d).slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 105]}
            tick={{ fontSize: 11, fill: 'var(--text-s)' }}
            tickFormatter={v => `${v}%`}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-h)', marginBottom: '4px' }}
            formatter={(value, name) =>
              value !== null
                ? [`${value}%`, String(name ?? '').replace('（予測）', '')]
                : [null, null]
            }
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-s)' }} />

          {/* 目標100%ライン */}
          <ReferenceLine
            y={100}
            stroke="var(--green)"
            strokeDasharray="4 4"
            label={{ value: '目標', fill: 'var(--green)', fontSize: 11, position: 'insideTopRight' }}
          />

          {/* 今日の境界ライン */}
          {firstForecastDate && (
            <ReferenceLine
              x={firstForecastDate}
              stroke="var(--text-s)"
              strokeDasharray="3 3"
              label={{ value: '今日', fill: 'var(--text-s)', fontSize: 11, position: 'insideTopLeft' }}
            />
          )}

          {/* 資材ごとに実績線・予測線の2本を描画 */}
          {resources.map((res, i) => {
            const color = COLORS[i % COLORS.length]
            return [
              // 実線（実績）
              <Line
                key={`${res.id}_hist`}
                type="monotone"
                dataKey={res.id}
                name={res.label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                legendType="line"
              />,
              // 破線（予測）
              <Line
                key={`${res.id}_fcst`}
                type="monotone"
                dataKey={`${res.id}_f`}
                name={`${res.label}（予測）`}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                connectNulls={false}
                legendType="none"
              />,
            ]
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
