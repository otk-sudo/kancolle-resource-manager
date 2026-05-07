import { memo } from 'react'
import type { SpecialResource } from '../../types/resource'
import { DiffIndicator } from './DiffIndicator'
import { fmt } from '../../lib/format'

interface Props {
  resources: SpecialResource[]
  /** 前日比マップ（キー: 資源ID、値: 差分）。未指定の場合は前日比を表示しない */
  diffs?: Partial<Record<SpecialResource['id'], number>>
}

export const SpecialResourceGrid = memo(function SpecialResourceGrid({ resources, diffs }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: '10px',
    }}>
      {resources.map(r => {
        const diff = diffs?.[r.id]
        const hasDiff = diffs !== undefined && diff !== undefined

        return (
          <div
            key={r.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 14px',
            }}
          >
            {/* 資源名 */}
            <div style={{
              fontSize: '10px',
              color: 'var(--text-s)',
              marginBottom: '6px',
              lineHeight: 1.4,
            }}>
              {r.name}
            </div>

            {/* 現在値と上限 */}
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              {fmt(r.value)}{' '}
              {r.cap !== undefined && (
                <span style={{ fontSize: '11px', color: 'var(--text-m)', fontWeight: 400 }}>
                  / {fmt(r.cap)}
                </span>
              )}
            </div>

            {/* 前日比（diffsが渡された場合のみ表示。ラベルは省略してコンパクトに） */}
            {hasDiff && (
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                <DiffIndicator diff={diff} showLabel={false} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
