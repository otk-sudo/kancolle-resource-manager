import { useState, useEffect, useRef } from 'react'
import { useImprovementStore } from '../stores/improvementStore'
import { ImprovementCard } from '../components/planner/ImprovementCard'
import { WeeklySummary } from '../components/planner/WeeklySummary'
import { calcWeeklyTotal } from '../lib/improvementCalc'
import { AddPlanModal } from '../components/planner/AddPlanModal'
import type { ImprovementMasterData, Priority } from '../types/improvement'

/** 今日の曜日（0=日〜6=土） */
function getTodayWeekday(): number {
  return new Date().getDay()
}

export function ImprovementPlanner() {
  const { activePlans, archivedPlans, archivePlan, updatePlan, reorderPlans } = useImprovementStore()
  const plans = activePlans()
  const archived = archivedPlans()

  const [masterData, setMasterData] = useState<ImprovementMasterData | null>(null)
  const [dataStatus, setDataStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [showArchived, setShowArchived] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortByPriority, setSortByPriority] = useState(false)

  // ドラッグ用ref
  const dragId = useRef<string | null>(null)

  // 初回マウント時にlocalStorageからキャッシュを読む
  useEffect(() => {
    const cached = localStorage.getItem('improvement-master')
    if (cached) {
      try {
        setMasterData(JSON.parse(cached) as ImprovementMasterData)
      } catch { /* キャッシュ破損は無視 */ }
    }
  }, [])

  const handleFetchData = async () => {
    setDataStatus('loading')
    try {
      // 外部データ取得（将来的にTauriのHTTPプラグイン経由に差し替え）
      // 現時点ではダミーデータをセット
      const dummy: ImprovementMasterData = {
        gameVersion: 'manual',
        fetchedAt: new Date().toISOString(),
        equipments: [],
      }
      setMasterData(dummy)
      localStorage.setItem('improvement-master', JSON.stringify(dummy))
      setDataStatus('idle')
    } catch {
      setDataStatus('error')
    }
  }

  const equipments = masterData?.equipments ?? []
  const totalCost = calcWeeklyTotal(plans, equipments)
  const todayWeekday = getTodayWeekday()

  // 優先度ソート
  const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
  const displayPlans = sortByPriority
    ? [...plans].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    : plans

  // ドラッグ&ドロップ
  const handleDragStart = (id: string) => { dragId.current = id }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (targetId: string) => {
    if (!dragId.current || dragId.current === targetId) return
    const ids = plans.map(p => p.id)
    const fromIdx = ids.indexOf(dragId.current)
    const toIdx = ids.indexOf(targetId)
    const newIds = [...ids]
    newIds.splice(fromIdx, 1)
    newIds.splice(toIdx, 0, dragId.current)
    reorderPlans(newIds)
    dragId.current = null
  }

  return (
    <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

      {/* ヘッダーアクション */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={() => setSortByPriority(v => !v)}
          style={{
            padding: '7px 14px', fontSize: '13px', fontWeight: 600,
            background: sortByPriority ? 'var(--blue)' : 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: '6px',
            color: sortByPriority ? '#fff' : 'var(--text-m)',
            cursor: 'pointer',
          }}
        >
          優先度順
        </button>
        <button
          onClick={handleFetchData}
          disabled={dataStatus === 'loading'}
          style={{
            padding: '7px 14px', fontSize: '13px', fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '6px', color: 'var(--text-m)', cursor: 'pointer',
          }}
        >
          {dataStatus === 'loading' ? '取得中...' : '装備データ更新'}
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '7px 16px', fontSize: '13px', fontWeight: 600,
            background: 'var(--blue)', border: 'none',
            borderRadius: '6px', color: '#fff', cursor: 'pointer',
          }}
        >
          + プランを追加
        </button>
      </div>

      {/* 週次サマリー */}
      <div style={{ marginBottom: '20px' }}>
        <WeeklySummary totalCost={totalCost} planCount={plans.length} />
      </div>

      {/* アクティブプラン一覧 */}
      <p style={{
        fontSize: '11px', fontWeight: 700, color: 'var(--text-s)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ display: 'block', width: '3px', height: '12px', background: 'var(--blue)', borderRadius: '2px' }} />
        改修プラン
      </p>

      {displayPlans.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px',
          color: 'var(--text-s)', fontSize: '13px',
          border: '1px dashed var(--border)', borderRadius: '10px',
        }}>
          プランがありません。「+ プランを追加」から登録してください。
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {displayPlans.map(plan => (
          <div
            key={plan.id}
            draggable={!sortByPriority}
            onDragStart={() => handleDragStart(plan.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(plan.id)}
            style={{ cursor: sortByPriority ? 'default' : 'grab' }}
          >
            <ImprovementCard
              plan={plan}
              equipments={equipments}
              todayWeekday={todayWeekday}
              onArchive={archivePlan}
              onUpdate={(id, patch) => updatePlan(id, patch)}
            />
          </div>
        ))}
      </div>

      {/* アーカイブ */}
      {archived.length > 0 && (
        <>
          <button
            onClick={() => setShowArchived(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--text-s)', marginBottom: '10px',
            }}
          >
            {showArchived ? '▼' : '▶'} アーカイブ済み ({archived.length})
          </button>
          {showArchived && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.6 }}>
              {archived.map(plan => (
                <ImprovementCard
                  key={plan.id}
                  plan={plan}
                  equipments={equipments}
                  todayWeekday={todayWeekday}
                  onArchive={() => {}}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* プラン追加モーダル */}
      {showAddModal && (
        <AddPlanModal
          equipments={equipments}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </main>
  )
}
