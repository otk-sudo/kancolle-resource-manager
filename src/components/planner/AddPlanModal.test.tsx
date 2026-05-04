import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddPlanModal } from './AddPlanModal'
import { useImprovementStore, getInitialImprovementState } from '../../stores/improvementStore'
import { act } from '@testing-library/react'
import type { ImprovementPlan } from '../../types/improvement'

const EDIT_PLAN: ImprovementPlan = {
  id: 'plan-edit',
  steps: [{ equipId: 1, equipName: '12.7cm連装砲', targetStar: 6, currentStar: 2 }],
  priority: 'high',
  deadline: '2026-07-01',
  archived: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  order: 0,
}

beforeEach(() => {
  act(() => {
    useImprovementStore.setState(getInitialImprovementState())
  })
})

describe('AddPlanModal 新規追加モード', () => {
  it('should call addPlan on submit', () => {
    // Arrange
    render(<AddPlanModal equipments={[]} onClose={vi.fn()} />)

    // Act — 装備名を入力してから追加
    fireEvent.change(screen.getByPlaceholderText('装備名'), { target: { value: 'テスト装備' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    // Assert
    const { plans } = useImprovementStore.getState()
    expect(plans).toHaveLength(1)
    expect(plans[0].steps[0].equipName).toBe('テスト装備')
  })

  it('should call onClose after submit', () => {
    // Arrange
    const onClose = vi.fn()
    render(<AddPlanModal equipments={[]} onClose={onClose} />)

    // Act
    fireEvent.change(screen.getByPlaceholderText('装備名'), { target: { value: 'テスト装備' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    // Assert
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('AddPlanModal 編集モード', () => {
  it('should show 編集 title when editPlan is provided', () => {
    // Arrange & Act
    render(<AddPlanModal equipments={[]} onClose={vi.fn()} editPlan={EDIT_PLAN} />)

    // Assert
    expect(screen.getByText('改修プランを編集')).toBeInTheDocument()
  })

  it('should pre-fill step fields from editPlan', () => {
    // Arrange & Act
    render(<AddPlanModal equipments={[]} onClose={vi.fn()} editPlan={EDIT_PLAN} />)

    // Assert
    expect(screen.getByDisplayValue('12.7cm連装砲')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()  // currentStar
    expect(screen.getByDisplayValue('6')).toBeInTheDocument()  // targetStar
  })

  it('should call updatePlan instead of addPlan on submit', () => {
    // Arrange — ストアにプランを先に追加
    act(() => {
      useImprovementStore.getState().addPlan({
        steps: EDIT_PLAN.steps,
        priority: EDIT_PLAN.priority,
        deadline: EDIT_PLAN.deadline,
      })
    })
    const storedPlan = useImprovementStore.getState().plans[0]
    const editTarget = { ...EDIT_PLAN, id: storedPlan.id }

    render(<AddPlanModal equipments={[]} onClose={vi.fn()} editPlan={editTarget} />)

    // Act — 優先度を変更して保存
    fireEvent.click(screen.getByRole('button', { name: '低' }))
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    // Assert — 既存プランが更新され、新規追加はされない
    const { plans } = useImprovementStore.getState()
    expect(plans).toHaveLength(1)
    expect(plans[0].priority).toBe('low')
  })
})
