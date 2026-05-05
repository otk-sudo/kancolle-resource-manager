import { describe, it, expect, beforeEach } from 'vitest'
import { useResourceStore } from './resourceStore'

describe('useResourceStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useResourceStore.setState(useResourceStore.getInitialState())
  })

  describe('基本資材', () => {
    it('should initialize basic resources with correct default values', () => {
      // Arrange & Act
      const { basicResources } = useResourceStore.getState()

      // Assert
      expect(basicResources).toHaveLength(4)
      expect(basicResources[0].id).toBe('fuel')
      expect(basicResources[1].id).toBe('ammo')
      expect(basicResources[2].id).toBe('steel')
      expect(basicResources[3].id).toBe('baux')
    })

    it('should have cap of 350000 for all basic resources', () => {
      // Arrange & Act
      const { basicResources } = useResourceStore.getState()

      // Assert
      basicResources.forEach(r => {
        expect(r.cap).toBe(350000)
      })
    })

    it('should update a basic resource value when setBasicResource is called', () => {
      // Arrange
      const { setBasicResource } = useResourceStore.getState()

      // Act
      setBasicResource('fuel', 100000)

      // Assert
      const { basicResources } = useResourceStore.getState()
      const fuel = basicResources.find(r => r.id === 'fuel')
      expect(fuel?.value).toBe(100000)
    })
  })

  describe('特殊資材', () => {
    it('should initialize special resources with 4 items', () => {
      // Arrange & Act
      const { specialResources } = useResourceStore.getState()

      // Assert
      expect(specialResources).toHaveLength(4)
    })

    it('should have cap of 3000 for all special resources', () => {
      // Arrange & Act
      const { specialResources } = useResourceStore.getState()

      // Assert
      specialResources.forEach(r => {
        expect(r.cap).toBe(3000)
      })
    })

    it('should update a special resource value when setSpecialResource is called', () => {
      // Arrange
      const { setSpecialResource } = useResourceStore.getState()

      // Act
      setSpecialResource('improveMaterial', 25)

      // Assert
      const { specialResources } = useResourceStore.getState()
      const screw = specialResources.find(r => r.id === 'improveMaterial')
      expect(screw?.value).toBe(25)
    })
  })

  describe('履歴データ', () => {
    it('should initialize with empty history', () => {
      // Arrange & Act
      const { history } = useResourceStore.getState()

      // Assert
      expect(history).toHaveLength(0)
    })

    it('should add a history record when addHistoryRecord is called', () => {
      // Arrange
      const { addHistoryRecord } = useResourceStore.getState()
      const record = {
        date: '2026-05-05',
        fuel: 245000,
        ammo: 198000,
        steel: 267000,
        baux: 87000,
        instantRepair: 520,
        instantBuild: 78,
        devMaterial: 340,
        improveMaterial: 15,
      }

      // Act
      addHistoryRecord(record)

      // Assert
      const { history } = useResourceStore.getState()
      expect(history).toHaveLength(1)
      expect(history[0].date).toBe('2026-05-05')
      expect(history[0].fuel).toBe(245000)
    })
  })
})
