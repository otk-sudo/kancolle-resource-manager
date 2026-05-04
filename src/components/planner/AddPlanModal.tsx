import { useState } from 'react'
import { useImprovementStore } from '../../stores/improvementStore'
import type { ImprovableEquipment, ChainStep, Priority, ImprovementPlan } from '../../types/improvement'

interface Props {
  equipments: ImprovableEquipment[]
  onClose: () => void
  /** 編集モード：指定した場合はそのプランを編集する */
  editPlan?: ImprovementPlan
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export function AddPlanModal({ equipments, onClose, editPlan }: Props) {
  const { addPlan, updatePlan } = useImprovementStore()
  const isEdit = editPlan !== undefined

  const [steps, setSteps] = useState<ChainStep[]>(
    isEdit ? editPlan.steps : [{ equipId: 0, equipName: '', targetStar: 6, currentStar: 0 }]
  )
  const [priority, setPriority] = useState<Priority>(isEdit ? editPlan.priority : 'medium')
  const [deadline, setDeadline] = useState(isEdit ? (editPlan.deadline ?? '') : '')

  const handleSubmit = () => {
    const validSteps = steps.filter(s => s.equipId > 0 || s.equipName !== '')
    if (validSteps.length === 0) return

    if (isEdit) {
      updatePlan(editPlan.id, {
        steps: validSteps,
        priority,
        deadline: deadline || undefined,
      })
    } else {
      addPlan({
        steps: validSteps,
        priority,
        deadline: deadline || undefined,
      })
    }
    onClose()
  }

  const updateStep = (i: number, patch: Partial<ChainStep>) => {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  const addStep = () => {
    setSteps(prev => [...prev, { equipId: 0, equipName: '', targetStar: 10, currentStar: 0 }])
  }

  const removeStep = (i: number) => {
    setSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700,
    color: 'var(--text-s)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: '6px', display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '6px', color: 'var(--text-h)',
    fontSize: '13px', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        width: '520px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-h)', marginBottom: '20px' }}>
          {isEdit ? '改修プランを編集' : '改修プランを追加'}
        </h2>

        {/* 改修チェーンステップ */}
        <div style={{ marginBottom: '16px' }}>
          <span style={labelStyle}>改修チェーン</span>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '8px' }}>
              {/* 装備選択 */}
              {equipments.length > 0 ? (
                <select
                  value={step.equipId}
                  onChange={e => {
                    const eq = equipments.find(eq => eq.equipId === Number(e.target.value))
                    updateStep(i, { equipId: Number(e.target.value), equipName: eq?.equipName ?? '' })
                  }}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  <option value={0}>装備を選択</option>
                  {equipments.map(eq => (
                    <option key={eq.equipId} value={eq.equipId}>{eq.equipName}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="装備名"
                  value={step.equipName}
                  onChange={e => updateStep(i, { equipName: e.target.value, equipId: i + 1 })}
                  style={{ ...inputStyle, flex: 2 }}
                />
              )}
              {/* 現在★ */}
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: '10px' }}>現在★</label>
                <input
                  type="number" min={0} max={10}
                  value={step.currentStar}
                  onChange={e => updateStep(i, { currentStar: Number(e.target.value) })}
                  style={{ ...inputStyle }}
                />
              </div>
              {/* 目標★ */}
              <div style={{ flex: 1 }}>
                <label style={{ ...labelStyle, fontSize: '10px' }}>目標★</label>
                <input
                  type="number" min={1} max={10}
                  value={step.targetStar}
                  onChange={e => updateStep(i, { targetStar: Number(e.target.value) })}
                  style={{ ...inputStyle }}
                />
              </div>
              {/* 削除ボタン */}
              {steps.length > 1 && (
                <button
                  onClick={() => removeStep(i)}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: '6px', cursor: 'pointer',
                    color: 'var(--text-s)', padding: '7px 10px', fontSize: '12px',
                  }}
                >✕</button>
              )}
            </div>
          ))}
          <button
            onClick={addStep}
            style={{
              fontSize: '12px', color: 'var(--blue)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            + ステップを追加
          </button>
        </div>

        {/* 優先度 */}
        <div style={{ marginBottom: '16px' }}>
          <span style={labelStyle}>優先度</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                style={{
                  flex: 1, padding: '7px',
                  background: priority === opt.value ? 'var(--blue)' : 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: priority === opt.value ? '#fff' : 'var(--text-m)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 期限（任意） */}
        <div style={{ marginBottom: '24px' }}>
          <span style={labelStyle}>期限（任意）</span>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', fontSize: '13px',
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '6px', cursor: 'pointer', color: 'var(--text-m)',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 20px', fontSize: '13px', fontWeight: 600,
              background: 'var(--blue)', border: 'none',
              borderRadius: '6px', cursor: 'pointer', color: '#fff',
            }}
          >
            {isEdit ? '保存' : '追加'}
          </button>
        </div>
      </div>
    </div>
  )
}
