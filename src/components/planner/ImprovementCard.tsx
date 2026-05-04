import { useState } from 'react'
import type { ImprovementPlan, ImprovableEquipment } from '../../types/improvement'
import { calcRemainingCost, getTodayAvailableEquips } from '../../lib/improvementCalc'

const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }
const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--red)',
  medium: 'var(--yellow, #f59e0b)',
  low: 'var(--text-s)',
}

interface Props {
  plan: ImprovementPlan
  equipments: ImprovableEquipment[]
  todayWeekday: number
  onArchive: (id: string) => void
  onUpdate: (id: string, patch: Partial<ImprovementPlan>) => void
  onEdit?: (plan: ImprovementPlan) => void
}

export function ImprovementCard({ plan, equipments, todayWeekday, onArchive, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)

  // 今日改修可能な装備IDのセット
  const todayEquipIds = new Set(
    getTodayAvailableEquips(equipments, todayWeekday).map(e => e.equipId)
  )
  const isTodayAvailable = plan.steps.some(s => todayEquipIds.has(s.equipId))

  // 進捗率（全ステップの合計）
  const totalStars = plan.steps.reduce((s, step) => s + (step.targetStar - 0), 0)
  const doneStars = plan.steps.reduce((s, step) => s + step.currentStar, 0)
  const progress = totalStars > 0 ? Math.round((doneStars / totalStars) * 100) : 0

  // 期限の表示用フォーマット
  const deadlineStr = plan.deadline
    ? plan.deadline.slice(0, 10) // YYYY-MM-DD
    : null

  const firstName = plan.steps[0]?.equipName ?? '—'
  const lastName = plan.steps[plan.steps.length - 1]?.equipName ?? ''
  const chainTitle = plan.steps.length > 1 ? `${firstName} → ${lastName}` : firstName

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isTodayAvailable ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: '10px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* ヘッダー */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          {/* 優先度バッジ */}
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: PRIORITY_COLOR[plan.priority],
            border: `1px solid ${PRIORITY_COLOR[plan.priority]}`,
            borderRadius: '4px', padding: '1px 6px',
          }}>
            {PRIORITY_LABEL[plan.priority]}
          </span>

          {/* 今日可能バッジ */}
          {isTodayAvailable && (
            <span style={{
              fontSize: '11px', fontWeight: 700,
              background: 'var(--blue)', color: '#fff',
              borderRadius: '4px', padding: '1px 6px',
            }}>
              今日可能
            </span>
          )}

          {/* 期限 */}
          {deadlineStr && (
            <span style={{ fontSize: '11px', color: 'var(--text-s)', marginLeft: 'auto' }}>
              期限: {deadlineStr}
            </span>
          )}
        </div>

        {/* チェーンタイトル */}
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '10px' }}>
          {chainTitle}
        </div>

        {/* 進捗バー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            flex: 1, height: '4px',
            background: 'var(--border)', borderRadius: '2px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: 'var(--blue)', borderRadius: '2px',
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-s)', whiteSpace: 'nowrap' }}>
            {progress}%
          </span>

          {/* 展開ボタン */}
          <button
            aria-label={expanded ? '▼ 詳細' : '▶ 詳細'}
            onClick={() => setExpanded(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-s)', fontSize: '12px', padding: '2px 4px',
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* 展開詳細 */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
        }}>
          {plan.steps.map((step, i) => {
            const eq = equipments.find(e => e.equipId === step.equipId)
            const remaining = eq ? calcRemainingCost(step, eq) : null
            const done = step.currentStar >= step.targetStar

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: i < plan.steps.length - 1 ? '8px' : 0,
                opacity: done ? 0.4 : 1,
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-h)', minWidth: '130px' }}>
                  {step.equipName}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-s)' }}>
                  現在 {step.currentStar} → ★{step.targetStar}
                </span>
                {remaining && !done && (
                  <span style={{ fontSize: '11px', color: 'var(--text-s)', marginLeft: 'auto' }}>
                    改修資材 ×{remaining.improveMaterial} / 開発資材 ×{remaining.devMaterial}
                  </span>
                )}
                {done && (
                  <span style={{ fontSize: '11px', color: 'var(--green)', marginLeft: 'auto' }}>完了</span>
                )}
              </div>
            )
          })}

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {onEdit && (
              <button
                aria-label="編集"
                onClick={() => onEdit(plan)}
                style={{
                  fontSize: '12px', padding: '4px 12px',
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '6px', cursor: 'pointer',
                  color: 'var(--text-s)',
                }}
              >
                編集
              </button>
            )}
            <button
              aria-label="アーカイブ"
              onClick={() => onArchive(plan.id)}
              style={{
                fontSize: '12px', padding: '4px 12px',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: '6px', cursor: 'pointer',
                color: 'var(--text-s)',
              }}
            >
              アーカイブ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
