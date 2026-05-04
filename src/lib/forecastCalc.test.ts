import { describe, it, expect } from 'vitest'
import { calcDailyAvg, calcForecast } from './forecastCalc'
import type { ResourceHistoryRecord } from '../types/resource'
// ResourceHistoryRecord のフィールドのみ使用する

// ─── テスト用ヒストリーデータ ─────────────────────────────────

function makeRecord(date: string, fuel: number, ammo: number, steel: number, baux: number): ResourceHistoryRecord {
  return {
    date,
    fuel, ammo, steel, baux,
    instantRepair: 0, instantBuild: 0, devMaterial: 0, improveMaterial: 0,
  }
}

// 7日分: 燃料が毎日+1000ずつ増加
const HISTORY_STEADY: ResourceHistoryRecord[] = [
  makeRecord('2026-04-29', 10000, 20000, 30000, 5000),
  makeRecord('2026-04-30', 11000, 20000, 30000, 5000),
  makeRecord('2026-05-01', 12000, 20000, 30000, 5000),
  makeRecord('2026-05-02', 13000, 20000, 30000, 5000),
  makeRecord('2026-05-03', 14000, 20000, 30000, 5000),
  makeRecord('2026-05-04', 15000, 20000, 30000, 5000),
  makeRecord('2026-05-05', 16000, 20000, 30000, 5000),
]

// ─── calcDailyAvg ─────────────────────────────────────────────

describe('calcDailyAvg', () => {
  it('should return average daily change over N days', () => {
    // Arrange & Act
    const result = calcDailyAvg(HISTORY_STEADY, 'fuel', 7)

    // Assert — (16000-10000) / 6日間 = 1000/day
    expect(result).toBeCloseTo(1000)
  })

  it('should use only last N records', () => {
    // Arrange & Act — 直近3日分のみ
    const result = calcDailyAvg(HISTORY_STEADY, 'fuel', 3)

    // Assert — (16000-14000) / 2日間 = 1000/day（同じ傾き）
    expect(result).toBeCloseTo(1000)
  })

  it('should return 0 when history has less than 2 records', () => {
    // Arrange
    const single = [makeRecord('2026-05-05', 10000, 0, 0, 0)]

    // Act
    const result = calcDailyAvg(single, 'fuel', 7)

    // Assert
    expect(result).toBe(0)
  })

  it('should return negative value when resource is decreasing', () => {
    // Arrange — 燃料が減少
    const decreasing = [
      makeRecord('2026-05-01', 20000, 0, 0, 0),
      makeRecord('2026-05-02', 19000, 0, 0, 0),
      makeRecord('2026-05-03', 18000, 0, 0, 0),
    ]

    // Act
    const result = calcDailyAvg(decreasing, 'fuel', 7)

    // Assert
    expect(result).toBeCloseTo(-1000)
  })
})

// ─── calcForecast ─────────────────────────────────────────────

describe('calcForecast', () => {
  it('should return days and date when reachable', () => {
    // Arrange — 現在16000、目標20000、+1000/day → 4日後
    const result = calcForecast({
      current: 16000,
      target: 20000,
      dailyAvg: 1000,
      fromDate: new Date('2026-05-05'),
    })

    // Assert
    expect(result.reachable).toBe(true)
    expect(result.daysLeft).toBe(4)
    expect(result.reachDate?.toISOString().slice(0, 10)).toBe('2026-05-09')
  })

  it('should return reachable=false when dailyAvg is zero', () => {
    // Arrange
    const result = calcForecast({
      current: 10000,
      target: 20000,
      dailyAvg: 0,
      fromDate: new Date('2026-05-05'),
    })

    // Assert
    expect(result.reachable).toBe(false)
    expect(result.daysLeft).toBeNull()
    expect(result.reachDate).toBeNull()
  })

  it('should return reachable=false when dailyAvg is negative', () => {
    // Arrange
    const result = calcForecast({
      current: 10000,
      target: 20000,
      dailyAvg: -500,
      fromDate: new Date('2026-05-05'),
    })

    // Assert
    expect(result.reachable).toBe(false)
  })

  it('should return daysLeft=0 when already reached', () => {
    // Arrange — 現在値が目標以上
    const result = calcForecast({
      current: 20000,
      target: 20000,
      dailyAvg: 1000,
      fromDate: new Date('2026-05-05'),
    })

    // Assert
    expect(result.reachable).toBe(true)
    expect(result.daysLeft).toBe(0)
  })
})
