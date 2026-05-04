import { describe, it, expect, beforeEach } from 'vitest'
import { useImprovementStore, getInitialImprovementState } from './improvementStore'
import { act } from '@testing-library/react'

beforeEach(() => {
  act(() => {
    useImprovementStore.setState(getInitialImprovementState())
  })
})

describe('addPlan', () => {
  it('should add a new plan to the list', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()

    // Act
    act(() => {
      addPlan({
        steps: [{ equipId: 1, equipName: '12.7cm連装砲', targetStar: 6, currentStar: 0 }],
        priority: 'high',
        deadline: undefined,
      })
    })

    // Assert
    const { plans } = useImprovementStore.getState()
    expect(plans).toHaveLength(1)
    expect(plans[0].steps[0].equipName).toBe('12.7cm連装砲')
  })

  it('should assign a unique id and createdAt', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()

    // Act
    act(() => {
      addPlan({ steps: [], priority: 'medium', deadline: undefined })
      addPlan({ steps: [], priority: 'low', deadline: undefined })
    })

    // Assert
    const { plans } = useImprovementStore.getState()
    expect(plans[0].id).not.toBe(plans[1].id)
    expect(plans[0].createdAt).toBeTruthy()
  })

  it('should set archived to false by default', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()

    // Act
    act(() => {
      addPlan({ steps: [], priority: 'medium', deadline: undefined })
    })

    // Assert
    const { plans } = useImprovementStore.getState()
    expect(plans[0].archived).toBe(false)
  })
})

describe('updatePlan', () => {
  it('should update fields of an existing plan', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()
    act(() => {
      addPlan({ steps: [], priority: 'low', deadline: undefined })
    })
    const planId = useImprovementStore.getState().plans[0].id

    // Act
    act(() => {
      useImprovementStore.getState().updatePlan(planId, { priority: 'high' })
    })

    // Assert
    const updated = useImprovementStore.getState().plans[0]
    expect(updated.priority).toBe('high')
  })

  it('should update currentStar of a step', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()
    act(() => {
      addPlan({
        steps: [{ equipId: 1, equipName: '砲', targetStar: 6, currentStar: 0 }],
        priority: 'medium',
        deadline: undefined,
      })
    })
    const planId = useImprovementStore.getState().plans[0].id

    // Act
    act(() => {
      useImprovementStore.getState().updatePlan(planId, {
        steps: [{ equipId: 1, equipName: '砲', targetStar: 6, currentStar: 3 }],
      })
    })

    // Assert
    const updated = useImprovementStore.getState().plans[0]
    expect(updated.steps[0].currentStar).toBe(3)
  })
})

describe('archivePlan', () => {
  it('should set archived to true', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()
    act(() => {
      addPlan({ steps: [], priority: 'high', deadline: undefined })
    })
    const planId = useImprovementStore.getState().plans[0].id

    // Act
    act(() => {
      useImprovementStore.getState().archivePlan(planId)
    })

    // Assert
    const plan = useImprovementStore.getState().plans[0]
    expect(plan.archived).toBe(true)
  })
})

describe('reorderPlans', () => {
  it('should update order field of each plan', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()
    act(() => {
      addPlan({ steps: [], priority: 'high', deadline: undefined })
      addPlan({ steps: [], priority: 'low', deadline: undefined })
    })
    const ids = useImprovementStore.getState().plans.map(p => p.id)

    // Act — 順序を逆にする
    act(() => {
      useImprovementStore.getState().reorderPlans([ids[1], ids[0]])
    })

    // Assert
    const plans = useImprovementStore.getState().plans
    const first = plans.find(p => p.id === ids[1])
    const second = plans.find(p => p.id === ids[0])
    expect(first!.order).toBeLessThan(second!.order)
  })
})

describe('activePlans / archivedPlans selectors', () => {
  it('should return only non-archived plans as activePlans', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()
    act(() => {
      addPlan({ steps: [], priority: 'high', deadline: undefined })
      addPlan({ steps: [], priority: 'low', deadline: undefined })
    })
    const planId = useImprovementStore.getState().plans[0].id
    act(() => {
      useImprovementStore.getState().archivePlan(planId)
    })

    // Act
    const { activePlans } = useImprovementStore.getState()

    // Assert
    expect(activePlans()).toHaveLength(1)
  })

  it('should return only archived plans as archivedPlans', () => {
    // Arrange
    const { addPlan } = useImprovementStore.getState()
    act(() => {
      addPlan({ steps: [], priority: 'high', deadline: undefined })
    })
    const planId = useImprovementStore.getState().plans[0].id
    act(() => {
      useImprovementStore.getState().archivePlan(planId)
    })

    // Act
    const { archivedPlans } = useImprovementStore.getState()

    // Assert
    expect(archivedPlans()).toHaveLength(1)
  })
})
