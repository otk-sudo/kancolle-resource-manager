import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from '@testing-library/react'
import { ImprovementPlanner } from './ImprovementPlanner'
import { useImprovementStore, getInitialImprovementState } from '../stores/improvementStore'

beforeEach(() => {
  act(() => {
    useImprovementStore.setState(getInitialImprovementState())
  })
})

function addPlan(priority: 'high' | 'medium' | 'low', name: string) {
  act(() => {
    useImprovementStore.getState().addPlan({
      steps: [{ equipId: 1, equipName: name, targetStar: 6, currentStar: 0 }],
      priority,
      deadline: undefined,
    })
  })
}

describe('ImprovementPlanner 優先度グループ表示', () => {
  it('should display priority section headers', () => {
    // Arrange & Act
    render(<ImprovementPlanner />)

    // Assert
    expect(screen.getByText('高')).toBeInTheDocument()
    expect(screen.getByText('中')).toBeInTheDocument()
    expect(screen.getByText('低')).toBeInTheDocument()
  })

  it('should show plans under correct priority section', () => {
    // Arrange
    addPlan('high', '高優先装備')
    addPlan('low', '低優先装備')

    // Act
    render(<ImprovementPlanner />)

    // Assert
    expect(screen.getByText('高優先装備')).toBeInTheDocument()
    expect(screen.getByText('低優先装備')).toBeInTheDocument()
  })

  it('should show empty drop hint when section has no plans', () => {
    // Arrange & Act
    render(<ImprovementPlanner />)

    // Assert — 全セクションが空なのでドロップヒントが表示される
    expect(screen.getAllByText(/ここにドロップして/)).toHaveLength(3)
  })
})

describe('ImprovementPlanner ストア経由での優先度変更', () => {
  it('should change priority via updatePlan', () => {
    // Arrange
    addPlan('high', '移動する装備')
    const planId = useImprovementStore.getState().plans[0].id

    // Act — ストアを直接操作（@dnd-kit のポインターイベントはjsdomで再現困難）
    act(() => {
      useImprovementStore.getState().updatePlan(planId, { priority: 'low' })
    })

    // Assert
    const updated = useImprovementStore.getState().plans.find(p => p.id === planId)
    expect(updated?.priority).toBe('low')
  })

  it('should reorder plans within same priority via reorderPlans', () => {
    // Arrange
    addPlan('high', '装備A')
    addPlan('high', '装備B')
    const [planA, planB] = useImprovementStore.getState().plans

    // Act — 順序を逆にする
    act(() => {
      useImprovementStore.getState().reorderPlans([planB.id, planA.id])
    })

    // Assert
    const plans = useImprovementStore.getState().plans
    const updatedA = plans.find(p => p.id === planA.id)
    const updatedB = plans.find(p => p.id === planB.id)
    expect(updatedB!.order).toBeLessThan(updatedA!.order)
  })
})
