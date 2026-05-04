import { useState, useEffect } from 'react'
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useImprovementStore } from '../stores/improvementStore'
import { ImprovementCard } from '../components/planner/ImprovementCard'
import { WeeklySummary } from '../components/planner/WeeklySummary'
import { calcWeeklyTotal } from '../lib/improvementCalc'
import { AddPlanModal } from '../components/planner/AddPlanModal'
import type { ImprovementMasterData, ImprovementPlan, Priority } from '../types/improvement'

function getTodayWeekday(): number {
  return new Date().getDay()
}

const PRIORITY_SECTIONS: { value: Priority; label: string }[] = [
  { value: 'high',   label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low',    label: '低' },
]

const PRIORITY_COLOR: Record<Priority, string> = {
  high:   'var(--red)',
  medium: 'var(--yellow, #f59e0b)',
  low:    'var(--text-s)',
}

// ── ドラッグ可能なカードラッパー ──────────────────────────────

interface SortableCardProps {
  plan: ImprovementPlan
  equipments: ImprovementMasterData['equipments']
  todayWeekday: number
  onArchive: (id: string) => void
  onUpdate: (id: string, patch: Partial<ImprovementPlan>) => void
  onEdit: (plan: ImprovementPlan) => void
}

function SortableCard({ plan, equipments, todayWeekday, onArchive, onUpdate, onEdit }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: plan.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <ImprovementCard
        plan={plan}
        equipments={equipments}
        todayWeekday={todayWeekday}
        onArchive={onArchive}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />
    </div>
  )
}

// ── ドロップ可能なセクションコンテナ ─────────────────────────

interface DroppableSectionProps {
  id: string
  label: string
  children: React.ReactNode
  isEmpty: boolean
}

function DroppableSection({ id, label, children, isEmpty }: DroppableSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      data-testid={`drop-zone-${id}`}
      style={{
        minHeight: '60px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        padding: isEmpty ? '16px' : '0',
        border: isEmpty
          ? `1px dashed ${isOver ? 'var(--blue)' : 'var(--border)'}`
          : isOver ? '1px dashed var(--blue)' : 'none',
        borderRadius: '10px',
        transition: 'border-color 0.15s',
      }}
    >
      {isEmpty && (
        <div style={{
          textAlign: 'center', color: isOver ? 'var(--blue)' : 'var(--text-s)',
          fontSize: '12px', padding: '8px', transition: 'color 0.15s',
        }}>
          ここにドロップして{label}優先度に変更
        </div>
      )}
      {children}
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────────

export function ImprovementPlanner() {
  const { activePlans, archivedPlans, archivePlan, updatePlan, reorderPlans } = useImprovementStore()
  const plans   = activePlans()
  const archived = archivedPlans()

  const [masterData, setMasterData]     = useState<ImprovementMasterData | null>(null)
  const [dataStatus, setDataStatus]     = useState<'idle' | 'loading' | 'error'>('idle')
  const [showArchived, setShowArchived] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlan, setEditingPlan]   = useState<ImprovementPlan | null>(null)
  const [activeDragPlan, setActiveDragPlan] = useState<ImprovementPlan | null>(null)

  // PointerSensor: HTML5 Drag APIを使わずポインターイベントで動作
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 5px 動かしてからドラッグ開始（クリックと誤検知しないよう）
      activationConstraint: { distance: 5 },
    })
  )

  useEffect(() => {
    const cached = localStorage.getItem('improvement-master')
    if (cached) {
      try { setMasterData(JSON.parse(cached) as ImprovementMasterData) } catch { /* 無視 */ }
    }
  }, [])

  const handleFetchData = async () => {
    setDataStatus('loading')
    try {
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

  const equipments   = masterData?.equipments ?? []
  const totalCost    = calcWeeklyTotal(plans, equipments)
  const todayWeekday = getTodayWeekday()

  // ── DnDイベントハンドラ ───────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const plan = plans.find(p => p.id === event.active.id)
    setActiveDragPlan(plan ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragPlan(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const srcPlan = plans.find(p => p.id === active.id)
    if (!srcPlan) return

    // ドロップ先がカードかセクションかを判定
    const overPlan    = plans.find(p => p.id === over.id)
    const overSection = PRIORITY_SECTIONS.find(s => s.value === over.id)

    if (overPlan) {
      // カード上にドロップ
      if (srcPlan.priority === overPlan.priority) {
        // 同優先度内並び替え
        const groupIds = plans
          .filter(p => p.priority === srcPlan.priority)
          .sort((a, b) => a.order - b.order)
          .map(p => p.id)
        const oldIdx = groupIds.indexOf(String(active.id))
        const newIdx = groupIds.indexOf(String(over.id))
        reorderPlans(arrayMove(groupIds, oldIdx, newIdx))
      } else {
        // 異優先度カード上 → 優先度変更して末尾に追加
        updatePlan(String(active.id), { priority: overPlan.priority })
      }
    } else if (overSection) {
      // セクション（空エリア）にドロップ → 優先度変更
      if (srcPlan.priority !== overSection.value) {
        updatePlan(String(active.id), { priority: overSection.value })
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* ヘッダーアクション */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '20px' }}>
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
        <div style={{ marginBottom: '24px' }}>
          <WeeklySummary totalCost={totalCost} planCount={plans.length} />
        </div>

        {/* 優先度グループごとのセクション */}
        {PRIORITY_SECTIONS.map(({ value: priority, label }) => {
          const groupPlans = plans
            .filter(p => p.priority === priority)
            .sort((a, b) => a.order - b.order)

          return (
            <div
              key={priority}
              id={`section-${priority}`}
              style={{ marginBottom: '24px' }}
            >
              {/* セクションヘッダー */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: PRIORITY_COLOR[priority],
                  border: `1px solid ${PRIORITY_COLOR[priority]}`,
                  borderRadius: '4px', padding: '1px 8px',
                }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-s)' }}>
                  {groupPlans.length} プラン
                </span>
              </div>

              {/* ソータブルリスト + セクションドロップゾーン */}
              <SortableContext
                items={groupPlans.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableSection
                  id={priority}
                  label={label}
                  isEmpty={groupPlans.length === 0}
                >
                  {groupPlans.map(plan => (
                    <SortableCard
                      key={plan.id}
                      plan={plan}
                      equipments={equipments}
                      todayWeekday={todayWeekday}
                      onArchive={archivePlan}
                      onUpdate={(id, patch) => updatePlan(id, patch)}
                      onEdit={setEditingPlan}
                    />
                  ))}
                </DroppableSection>
              </SortableContext>
            </div>
          )
        })}

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

        {/* モーダル */}
        {showAddModal && (
          <AddPlanModal
            equipments={equipments}
            onClose={() => setShowAddModal(false)}
          />
        )}
        {editingPlan && (
          <AddPlanModal
            equipments={equipments}
            editPlan={editingPlan}
            onClose={() => setEditingPlan(null)}
          />
        )}
      </main>

      {/* ドラッグ中のカードのゴースト表示 */}
      <DragOverlay>
        {activeDragPlan && (
          <div style={{ opacity: 0.8, transform: 'rotate(1deg)' }}>
            <ImprovementCard
              plan={activeDragPlan}
              equipments={equipments}
              todayWeekday={todayWeekday}
              onArchive={() => {}}
              onUpdate={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
