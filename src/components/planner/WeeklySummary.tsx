import type { ImprovementCost } from '../../types/improvement'

interface Props {
  totalCost: ImprovementCost
  planCount: number
}

export function WeeklySummary({ totalCost, planCount }: Props) {
  const items = [
    { label: '改修資材', value: totalCost.improveMaterial },
    { label: '開発資材', value: totalCost.devMaterial },
    { label: '鋼材', value: totalCost.steel },
    { label: '弾薬', value: totalCost.ammo },
  ]

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '16px 20px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '14px',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-h)' }}>
          残り改修コスト合計
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-s)' }}>
          {planCount} プラン
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {items.map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-h)' }}>
              {value.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-s)', marginTop: '2px' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
