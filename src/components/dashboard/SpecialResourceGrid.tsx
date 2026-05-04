import type { SpecialResource } from '../../types/resource'

const fmt = (n: number) => n.toLocaleString('ja-JP')

interface Props {
  resources: SpecialResource[]
}

export function SpecialResourceGrid({ resources }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
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
          {/* 資材名 */}
          <div style={{
            fontSize: '10px',
            color: 'var(--text-s)',
            marginBottom: '6px',
            lineHeight: 1.4,
          }}>
            {r.name}
          </div>

          {/* 現在値 */}
          {r.cap !== undefined ? (
            // 上限あり資材: "523 / 3,000" 形式で表示
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              {fmt(r.value)}{' '}
              <span style={{ fontSize: '11px', color: 'var(--text-m)', fontWeight: 400 }}>
                / {fmt(r.cap)}
              </span>
            </div>
          ) : (
            // 上限なし資材: 個数のみ表示
            <div style={{ fontSize: '22px', fontWeight: 700 }}>
              {fmt(r.value)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
