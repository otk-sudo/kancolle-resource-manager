import { describe, it, expect } from 'vitest'
import { buildChartData } from './forecastChartData'
import type { ResourceHistoryRecord } from '../types/resource'

function makeRecord(date: string, fuel: number): ResourceHistoryRecord {
  return {
    date, fuel, ammo: 0, steel: 0, baux: 0,
    instantRepair: 0, instantBuild: 0, devMaterial: 0, improveMaterial: 0,
  }
}

const HISTORY: ResourceHistoryRecord[] = [
  makeRecord('2026-05-01', 100000),
  makeRecord('2026-05-02', 110000),
  makeRecord('2026-05-03', 120000),
]

describe('buildChartData', () => {
  it('should include historical data points', () => {
    // Arrange & Act
    const result = buildChartData({
      history: HISTORY,
      resources: [{ id: 'fuel', label: '燃料', target: 350000 }],
      days: 7,
      today: new Date('2026-05-03'),
    })

    // Assert
    const histPoints = result.filter(p => p.type === 'history')
    expect(histPoints.length).toBeGreaterThanOrEqual(3)
  })

  it('should calculate percentage of target for history', () => {
    // Arrange & Act
    const result = buildChartData({
      history: HISTORY,
      resources: [{ id: 'fuel', label: '燃料', target: 200000 }],
      days: 7,
      today: new Date('2026-05-03'),
    })

    // Assert — 100000 / 200000 = 50%
    const firstHist = result.find(p => p.date === '2026-05-01')
    expect(firstHist?.fuel).toBeCloseTo(50)
  })

  it('should include forecast data points after today', () => {
    // Arrange & Act — +10000/day, target=200000, 現在120000 → 残り80000 → 8日後
    const result = buildChartData({
      history: HISTORY,
      resources: [{ id: 'fuel', label: '燃料', target: 200000 }],
      days: 7,
      today: new Date('2026-05-03'),
    })

    // Assert
    const forecastPoints = result.filter(p => p.type === 'forecast')
    expect(forecastPoints.length).toBeGreaterThan(0)
  })

  it('should cap forecast values at 100%', () => {
    // Arrange & Act — 既に目標超え
    const overTarget = [makeRecord('2026-05-03', 250000)]
    const result = buildChartData({
      history: overTarget,
      resources: [{ id: 'fuel', label: '燃料', target: 200000 }],
      days: 7,
      today: new Date('2026-05-03'),
    })

    // Assert
    const point = result.find(p => p.date === '2026-05-03')
    expect(point?.fuel).toBeLessThanOrEqual(100)
  })

  it('should return empty forecast when resource is not reachable', () => {
    // Arrange — 毎日減少
    const decreasing = [
      makeRecord('2026-05-01', 150000),
      makeRecord('2026-05-02', 140000),
      makeRecord('2026-05-03', 130000),
    ]

    // Act
    const result = buildChartData({
      history: decreasing,
      resources: [{ id: 'fuel', label: '燃料', target: 350000 }],
      days: 7,
      today: new Date('2026-05-03'),
    })

    // Assert — 到達不可なので予測ポイントなし
    const forecastPoints = result.filter(p => p.type === 'forecast')
    expect(forecastPoints.length).toBe(0)
  })
})
