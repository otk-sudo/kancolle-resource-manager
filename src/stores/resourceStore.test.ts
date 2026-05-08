import { describe, it, expect, beforeEach } from 'vitest'
import { useResourceStore } from './resourceStore'

describe('useResourceStore', () => {
  beforeEach(() => {
    // 各テスト前にストアを初期状態にリセット
    useResourceStore.setState({
      basicResources: [
        { id: 'fuel',  name: '燃料',        value: 0, cap: 350000 },
        { id: 'ammo',  name: '弾薬',        value: 0, cap: 350000 },
        { id: 'steel', name: '鋼材',        value: 0, cap: 350000 },
        { id: 'baux',  name: 'ボーキサイト', value: 0, cap: 350000 },
      ],
      specialResources: [
        { id: 'instantRepair',   name: '高速修復材', value: 0, cap: 3000 },
        { id: 'instantBuild',    name: '高速建造材', value: 0, cap: 3000 },
        { id: 'devMaterial',     name: '開発資材',   value: 0, cap: 3000 },
        { id: 'improveMaterial', name: '改修資材',   value: 0, cap: 3000 },
      ],
      history: [],
      historyVersion: 0,
    })
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

    it('should merge and sort history when importHistory is called', () => {
      // Arrange
      const { importHistory } = useResourceStore.getState()
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
      importHistory([record])

      // Assert
      const { history } = useResourceStore.getState()
      expect(history).toHaveLength(1)
      expect(history[0].date).toBe('2026-05-05')
      expect(history[0].fuel).toBe(245000)
    })
  })

  describe('updateFromLatest', () => {
    it('should update all resources from latest record', () => {
      // Arrange: 最新レコード1件を用意する
      const latest = {
        date: '2026-05-08',
        fuel: 300000,
        ammo: 250000,
        steel: 280000,
        baux: 120000,
        instantRepair: 600,
        instantBuild: 90,
        devMaterial: 400,
        improveMaterial: 25,
      }
      const { updateFromLatest } = useResourceStore.getState()

      // Act: updateFromLatest を単一呼び出しで実行する
      updateFromLatest(latest)

      // Assert: basicResources の全4資材が更新されていること
      const { basicResources, specialResources } = useResourceStore.getState()
      expect(basicResources.find(r => r.id === 'fuel')?.value).toBe(300000)
      expect(basicResources.find(r => r.id === 'ammo')?.value).toBe(250000)
      expect(basicResources.find(r => r.id === 'steel')?.value).toBe(280000)
      expect(basicResources.find(r => r.id === 'baux')?.value).toBe(120000)
      // Assert: specialResources の全4資材が更新されていること
      expect(specialResources.find(r => r.id === 'instantRepair')?.value).toBe(600)
      expect(specialResources.find(r => r.id === 'instantBuild')?.value).toBe(90)
      expect(specialResources.find(r => r.id === 'devMaterial')?.value).toBe(400)
      expect(specialResources.find(r => r.id === 'improveMaterial')?.value).toBe(25)
    })

    it('should increment historyVersion when updateFromLatest is called', () => {
      // Arrange: 初期 historyVersion を確認する
      const initialVersion = useResourceStore.getState().historyVersion
      const latest = {
        date: '2026-05-08',
        fuel: 100000,
        ammo: 100000,
        steel: 100000,
        baux: 50000,
        instantRepair: 100,
        instantBuild: 50,
        devMaterial: 100,
        improveMaterial: 10,
      }
      const { updateFromLatest } = useResourceStore.getState()

      // Act: updateFromLatest を呼び出す
      updateFromLatest(latest)

      // Assert: historyVersion がインクリメントされていること
      const { historyVersion } = useResourceStore.getState()
      expect(historyVersion).toBe(initialVersion + 1)
    })
  })
})
