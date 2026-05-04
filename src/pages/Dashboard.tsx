import { useResourceStore } from '../stores/resourceStore'
import { BasicResourceCard } from '../components/dashboard/BasicResourceCard'
import { SpecialResourceGrid } from '../components/dashboard/SpecialResourceGrid'
import { ResourceChart } from '../components/dashboard/ResourceChart'
import { ImportButton } from '../components/dashboard/ImportButton'

export function Dashboard() {
  const { basicResources, specialResources, history } = useResourceStore()

  // 前日比を計算（履歴がある場合）
  const getDiff = (id: string): number => {
    if (history.length < 2) return 0
    const today = history[history.length - 1]
    const yesterday = history[history.length - 2]
    return (today[id as keyof typeof today] as number) - (yesterday[id as keyof typeof yesterday] as number)
  }

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

      {/* インポートボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <ImportButton />
      </div>

      {/* 基本資材 */}
      <p style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--text-s)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ display: 'block', width: '3px', height: '12px', background: 'var(--blue)', borderRadius: '2px' }} />
        基本資材
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        {basicResources.map(r => (
          <BasicResourceCard
            key={r.id}
            resource={r}
            diff={getDiff(r.id)}
          />
        ))}
      </div>

      {/* 特殊資材 */}
      <p style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--text-s)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ display: 'block', width: '3px', height: '12px', background: 'var(--blue)', borderRadius: '2px' }} />
        特殊資材
      </p>
      <div style={{ marginBottom: '20px' }}>
        <SpecialResourceGrid resources={specialResources} />
      </div>

      {/* 推移グラフ */}
      <p style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--text-s)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ display: 'block', width: '3px', height: '12px', background: 'var(--blue)', borderRadius: '2px' }} />
        14日間推移
      </p>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <ResourceChart history={history} />
      </div>

    </main>
  )
}
