import { describe, it, expect } from 'vitest'
import { calcRemainingCost, calcWeeklyTotal, getTodayAvailableEquips } from './improvementCalc'
import type { ImprovementPlan, ImprovableEquipment } from '../types/improvement'

const MOCK_COST = {
  fuel: 0, ammo: 1, steel: 1, baux: 0,
  devMaterial: 1, improveMaterial: 2,
}

const MOCK_EQUIPMENT: ImprovableEquipment = {
  equipId: 1,
  equipName: '12.7cm連装砲',
  equipType: 1,
  costs: Array(10).fill(MOCK_COST),
  secretaryByDay: {
    1: [{ shipId: 101, shipName: '吹雪' }],
    2: [{ shipId: 101, shipName: '吹雪' }],
  },
}

// ─── calcRemainingCost ────────────────────────────────────────

describe('calcRemainingCost', () => {
  it('should return zero cost when currentStar equals targetStar', () => {
    // Arrange
    const step = { equipId: 1, equipName: '砲', targetStar: 6, currentStar: 6 }

    // Act
    const result = calcRemainingCost(step, MOCK_EQUIPMENT)

    // Assert
    expect(result.improveMaterial).toBe(0)
    expect(result.devMaterial).toBe(0)
  })

  it('should sum costs from currentStar to targetStar', () => {
    // Arrange — ★2 → ★4 なので2回分
    const step = { equipId: 1, equipName: '砲', targetStar: 4, currentStar: 2 }

    // Act
    const result = calcRemainingCost(step, MOCK_EQUIPMENT)

    // Assert
    expect(result.improveMaterial).toBe(MOCK_COST.improveMaterial * 2)
    expect(result.devMaterial).toBe(MOCK_COST.devMaterial * 2)
  })
})

// ─── calcWeeklyTotal ──────────────────────────────────────────

describe('calcWeeklyTotal', () => {
  it('should return zeros when no active plans', () => {
    // Arrange
    const plans: ImprovementPlan[] = []
    const equipments: ImprovableEquipment[] = []

    // Act
    const result = calcWeeklyTotal(plans, equipments)

    // Assert
    expect(result.improveMaterial).toBe(0)
    expect(result.devMaterial).toBe(0)
  })

  it('should sum remaining costs across all active plan steps', () => {
    // Arrange
    const plan: ImprovementPlan = {
      id: '1',
      steps: [
        { equipId: 1, equipName: '砲', targetStar: 4, currentStar: 2 }, // 2回分
      ],
      priority: 'high',
      deadline: undefined,
      archived: false,
      createdAt: new Date().toISOString(),
      order: 0,
    }

    // Act
    const result = calcWeeklyTotal([plan], [MOCK_EQUIPMENT])

    // Assert — 2回分のimprove=4, dev=2
    expect(result.improveMaterial).toBe(MOCK_COST.improveMaterial * 2)
    expect(result.devMaterial).toBe(MOCK_COST.devMaterial * 2)
  })
})

// ─── getTodayAvailableEquips ──────────────────────────────────

describe('getTodayAvailableEquips', () => {
  it('should return equipments available on the given weekday', () => {
    // Arrange — 月曜日(1)は使用可能
    const weekday = 1

    // Act
    const result = getTodayAvailableEquips([MOCK_EQUIPMENT], weekday)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].equipName).toBe('12.7cm連装砲')
  })

  it('should return empty when no equipment is available on the given weekday', () => {
    // Arrange — 水曜日(3)は設定なし
    const weekday = 3

    // Act
    const result = getTodayAvailableEquips([MOCK_EQUIPMENT], weekday)

    // Assert
    expect(result).toHaveLength(0)
  })
})
