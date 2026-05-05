import { useCallback } from 'react'
import { useResourceStore } from '../stores/resourceStore'
import { BasicResourceCard } from '../components/dashboard/BasicResourceCard'
import { SpecialResourceGrid } from '../components/dashboard/SpecialResourceGrid'
import { ResourceChart } from '../components/dashboard/ResourceChart'
import { ImportButton } from '../components/dashboard/ImportButton'

export function Dashboard() {
  const { basicResources, specialResources, history } = useResourceStore()

  const getDiff = useCallback((id: string): number => {
    if (history.length < 2) return 0
    const today = history[history.length - 1]
    const yesterday = history[history.length - 2]
    return (today[id as keyof typeof today] as number) - (yesterday[id as keyof typeof yesterday] as number)
  }, [history])

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

      <ImportButton />

      <h2 className="section-heading">基本資材</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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

      <h2 className="section-heading">特殊資材</h2>
      <div style={{ marginBottom: '20px' }}>
        <SpecialResourceGrid resources={specialResources} />
      </div>

      <h2 className="section-heading">14日間推移</h2>
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
