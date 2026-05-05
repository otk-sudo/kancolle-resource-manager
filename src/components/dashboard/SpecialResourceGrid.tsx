import { memo } from 'react'
import type { SpecialResource } from '../../types/resource'

const fmt = (n: number) => n.toLocaleString('ja-JP')

interface Props {
  resources: SpecialResource[]
}

export const SpecialResourceGrid = memo(function SpecialResourceGrid({ resources }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: '10px',
    }}>
      {resources.map(r => (
        <div
          key={r.id}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px 14px',
          }}
        >
          <div style={{
            fontSize: '10px',
            color: 'var(--text-s)',
            marginBottom: '6px',
            lineHeight: 1.4,
          }}>
            {r.name}
          </div>

          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            {fmt(r.value)}{' '}
            {r.cap !== undefined && (
              <span style={{ fontSize: '11px', color: 'var(--text-m)', fontWeight: 400 }}>
                / {fmt(r.cap)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})
