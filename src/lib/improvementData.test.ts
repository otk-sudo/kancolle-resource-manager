import { describe, it, expect } from 'vitest'
import {
  needsUpdate,
  parseImprovementData,
} from './improvementData'
import type { ImprovementMasterData } from '../types/improvement'

// ─── needsUpdate ─────────────────────────────────────────────

describe('needsUpdate', () => {
  it('should return true when cached data is null', () => {
    // Arrange
    const cached = null
    const currentGameVersion = '1.0.0'

    // Act
    const result = needsUpdate(cached, currentGameVersion)

    // Assert
    expect(result).toBe(true)
  })

  it('should return true when game version has changed', () => {
    // Arrange
    const cached: ImprovementMasterData = {
      gameVersion: '1.0.0',
      fetchedAt: new Date().toISOString(),
      equipments: [],
    }
    const currentGameVersion = '1.1.0'

    // Act
    const result = needsUpdate(cached, currentGameVersion)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when game version is the same', () => {
    // Arrange
    const cached: ImprovementMasterData = {
      gameVersion: '1.0.0',
      fetchedAt: new Date().toISOString(),
      equipments: [],
    }
    const currentGameVersion = '1.0.0'

    // Act
    const result = needsUpdate(cached, currentGameVersion)

    // Assert
    expect(result).toBe(false)
  })
})

// ─── parseImprovementData ─────────────────────────────────────

const RAW_DATA = {
  gameVersion: '1.2.3',
  equipments: [
    {
      id: 1,
      name: '12.7cm連装砲',
      type: 1,
      costs: Array(10).fill({
        fuel: 0, ammo: 1, steel: 1, baux: 0,
        devMaterial: 1, improveMaterial: 1,
      }),
      secretaryByDay: {
        1: [{ shipId: 101, shipName: '吹雪' }],
        2: [{ shipId: 101, shipName: '吹雪' }],
      },
      upgradeTo: {
        equipId: 2,
        equipName: '12.7cm連装砲B型改二',
        consumeCount: 1,
      },
    },
  ],
}

describe('parseImprovementData', () => {
  it('should parse raw JSON into ImprovementMasterData', () => {
    // Arrange & Act
    const result = parseImprovementData(RAW_DATA, '1.2.3')

    // Assert
    expect(result.gameVersion).toBe('1.2.3')
    expect(result.equipments).toHaveLength(1)
  })

  it('should map equipment fields correctly', () => {
    // Arrange & Act
    const result = parseImprovementData(RAW_DATA, '1.2.3')
    const eq = result.equipments[0]

    // Assert
    expect(eq.equipId).toBe(1)
    expect(eq.equipName).toBe('12.7cm連装砲')
    expect(eq.equipType).toBe(1)
  })

  it('should have 10 cost entries per equipment', () => {
    // Arrange & Act
    const result = parseImprovementData(RAW_DATA, '1.2.3')

    // Assert
    expect(result.equipments[0].costs).toHaveLength(10)
  })

  it('should parse secretaryByDay correctly', () => {
    // Arrange & Act
    const result = parseImprovementData(RAW_DATA, '1.2.3')
    const eq = result.equipments[0]

    // Assert
    expect(eq.secretaryByDay[1]).toHaveLength(1)
    expect(eq.secretaryByDay[1]![0].shipName).toBe('吹雪')
  })

  it('should parse upgradeTo correctly', () => {
    // Arrange & Act
    const result = parseImprovementData(RAW_DATA, '1.2.3')
    const eq = result.equipments[0]

    // Assert
    expect(eq.upgradeTo?.equipId).toBe(2)
    expect(eq.upgradeTo?.equipName).toBe('12.7cm連装砲B型改二')
  })

  it('should set fetchedAt to current time', () => {
    // Arrange
    const before = Date.now()

    // Act
    const result = parseImprovementData(RAW_DATA, '1.2.3')

    // Assert
    const fetchedAt = new Date(result.fetchedAt).getTime()
    expect(fetchedAt).toBeGreaterThanOrEqual(before)
    expect(fetchedAt).toBeLessThanOrEqual(Date.now())
  })
})
